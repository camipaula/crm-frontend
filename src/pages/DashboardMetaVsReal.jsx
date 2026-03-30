import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, PieChart,
  Pie, Cell, ReferenceLine,
} from "recharts";
import "../styles/dashboardMetas.css";
import "../styles/dashboardMetaVsReal.css";

/* ─── Constantes ─────────────────────────────────────────── */
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const PIE_PALETTE = ["#1a73e8", "#34a853", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f43f5e", "#84cc16"];
const CHART_META = "#1a73e8";
const CHART_REAL = "#34a853";
const CHART_LINE = "#0d9488";
const CHART_REF = "#94a3b8";

/* ─── Helpers ────────────────────────────────────────────── */
const r2 = (n) => (n != null && isFinite(n) ? Math.round(n * 100) / 100 : null);
const pct = (n) => (n != null ? `${(n * 100).toFixed(1)}%` : "—");
const usd = (n) =>
  n != null && !isNaN(n)
    ? `$${Number(n).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

const levelClass = (c) =>
  c == null ? "muted" : c >= 1 ? "ok" : c >= 0.8 ? "warn" : "danger";

const cumplStyle = (c) => ({
  fontWeight: 700,
  color: c == null ? undefined : c >= 1 ? "#059669" : c >= 0.8 ? "#d97706" : "#dc2626",
});

/* ─── Tooltip genérico ───────────────────────────────────── */
const ChartTooltip = ({ active, payload, label, render }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-comparacion">
      <strong style={{ display: "block", marginBottom: 4 }}>{label}</strong>
      {render(payload)}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const DashboardMetaVsReal = () => {
  const navigate = useNavigate();
  const actual = new Date().getFullYear();

  /* ── Estado de filtros ── */
  const [anio, setAnio] = useState(actual);
  const [mes, setMes] = useState("");
  const [cedula, setCedula] = useState("");
  const [idCateg, setIdCateg] = useState("");

  /* ── Estado de catálogos ── */
  const [vendedoras, setVendedoras] = useState([]);
  const [codigosExternos, setCodigosExternos] = useState([]);
  const [matches, setMatches] = useState({});
  const [categorias, setCategorias] = useState([]);

  /* ── Estado de datos ── */
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ── Sincronización ── */
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  /* ── Config API ── */
  const base = () => (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");
  const token = () => localStorage.getItem("token");
  const auth = () => ({ Authorization: `Bearer ${token()}` });

  const [openDropdown, setOpenDropdown] = useState(null); 
  const [searchTerm, setSearchTerm] = useState("");

  /* ── Cargar catálogos al montar ── */
  useEffect(() => {
    fetch(`${base()}/api/usuarios/vendedoras`, { headers: auth() })
      .then(r => r.ok ? r.json() : [])
      .then(d => setVendedoras(Array.isArray(d) ? d : []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    cargarCodigosYMatches();
  }, []);

  const cargarCodigosYMatches = async () => {
    try {
      const [resCodigos, resMatches] = await Promise.all([
        fetch(`${base()}/api/ventas/codigos-externos`, { headers: auth() }),
        fetch(`${base()}/api/ventas/matches-vendedoras`, { headers: auth() })
      ]);

      if (resCodigos.ok) {
        setCodigosExternos(await resCodigos.json());
      }
      
      if (resMatches.ok) {
        const d = await resMatches.json();
        const map = {};
        d.forEach(m => { map[m.id_usuario] = m.codigos; });
        setMatches(map);
      }
    } catch (e) {
      console.error("Error cargando códigos y matches", e);
    }
  };

  /* ── Recargar datos cuando cambian los filtros ── */
  useEffect(() => { cargar(); }, [anio, mes, cedula, idCateg]);

  const cargar = async () => {
    setLoading(true); setError(""); setSyncMsg("");
    try {
      let url = `${base()}/api/dashboard/metas-comparacion?anio=${anio}`;
      if (mes) url += `&mes=${mes}`;
      if (cedula) url += `&cedula_vendedora=${encodeURIComponent(cedula)}`;
      if (idCateg) url += `&id_categoria_venta=${idCateg}`;

      const res = await fetch(url, { headers: auth() });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);

      setData(json);
      if (Array.isArray(json.categorias)) setCategorias(json.categorias);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const sincronizar = async () => {
    setSyncing(true); setSyncMsg("");
    try {
      const res = await fetch(`${base()}/api/ventas/sincronizar?anio=${anio}`, {
        method: "POST", headers: auth(),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Error al sincronizar");
      setSyncMsg(`✓ Procesados: ${json.procesados ?? 0}, creados: ${json.creados ?? 0}, actualizados: ${json.actualizados ?? 0}.`);
      
      await cargarCodigosYMatches(); 
      await cargar();
    } catch (e) {
      setSyncMsg(`✗ ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const toggleCodigoMatch = (idUsuario, codigo) => {
    setMatches(prevMatches => {
      const nuevosMatches = { ...prevMatches };

      if (nuevosMatches[idUsuario]?.includes(codigo)) {
        nuevosMatches[idUsuario] = nuevosMatches[idUsuario].filter(c => c !== codigo);
        return nuevosMatches;
      }

      Object.keys(nuevosMatches).forEach(key => {
        nuevosMatches[key] = nuevosMatches[key].filter(c => c !== codigo);
      });

      nuevosMatches[idUsuario] = [...(nuevosMatches[idUsuario] || []), codigo];
      return nuevosMatches;
    });
  };

  /* ─── Datos derivados del response ────────────────────── */
  const kpis = data?.kpis ?? {};
  const porMes = data?.comparacionPorMes ?? [];
  const porVend = data?.comparacionPorVendedora ?? [];
  const porCategoria = useMemo(() => data?.comparacionPorCategoria ?? [], [data]);
  const mesNum = data?.periodo?.mes ?? null;
  const periodoLabel = mesNum ? `${MESES[mesNum - 1]} ${anio}` : `${anio}`;

  const topVendedoras = useMemo(() =>
    porVend
      .filter(r => r.tipo === "match")
      .map(r => ({
        nombre: r.nombre || r.cedula_ruc || "—",
        cumplimiento: mesNum != null ? r.cumplimientoMes : r.cumplimientoAnio,
        meta: mesNum != null ? r.metaMes : r.metaAnio,
        real: mesNum != null ? r.realMes : r.realAnio,
      }))
      .filter(r => r.cumplimiento != null)
      .sort((a, b) => (b.cumplimiento ?? 0) - (a.cumplimiento ?? 0))
      .slice(0, 5)
    , [porVend, mesNum]);

  const enRiesgo = useMemo(() =>
    porVend.filter(r => {
      if (r.tipo !== "match") return false;
      const c = mesNum != null ? r.cumplimientoMes : r.cumplimientoAnio;
      return c != null && c < 0.7;
    })
    , [porVend, mesNum]);

  const soloCRM = useMemo(() => porVend.filter(r => r.tipo === "solo_meta"), [porVend]);
  const soloAPI = useMemo(() => porVend.filter(r => r.tipo === "solo_real_externa"), [porVend]);

  const donutMeta = useMemo(() =>
    porCategoria.map((c, i) => ({ name: c.categoria, value: c.meta ?? 0, fill: PIE_PALETTE[i % PIE_PALETTE.length] }))
    , [porCategoria]);
  const donutReal = useMemo(() =>
    porCategoria.map((c, i) => ({ name: c.categoria, value: c.real ?? 0, fill: PIE_PALETTE[i % PIE_PALETTE.length] }))
    , [porCategoria]);

  const totalDonutMeta = useMemo(() => donutMeta.reduce((s, x) => s + x.value, 0), [donutMeta]);
  const totalDonutReal = useMemo(() => donutReal.reduce((s, x) => s + x.value, 0), [donutReal]);

  const gapMes = (kpis.realTotalMes != null && kpis.metaTotalMes != null) ? r2(kpis.realTotalMes - kpis.metaTotalMes) : null;
  const gapAnio = (kpis.realAcumuladaAnio != null && kpis.metaAcumuladaAnio != null) ? r2(kpis.realAcumuladaAnio - kpis.metaAcumuladaAnio) : null;

  const heatmapData = useMemo(() =>
    porMes.map(m => ({ ...m, esActivo: mesNum != null && m.mes === mesNum }))
    , [porMes, mesNum]);

  if (loading && !data) return (
    <div className="dashboard-metas-container dashboard-meta-vs-real">
      <button type="button" className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>
      <p className="loading-msg">Cargando comparación meta vs real...</p>
    </div>
  );
  if (error && !data) return (
    <div className="dashboard-metas-container dashboard-meta-vs-real">
      <button type="button" className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>
      <p className="error-msg">{error}</p>
    </div>
  );

  return (
    <div className="dashboard-metas-container dashboard-meta-vs-real">

      {/* ── Header ── */}
      <button type="button" className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>
      <h1 className="title">Meta vs Real</h1>
      <p className="subtitle">
        Comparación de metas (forecast) con ventas reales · {periodoLabel}
        {idCateg && categorias.find(c => c.id_categoria_venta === Number(idCateg))
          ? ` · ${categorias.find(c => c.id_categoria_venta === Number(idCateg)).nombre}`
          : ""}
      </p>

      {/* ── Filtros ── */}
      <div className="filtros-metas">
        <label>
          Año:
          <select value={anio} onChange={e => setAnio(Number(e.target.value))}>
            {[actual - 2, actual - 1, actual, actual + 1, actual + 2]
              .filter(y => y >= 2024)
              .map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>

        <label>
          Mes:
          <select value={mes} onChange={e => { setMes(e.target.value); }}>
            <option value="">Todo el año</option>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </label>

        <label>
          Vendedora:
          <select value={cedula} onChange={e => setCedula(e.target.value)}>
            <option value="">Todas</option>
            {vendedoras.map(v => (
              <option key={v.cedula_ruc} value={v.cedula_ruc}>{v.nombre}</option>
            ))}
          </select>
        </label>

        <label>
          Categoría:
          <select value={idCateg} onChange={e => setIdCateg(e.target.value)}>
            <option value="">Todas</option>
            {categorias.map(c => (
              <option key={c.id_categoria_venta} value={c.id_categoria_venta}>{c.nombre}</option>
            ))}
          </select>
        </label>

        <div className="filtros-metas-actions">
          <button type="button" className="btn-sincronizar" onClick={sincronizar} disabled={syncing}>
            {syncing ? "Sincronizando..." : "🔄 Actualizar totales reales"}
          </button>
        </div>
      </div>

      {syncMsg && (
        <p className={syncMsg.startsWith("✗") ? "sync-error" : "sync-success"}>{syncMsg}</p>
      )}

      {/* ══ KPIs ══ */}
      <h2 className="section-title">📊 Resumen general — {periodoLabel}</h2>
      <div className="kpis-grid kpis-comparacion">

        <div className="kpi-card">
          <span className="kpi-label">Meta acumulada año</span>
          <span className="kpi-value meta">{usd(kpis.metaAcumuladaAnio)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Real acumulado año</span>
          <span className="kpi-value real">{usd(kpis.realAcumuladaAnio)}</span>
        </div>
        <div className="kpi-card destacado">
          <span className="kpi-label">Cumplimiento año</span>
          <span className={`kpi-value ${levelClass(kpis.cumplimientoAnio)}`}>{pct(kpis.cumplimientoAnio)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Gap año (real − meta)</span>
          <span className={`kpi-value ${gapAnio == null ? "" : gapAnio >= 0 ? "ok" : "danger"}`}>
            {gapAnio != null ? usd(gapAnio) : "—"}
          </span>
          {gapAnio != null && (
            <span className="kpi-sub">{gapAnio >= 0 ? "Por encima de la meta" : "Por debajo de la meta"}</span>
          )}
        </div>

        {mesNum != null && <>
          <div className="kpi-card">
            <span className="kpi-label">Meta {MESES[mesNum - 1]}</span>
            <span className="kpi-value meta">{usd(kpis.metaTotalMes)}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Real {MESES[mesNum - 1]}</span>
            <span className="kpi-value real">{usd(kpis.realTotalMes)}</span>
          </div>
          <div className="kpi-card destacado">
            <span className="kpi-label">Cumplimiento {MESES[mesNum - 1]}</span>
            <span className={`kpi-value ${levelClass(kpis.cumplimientoMes)}`}>{pct(kpis.cumplimientoMes)}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Gap mes (real − meta)</span>
            <span className={`kpi-value ${gapMes == null ? "" : gapMes >= 0 ? "ok" : "danger"}`}>
              {gapMes != null ? usd(gapMes) : "—"}
            </span>
            {gapMes != null && (
              <span className="kpi-sub">{gapMes >= 0 ? "Por encima" : "Por debajo"}</span>
            )}
          </div>
        </>}
      </div>

      {/* ══ Por categoría ══ */}
      {porCategoria.length > 0 && <>
        <h2 className="section-title">
          🏷️ Cumplimiento por categoría — {periodoLabel}
        </h2>
        <div className="mvr-card-grid-2">
          <div className="mvr-card">
            <p className="mvr-card-title">Meta vs Real</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={porCategoria} margin={{ top: 8, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="categoria" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip active={active} payload={payload} label={label} render={p => <>
                      <div>Meta: {usd(p.find(x => x.dataKey === "meta")?.value)}</div>
                      <div>Real: {usd(p.find(x => x.dataKey === "real")?.value)}</div>
                      <div>Cumpl.: {pct(p[0]?.payload?.cumplimiento)}</div>
                    </>} />
                  )}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="meta" name="Meta" fill={CHART_META} radius={[4, 4, 0, 0]} />
                <Bar dataKey="real" name="Real" fill={CHART_REAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mvr-card">
            <p className="mvr-card-title">Ranking por cumplimiento</p>
            <div className="ranking-list">
              {[...porCategoria]
                .sort((a, b) => (b.cumplimiento ?? 0) - (a.cumplimiento ?? 0))
                .map((c, i) => {
                  const lvl = levelClass(c.cumplimiento);
                  const w = Math.min((c.cumplimiento ?? 0) * 100, 100);
                  return (
                    <div key={i}>
                      <div className="ranking-row-label">
                        <span>{c.categoria}</span>
                        <span className={`pct ${lvl}`}>{pct(c.cumplimiento)}</span>
                      </div>
                      <div className="ranking-bar-bg">
                        <div className={`ranking-bar-fill ${lvl}`} style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </>}

      {/* ══ Top vendedoras ══ */}
      {topVendedoras.length > 0 && <>
        <h2 className="section-title">🏆 Top vendedoras — {periodoLabel}</h2>
        <div className="mvr-card">
          <p className="mvr-card-title">
            Top 5 · cumplimiento {mesNum != null ? `${MESES[mesNum - 1]}` : "anual"}
          </p>
          {topVendedoras.map((r, i) => {
            const lvl = levelClass(r.cumplimiento);
            const w = Math.min((r.cumplimiento ?? 0) * 100, 100);
            return (
              <div key={i} className="top-vend-bar-wrapper">
                <span className="top-vend-nombre" title={r.nombre}>{r.nombre}</span>
                <div className="top-vend-bar-bg">
                  <div className={`top-vend-bar-fill ${lvl}`} style={{ width: `${w}%` }} />
                </div>
                <span className={`top-vend-pct ${lvl}`}>{pct(r.cumplimiento)}</span>
              </div>
            );
          })}
        </div>
      </>}

      {/* ══ Riesgo ══ */}
      {enRiesgo.length > 0 && <>
        <h2 className="section-title">
          ⚠️ Vendedoras con riesgo (&lt;70%) — {periodoLabel}
        </h2>
        <div className="mvr-card tabla-comparacion-wrapper">
          <div className="tabla-comparacion-scroll">
            <table className="tabla-comparacion">
              <thead>
                <tr>
                  {["Vendedora", "Categoría",
                    "Meta año", "Real año", "Cumpl. año",
                    ...(mesNum ? [`Meta ${MESES[mesNum - 1]}`, `Real ${MESES[mesNum - 1]}`, "Cumpl. mes"] : [])
                  ].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {enRiesgo.map((r, i) => (
                  <tr key={i} className="tipo-match">
                    <td>{r.nombre}</td>
                    <td>{r.categoria}</td>
                    <td className="num">{usd(r.metaAnio)}</td>
                    <td className="num">{usd(r.realAnio)}</td>
                    <td className="num" style={cumplStyle(r.cumplimientoAnio)}>{pct(r.cumplimientoAnio)}</td>
                    {mesNum && <>
                      <td className="num">{usd(r.metaMes)}</td>
                      <td className="num">{usd(r.realMes)}</td>
                      <td className="num" style={cumplStyle(r.cumplimientoMes)}>{pct(r.cumplimientoMes)}</td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>}

      {/* ══ Alineación ══ 
      <h2 className="section-title">🔗 Alineación de datos</h2>
      <div className="mvr-card-grid-2">
        <div className="mvr-card">
          <p className="mvr-card-title">Solo en CRM (sin ventas reales)</p>
          <div className="alineacion-count" style={{ color: CHART_META }}>{soloCRM.length}</div>
          <div className="alineacion-list">
            {soloCRM.map((r, i) => (
              <div key={i} className="alineacion-row">
                <span>{r.nombre} · {r.categoria}</span>
                <span className="monto meta">{usd(r.metaAnio)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mvr-card">
          <p className="mvr-card-title">Solo en API externa (sin meta)</p>
          <div className="alineacion-count" style={{ color: CHART_REAL }}>{soloAPI.length}</div>
          <div className="alineacion-list">
            {soloAPI.map((r, i) => (
              <div key={i} className="alineacion-row">
                <span>{r.codigo_vendedora_externo ?? r.nombre} · {r.categoria}</span>
                <span className="monto real">{usd(r.realAnio)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>*/}

      {/* ══ Match manual ══ */}
      <h2 className="section-title">🔀 Match de Vendedoras (Múltiples códigos)</h2>
      <div className="mvr-card tabla-comparacion-wrapper">
        <table className="tabla-comparacion">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Vendedora CRM</th>
              <th style={{ width: '50%' }}>Vendedora Externa Vinculada</th>
              <th style={{ width: '20%' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {vendedoras.map(v => {
              const isDropdownOpen = openDropdown === v.id_usuario;
              const seleccionados = matches[v.id_usuario] || [];
              
              const todosLosCodigos = Array.from(new Set([
                ...codigosExternos.map(c => c.codigo_vendedora_externo),
                ...Object.values(matches).flat() 
              ]));

              // Función que saca la información original
              const getExtInfo = (cod) => codigosExternos.find(c => c.codigo_vendedora_externo === cod);

              // Filtrado inteligente: busca por el nombre externo O por el código
              const filtrados = todosLosCodigos.filter(c => {
                const info = getExtInfo(c);
                const strForSearch = info?.nombre_vendedora_externo 
                  ? `${info.nombre_vendedora_externo} ${c}` 
                  : c;
                return strForSearch.toLowerCase().includes(searchTerm.toLowerCase());
              });

              return (
                <tr key={v.id_usuario}>
                  <td>
                    <strong>{v.nombre}</strong>
                  </td>
                  <td style={{ position: 'relative' }}>
                    
                    {/* BOTÓN DESPLEGABLE */}
                    <div 
                      className={`custom-multiselect ${isDropdownOpen ? 'active' : ''}`}
                      onClick={() => {
                        setOpenDropdown(isDropdownOpen ? null : v.id_usuario);
                        setSearchTerm(""); 
                      }}
                    >
                      <div className="selected-tags">
                        {seleccionados.length > 0 
                          ? seleccionados.map(cod => {
                              const info = getExtInfo(cod);
                              const nombre = info?.nombre_vendedora_externo || "Desconocido";
                              return `${nombre} (${cod})`;
                            }).join(", ") 
                          : "Seleccionar nombre externo..."}
                      </div>
                      <span className="arrow">{isDropdownOpen ? "▲" : "▼"}</span>
                    </div>

                    {/* LISTA DESPLEGABLE */}
                    {isDropdownOpen && (
                      <div className="multiselect-dropdown">
                        <input 
                          type="text" 
                          className="dropdown-search" 
                          placeholder="Buscar por nombre o código..." 
                          autoFocus
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onClick={(e) => e.stopPropagation()} 
                        />
                        <div className="dropdown-options">
                          {filtrados.map(cod => {
                            let dueñoId = null;
                            Object.keys(matches).forEach(key => {
                              if (matches[key].includes(cod)) dueñoId = parseInt(key);
                            });
                            
                            const estaAsignadoAOtro = dueñoId !== null && dueñoId !== v.id_usuario;
                            const info = getExtInfo(cod);

                            return (
                              <label key={cod} className="dropdown-item" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={seleccionados.includes(cod)}
                                  onChange={() => toggleCodigoMatch(v.id_usuario, cod)}
                                />
                                
                                {/* 🌟 NOMBRE GRANDE Y CÓDIGO CHIQUITO GRIS 🌟 */}
                                <span>
                                  {info?.nombre_vendedora_externo || "Desconocido"}{" "}
                                  <small style={{ color: "#94a3b8", fontSize: "0.85em" }}>({cod})</small>
                                </span>
                                
                                {estaAsignadoAOtro && (
                                  <small className="tag-warning" style={{marginLeft: "8px", color: "orange"}}>
                                    (Asignado a otro)
                                  </small>
                                )}
                              </label>
                            );
                          })}
                          {filtrados.length === 0 && (
                            <div className="no-results">No se encontraron resultados</div>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-guardar-match"
                      onClick={async () => {
                        const codigosAsignar = matches[v.id_usuario] || [];
                        
                        try {
                          const res = await fetch(`${base()}/api/ventas/match-vendedora`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", ...auth() },
                            body: JSON.stringify({ 
                              id_usuario: v.id_usuario, 
                              codigos_externos: codigosAsignar 
                            }),
                          });

                          const json = await res.json();
                          if (res.ok) {
                            setOpenDropdown(null); 
                            await cargar(); 
                          } else {
                            alert("Error: " + json.message);
                          }
                        } catch (err) {
                          alert("❌ Error al conectar con el servidor.");
                        }
                      }}
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ══ Heatmap ══ */}
      {porMes.length > 0 && <>
        <h2 className="section-title">🗓️ Heatmap de cumplimiento mensual — {anio}</h2>
        <div className="mvr-card">
          <div className="heatmap-grid">
            {heatmapData.map(m => {
              const lvl = m.cumplimiento != null ? levelClass(m.cumplimiento) : "muted";
              return (
                <div
                  key={m.mes}
                  className={`heatmap-cell ${lvl}${m.esActivo ? " heatmap-cell-active" : ""}`}
                  title={`Meta: ${usd(m.meta)} | Real: ${usd(m.real)} | Dif: ${usd(m.diferencia)}`}
                >
                  <div className="heatmap-mes">{m.mesLabel}</div>
                  <div className={`heatmap-pct ${lvl}`}>
                    {m.cumplimiento != null ? `${(m.cumplimiento * 100).toFixed(0)}%` : "—"}
                  </div>
                  <div className="heatmap-diff">
                    {m.diferencia != null
                      ? (m.diferencia >= 0 ? `+${usd(m.diferencia)}` : usd(m.diferencia))
                      : ""}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="heatmap-legend">
            <span>🔴 &lt;80%</span>
            <span>🟡 80–99%</span>
            <span>🟢 ≥100%</span>
            {mesNum && <span className="heatmap-legend-active">⬛ Mes seleccionado</span>}
          </div>
        </div>
      </>}

      {/* ══ Evolución del cumplimiento ══ */}
      {porMes.some(m => m.cumplimiento != null) && <>
        <h2 className="section-title">📈 Evolución del cumplimiento — {anio}</h2>
        <div className="mvr-card">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={porMes} margin={{ top: 8, right: 20, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                tick={{ fontSize: 10 }}
                domain={[0, "auto"]}
              />
              <Tooltip
                content={({ active, payload, label }) => (
                  <ChartTooltip active={active} payload={payload} label={label} render={p => {
                    const v = p.find(x => x.dataKey === "cumplimiento")?.value;
                    return <>
                      <div>Cumplimiento: <strong>{pct(v)}</strong></div>
                      <div>Meta: {usd(p[0]?.payload?.meta)}</div>
                      <div>Real: {usd(p[0]?.payload?.real)}</div>
                    </>;
                  }} />
                )}
              />
              <ReferenceLine y={1} stroke={CHART_REF} strokeDasharray="4 4"
                label={{ value: "100%", fill: CHART_REF, fontSize: 10 }} />
              {mesNum && (
                <ReferenceLine
                  x={MESES[mesNum - 1]}
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  label={{ value: MESES[mesNum - 1], fill: "#6366f1", fontSize: 10 }}
                />
              )}
              <Line
                dataKey="cumplimiento" name="Cumplimiento"
                stroke={CHART_LINE} strokeWidth={2.5}
                dot={{ r: 4, fill: CHART_LINE }} activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </>}

      {/* ══ Donuts ══ */}
      {porCategoria.length > 0 && <>
        <h2 className="section-title">🍩 Distribución por categoría — {periodoLabel}</h2>
        <div className="mvr-card-grid-2">
          {[
            { title: `Distribución de meta`, data: donutMeta, total: totalDonutMeta },
            { title: `Distribución de real`, data: donutReal, total: totalDonutReal },
          ].map(({ title, data: d, total }) => (
            <div key={title} className="mvr-card">
              <p className="mvr-card-title">{title}</p>
              <div className="donut-wrapper">
                <PieChart width={180} height={180}>
                  <Pie data={d} cx={85} cy={85} innerRadius={50} outerRadius={82} dataKey="value" paddingAngle={2}>
                    {d.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [usd(v), n]} />
                </PieChart>
                <div className="donut-legend">
                  {d.map((e, i) => (
                    <div key={i} className="donut-legend-row">
                      <div className="donut-legend-dot" style={{ background: e.fill }} />
                      <span className="donut-legend-name">{e.name}</span>
                      <span className="donut-legend-pct">
                        {total > 0 ? `${((e.value / total) * 100).toFixed(1)}%` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>}

      {/* ══ Gráfico barras meta vs real por mes ══ */}
      {porMes.length > 0 && <>
        <h2 className="section-title">📅 Meta vs Real por mes — {anio}</h2>
        <div className="dashboard-card card-metas">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={porMes} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip
                content={({ active, payload, label }) => (
                  <ChartTooltip active={active} payload={payload} label={label} render={p => {
                    const d = p[0]?.payload;
                    return <>
                      <div>Meta: {usd(d?.meta)}</div>
                      <div>Real: {usd(d?.real)}</div>
                      {d?.cumplimiento != null && <div>Cumplimiento: {pct(d.cumplimiento)}</div>}
                    </>;
                  }} />
                )}
              />
              <Legend />
              {mesNum && (
                <ReferenceLine
                  x={MESES[mesNum - 1]}
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  label={{ value: "Mes activo", fill: "#6366f1", fontSize: 10, position: "top" }}
                />
              )}
              <Bar dataKey="meta" name="Meta" fill={CHART_META} radius={[4, 4, 0, 0]} />
              <Bar dataKey="real" name="Real" fill={CHART_REAL} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>}

      {/* ══ Tabla detalle por vendedora/categoría ══ */}
      <h2 className="section-title">👩‍💼 Meta vs Real por vendedora y categoría — {periodoLabel}</h2>
      <div className="dashboard-card card-metas tabla-comparacion-wrapper">
        {porVend.length > 0 ? (
          <div className="tabla-comparacion-scroll">
            <table className="tabla-comparacion">
              <thead>
                <tr>
                  {[
                    "Vendedora", "Categoría", "Tipo",
                    "Meta año", "Real año", "Cumpl. año",
                    ...(mesNum
                      ? [`Meta ${MESES[mesNum - 1]}`, `Real ${MESES[mesNum - 1]}`, "Cumpl. mes"]
                      : [])
                  ].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {porVend.map((r, i) => (
                  <tr
                    key={i}
                    className={
                      r.tipo === "match" ? "tipo-match"
                        : r.tipo === "solo_meta" ? "tipo-solo-meta"
                          : "tipo-solo-real"
                    }
                  >
                    <td>{r.nombre || "—"}</td>
                    <td>{r.categoria || "—"}</td>
                    <td>
                      <span className={`tipo-badge ${r.tipo === "match" ? "match"
                          : r.tipo === "solo_meta" ? "solo-meta"
                            : "solo-real"
                        }`}>
                        {r.tipo === "match" ? "✓ Match"
                          : r.tipo === "solo_meta" ? "Solo meta"
                            : "Solo real"}
                      </span>
                    </td>
                    <td className="num">{usd(r.metaAnio)}</td>
                    <td className="num">{usd(r.realAnio)}</td>
                    <td className="num" style={cumplStyle(r.cumplimientoAnio)}>{pct(r.cumplimientoAnio)}</td>
                    {mesNum && <>
                      <td className="num">{usd(r.metaMes)}</td>
                      <td className="num">{usd(r.realMes)}</td>
                      <td className="num" style={cumplStyle(r.cumplimientoMes)}>{pct(r.cumplimientoMes)}</td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sin-datos">No hay datos de comparación para los filtros seleccionados.</p>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="dashboard-metas-footer" style={{ marginTop: '20px' }}>
        <button type="button" className="btn-link" onClick={() => navigate("/forecast-admin")}>
          📊 Ir a Forecast / Metas
        </button>
       {/* <button type="button" className="btn-link" onClick={() => navigate("/dashboard-metas")}>
          📈 Ir a Dashboard solo metas
        </button>*/}
      </div>

    </div>
  );
};

export default DashboardMetaVsReal;