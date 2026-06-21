import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, PieChart,
  Pie, Cell, ReferenceLine,
} from "recharts";
import Select from "react-select";
import "../styles/dashboardMetas.css";
import "../styles/dashboardMetaVsReal.css";

/* ─── Constantes ─────────────────────────────────────────── */
const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
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
    <div className="tooltip-comparacion" style={{ textTransform: 'uppercase' }}>
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
  const [mesesFiltro, setMesesFiltro] = useState([]); 
  const [cedula, setCedula] = useState("");
  const [idCateg, setIdCateg] = useState("");
  const [triggerBusqueda, setTriggerBusqueda] = useState(0);

  /* ── Estados de visibilidad (Colapsables) ── */
  const [mostrarMatch, setMostrarMatch] = useState(false);
  const [mostrarTablaDetalle, setMostrarTablaDetalle] = useState(false);
  /* ── Estado para ordenar la tabla de detalles ── */
  const [ordenDetalle, setOrdenDetalle] = useState("vendedora");
  

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
  useEffect(() => { cargar(); }, [triggerBusqueda]);

  const cargar = async () => {
    setLoading(true); setError(""); setSyncMsg("");
    try {
      let url = `${base()}/api/dashboard/metas-comparacion?anio=${anio}`;
      if (mesesFiltro.length > 0) {
        url += `&meses=${mesesFiltro.map(m => m.value).join(",")}`;
      }
      if (cedula) url += `&cedula_vendedora=${encodeURIComponent(cedula)}`;
      if (idCateg) url += `&id_categoria_venta=${idCateg}`;

      const res = await fetch(url, { headers: auth() });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message ? json.message.toUpperCase() : `ERROR ${res.status}`);

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
      if (!res.ok) throw new Error(json?.message ? json.message.toUpperCase() : "ERROR AL SINCRONIZAR");
      setSyncMsg(`✓ PROCESADOS: ${json.procesados ?? 0}, CREADOS: ${json.creados ?? 0}, ACTUALIZADOS: ${json.actualizados ?? 0}.`);
      
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
  
  const mesesArr = data?.periodo?.meses || [];
  const hasMeses = mesesArr.length > 0;
  const nombreMeses = hasMeses ? mesesArr.map(m => MESES[m - 1]).join(", ") : "";
  const periodoLabel = hasMeses ? `${nombreMeses} ${anio}` : `${anio}`;

  const topVendedoras = useMemo(() =>
    porVend
      .filter(r => r.tipo === "match")
      .map(r => ({
        nombre: r.nombre || r.cedula_ruc || "—",
        cumplimiento: hasMeses ? r.cumplimientoMes : r.cumplimientoAnio,
        meta: hasMeses ? r.metaMes : r.metaAnio,
        real: hasMeses ? r.realMes : r.realAnio,
      }))
      .filter(r => r.cumplimiento != null)
      .sort((a, b) => (b.cumplimiento ?? 0) - (a.cumplimiento ?? 0))
      .slice(0, 5)
    , [porVend, hasMeses]);

  const detalleOrdenado = useMemo(() => {
    let lista = [...porVend];
    
    lista.sort((a, b) => {
      if (ordenDetalle === "vendedora") {
        const nombreA = a.nombre || "";
        const nombreB = b.nombre || "";
        if (nombreA === nombreB) return (a.categoria || "").localeCompare(b.categoria || "");
        return nombreA.localeCompare(nombreB);
      } else {
        const catA = a.categoria || "";
        const catB = b.categoria || "";
        if (catA === catB) return (a.nombre || "").localeCompare(b.nombre || "");
        return catA.localeCompare(catB);
      }
    });

    return lista;
  }, [porVend, ordenDetalle]);

  const donutMeta = useMemo(() =>
    porCategoria.map((c, i) => ({ name: c.categoria?.toUpperCase(), value: c.meta ?? 0, fill: PIE_PALETTE[i % PIE_PALETTE.length] }))
    , [porCategoria]);
  const donutReal = useMemo(() =>
    porCategoria.map((c, i) => ({ name: c.categoria?.toUpperCase(), value: c.real ?? 0, fill: PIE_PALETTE[i % PIE_PALETTE.length] }))
    , [porCategoria]);

  const totalDonutMeta = useMemo(() => donutMeta.reduce((s, x) => s + x.value, 0), [donutMeta]);
  const totalDonutReal = useMemo(() => donutReal.reduce((s, x) => s + x.value, 0), [donutReal]);

  const gapMes = (kpis.realTotalMes != null && kpis.metaTotalMes != null) ? r2(kpis.realTotalMes - kpis.metaTotalMes) : null;
  const gapAnio = (kpis.realAcumuladaAnio != null && kpis.metaAcumuladaAnio != null) ? r2(kpis.realAcumuladaAnio - kpis.metaAcumuladaAnio) : null;

  const heatmapData = useMemo(() =>
    porMes.map(m => ({ ...m, esActivo: hasMeses && mesesArr.includes(m.mes) }))
    , [porMes, hasMeses, mesesArr]);

  if (loading && !data) return (
    <div className="dashboard-metas-container dashboard-meta-vs-real" style={{ textTransform: 'uppercase' }}>
      <button type="button" className="btn-volver" onClick={() => navigate(-1)}>⬅️ VOLVER</button>
      <p className="loading-msg">CARGANDO COMPARACIÓN META VS REAL...</p>
    </div>
  );
  if (error && !data) return (
    <div className="dashboard-metas-container dashboard-meta-vs-real" style={{ textTransform: 'uppercase' }}>
      <button type="button" className="btn-volver" onClick={() => navigate(-1)}>⬅️ VOLVER</button>
      <p className="error-msg">{error}</p>
    </div>
  );

  /* Helper para formatear visualmente Nombre + Código/Cédula */
  const formatearNombre = (r) => {
    const nombre = (r.nombre || "").toUpperCase();

    // Caso A: Es una venta externa que aún no han vinculado a ninguna vendedora en el CRM
    if (nombre.startsWith("(EXT)")) {
      return `⚠️ FALTA VINCULAR (CÓD: ${r.codigo_vendedora_externo})`;
    }

    // Caso B: Es una vendedora normal del CRM
    const tieneCodigo = r.codigo_vendedora_externo && r.codigo_vendedora_externo !== "En CRM (Sin código)";
    const identificador = tieneCodigo 
      ? `CÓD: ${r.codigo_vendedora_externo}` 
      : `CI: ${r.cedula_ruc || "Sin CI"}`;

    return `${nombre} (${identificador})`;
  };
  
  return (
    <div className="dashboard-metas-container dashboard-meta-vs-real" style={{ textTransform: 'uppercase' }}>

      {/* ── Header ── */}
      <button type="button" className="btn-volver" onClick={() => navigate(-1)}>⬅️ VOLVER</button>
      <h1 className="title">META VS REAL</h1>
      <p className="subtitle">
        COMPARACIÓN DE METAS (FORECAST) CON VENTAS REALES · {periodoLabel}
        {idCateg && categorias.find(c => c.id_categoria_venta === Number(idCateg))
          ? ` · ${categorias.find(c => c.id_categoria_venta === Number(idCateg)).nombre.toUpperCase()}`
          : ""}
      </p>

      {/* ── Filtros ── */}
      <div className="filtros-metas">
        <label>
          AÑO:
          <select value={anio} onChange={e => setAnio(Number(e.target.value))}>
            {[actual - 2, actual - 1, actual, actual + 1, actual + 2]
              .filter(y => y >= 2024)
              .map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>

        <label style={{ minWidth: "220px", zIndex: 100 }}>
          MESES:
          <Select 
            isMulti
            options={MESES.map((m, i) => ({ value: i + 1, label: m }))}
            value={mesesFiltro}
            onChange={setMesesFiltro}
            placeholder="TODO EL AÑO"
            styles={{
              control: (b) => ({ ...b, minHeight: '38px', borderRadius: '8px', textTransform: 'uppercase' }),
              menu: (b) => ({ ...b, zIndex: 999, textTransform: 'uppercase' })
            }}
          />
        </label>

        <label>
          VENDEDORA:
          <select value={cedula} onChange={e => setCedula(e.target.value)}>
            <option value="">TODAS</option>
            {vendedoras.map(v => (
              <option key={v.cedula_ruc} value={v.cedula_ruc}>{v.nombre.toUpperCase()}</option>
            ))}
          </select>
        </label>

        <label>
          CATEGORÍA:
          <select value={idCateg} onChange={e => setIdCateg(e.target.value)}>
            <option value="">TODAS</option>
            {categorias.map(c => (
              <option key={c.id_categoria_venta} value={c.id_categoria_venta}>{c.nombre.toUpperCase()}</option>
            ))}
          </select>
        </label>

        <div className="filtros-metas-actions">
          <button 
            type="button" 
            className="btn-primary" 
            onClick={() => setTriggerBusqueda(prev => prev + 1)}
            style={{ marginRight: '10px', padding: '8px 16px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', textTransform: 'uppercase' }}
          >
            🔍 BUSCAR
          </button>
          
          <button type="button" className="btn-sincronizar" onClick={sincronizar} disabled={syncing} style={{ textTransform: 'uppercase' }}>
            {syncing ? "SINCRONIZANDO..." : "🔄 ACTUALIZAR TOTALES REALES"}
          </button>
        </div>
      </div>

      {syncMsg && (
        <p className={syncMsg.startsWith("✗") ? "sync-error" : "sync-success"}>{syncMsg}</p>
      )}

      {/* ══ KPIs ══ */}
      <h2 className="section-title">📊 RESUMEN GENERAL — {periodoLabel}</h2>
      <div className="kpis-grid kpis-comparacion">

        <div className="kpi-card">
          <span className="kpi-label">META ACUMULADA AÑO</span>
          <span className="kpi-value meta">{usd(kpis.metaAcumuladaAnio)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">REAL ACUMULADO AÑO</span>
          <span className="kpi-value real">{usd(kpis.realAcumuladaAnio)}</span>
        </div>
        <div className="kpi-card destacado">
          <span className="kpi-label">CUMPLIMIENTO AÑO</span>
          <span className={`kpi-value ${levelClass(kpis.cumplimientoAnio)}`}>{pct(kpis.cumplimientoAnio)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">GAP AÑO (REAL − META)</span>
          <span className={`kpi-value ${gapAnio == null ? "" : gapAnio >= 0 ? "ok" : "danger"}`}>
            {gapAnio != null ? usd(gapAnio) : "—"}
          </span>
          {gapAnio != null && (
            <span className="kpi-sub">{gapAnio >= 0 ? "POR ENCIMA DE LA META" : "POR DEBAJO DE LA META"}</span>
          )}
        </div>

        {hasMeses && <>
          <div className="kpi-card">
            <span className="kpi-label">META {nombreMeses}</span>
            <span className="kpi-value meta">{usd(kpis.metaTotalMes)}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">REAL {nombreMeses}</span>
            <span className="kpi-value real">{usd(kpis.realTotalMes)}</span>
          </div>
          <div className="kpi-card destacado">
            <span className="kpi-label">CUMPLIMIENTO {nombreMeses}</span>
            <span className={`kpi-value ${levelClass(kpis.cumplimientoMes)}`}>{pct(kpis.cumplimientoMes)}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">GAP PERIODO (REAL − META)</span>
            <span className={`kpi-value ${gapMes == null ? "" : gapMes >= 0 ? "ok" : "danger"}`}>
              {gapMes != null ? usd(gapMes) : "—"}
            </span>
            {gapMes != null && (
              <span className="kpi-sub">{gapMes >= 0 ? "POR ENCIMA" : "POR DEBAJO"}</span>
            )}
          </div>
        </>}
      </div>

      {/* ══ Por categoría ══ */}
      {porCategoria.length > 0 && <>
        <h2 className="section-title">
          🏷️ CUMPLIMIENTO POR CATEGORÍA — {periodoLabel}
        </h2>
        <div className="mvr-card-grid-2">
          <div className="mvr-card">
            <p className="mvr-card-title">META VS REAL</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={porCategoria} margin={{ top: 8, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="categoria" tick={{ fontSize: 11, textTransform: 'uppercase' }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip active={active} payload={payload} label={label?.toUpperCase()} render={p => <>
                      <div>META: {usd(p.find(x => x.dataKey === "meta")?.value)}</div>
                      <div>REAL: {usd(p.find(x => x.dataKey === "real")?.value)}</div>
                      <div>CUMPL.: {pct(p[0]?.payload?.cumplimiento)}</div>
                    </>} />
                  )}
                />
                <Legend wrapperStyle={{ fontSize: 12, textTransform: 'uppercase' }} />
                <Bar dataKey="meta" name="META" fill={CHART_META} radius={[4, 4, 0, 0]} />
                <Bar dataKey="real" name="REAL" fill={CHART_REAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mvr-card">
            <p className="mvr-card-title">RANKING POR CUMPLIMIENTO</p>
            <div className="ranking-list">
              {[...porCategoria]
                .sort((a, b) => (b.cumplimiento ?? 0) - (a.cumplimiento ?? 0))
                .map((c, i) => {
                  const lvl = levelClass(c.cumplimiento);
                  const w = Math.min((c.cumplimiento ?? 0) * 100, 100);
                  return (
                    <div key={i}>
                      <div className="ranking-row-label">
                        <span>{c.categoria?.toUpperCase()}</span>
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
        <h2 className="section-title">🏆 TOP VENDEDORAS — {periodoLabel}</h2>
        <div className="mvr-card">
          <p className="mvr-card-title">
            TOP 5 · CUMPLIMIENTO {hasMeses ? nombreMeses : "ANUAL"}
          </p>
          {topVendedoras.map((r, i) => {
            const lvl = levelClass(r.cumplimiento);
            const w = Math.min((r.cumplimiento ?? 0) * 100, 100);
            return (
              <div key={i} className="top-vend-bar-wrapper">
                <span className="top-vend-nombre" title={r.nombre}>{r.nombre?.toUpperCase()}</span>
                <div className="top-vend-bar-bg">
                  <div className={`top-vend-bar-fill ${lvl}`} style={{ width: `${w}%` }} />
                </div>
                <span className={`top-vend-pct ${lvl}`}>{pct(r.cumplimiento)}</span>
              </div>
            );
          })}
        </div>
      </>}

      {/* ══ Tabla Completa de Detalle (Reemplaza a la tabla de Riesgo) ══ */}
      {detalleOrdenado.length > 0 && <>
        <h2 className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📋 DETALLE DE VENTAS VS METAS — {periodoLabel}</span>
          
          {/* Controles para cambiar el orden de la tabla */}
          <div style={{ fontSize: '0.75rem', fontWeight: 'normal', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <strong>AGRUPAR/ORDENAR POR:</strong>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="radio" 
                name="ordenTabla" 
                value="vendedora" 
                checked={ordenDetalle === "vendedora"} 
                onChange={(e) => setOrdenDetalle(e.target.value)} 
              />
              VENDEDORA
            </label>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="radio" 
                name="ordenTabla" 
                value="categoria" 
                checked={ordenDetalle === "categoria"} 
                onChange={(e) => setOrdenDetalle(e.target.value)} 
              />
              CATEGORÍA
            </label>
          </div>
        </h2>

        <div className="mvr-card tabla-comparacion-wrapper">
          <div className="tabla-comparacion-scroll">
            <table className="tabla-comparacion">
              <thead>
                <tr>
                  {["VENDEDORA", "CATEGORÍA",
                    "META AÑO", "REAL AÑO", "CUMPL. AÑO",
                    ...(hasMeses ? [`META PERIODO`, `REAL PERIODO`, "CUMPL. PERIODO"] : [])
                  ].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {detalleOrdenado.map((r, i) => {
                  const cumplimientoActual = hasMeses ? r.cumplimientoMes : r.cumplimientoAnio;
                  const esCritico = cumplimientoActual != null && cumplimientoActual < 0.7;
                  
                  const filaStyle = esCritico ? { backgroundColor: '#fee2e2', color: '#dc2626' } : {};
                  const textoCriticoStyle = esCritico ? { fontWeight: 'bold', color: '#dc2626' } : {};

                  return (
                    <tr key={i} className="tipo-match" style={filaStyle}>
                      
                      {/* LLAMAMOS A LA FUNCIÓN AQUÍ: */}
                      <td style={textoCriticoStyle}>{formatearNombre(r)}</td>
                      
                      <td style={textoCriticoStyle}>{r.categoria?.toUpperCase()}</td>
                      <td className="num">{usd(r.metaAnio)}</td>
                      <td className="num">{usd(r.realAnio)}</td>
                      <td className="num" style={cumplStyle(r.cumplimientoAnio)}>{pct(r.cumplimientoAnio)}</td>
                      {hasMeses && <>
                        <td className="num">{usd(r.metaMes)}</td>
                        <td className="num">{usd(r.realMes)}</td>
                        <td className="num" style={cumplStyle(r.cumplimientoMes)}>{pct(r.cumplimientoMes)}</td>
                      </>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>}

      {/* ══ Match manual (Ahora colapsable) ══ */}
      <h2 
        className="section-title" 
        onClick={() => setMostrarMatch(!mostrarMatch)}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px" }}
      >
        <span>🔀 MATCH DE VENDEDORAS (MÚLTIPLES CÓDIGOS)</span>
        <span style={{ fontSize: "0.85em", color: "#64748b", fontWeight: "normal" }}>
          {mostrarMatch ? "▲ OCULTAR SECCIÓN" : "▼ MOSTRAR SECCIÓN"}
        </span>
      </h2>
      
      {mostrarMatch && (
        <div className="mvr-card tabla-comparacion-wrapper">
          <table className="tabla-comparacion">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>VENDEDORA CRM</th>
                <th style={{ width: '50%' }}>VENDEDORA EXTERNA VINCULADA</th>
                <th style={{ width: '20%' }}>ACCIÓN</th>
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

                const getExtInfo = (cod) => codigosExternos.find(c => c.codigo_vendedora_externo === cod);

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
                      <strong>{v.nombre?.toUpperCase()}</strong>
                    </td>
                    <td style={{ position: 'relative' }}>
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
                                const nombre = info?.nombre_vendedora_externo || "DESCONOCIDO";
                                return `${nombre.toUpperCase()} (${cod})`;
                              }).join(", ") 
                            : "SELECCIONAR NOMBRE EXTERNO..."}
                        </div>
                        <span className="arrow">{isDropdownOpen ? "▲" : "▼"}</span>
                      </div>

                      {isDropdownOpen && (
                        <div className="multiselect-dropdown">
                          <input 
                            type="text" 
                            className="dropdown-search" 
                            placeholder="BUSCAR POR NOMBRE O CÓDIGO..." 
                            autoFocus
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()} 
                            style={{ textTransform: 'uppercase' }}
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
                                  <span>
                                    {info?.nombre_vendedora_externo?.toUpperCase() || "DESCONOCIDO"}{" "}
                                    <small style={{ color: "#94a3b8", fontSize: "0.85em" }}>({cod})</small>
                                  </span>
                                  {estaAsignadoAOtro && (
                                    <small className="tag-warning" style={{marginLeft: "8px", color: "orange"}}>
                                      (ASIGNADO A OTRO)
                                    </small>
                                  )}
                                </label>
                              );
                            })}
                            {filtrados.length === 0 && (
                              <div className="no-results">NO SE ENCONTRARON RESULTADOS</div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-guardar-match"
                        style={{ textTransform: 'uppercase' }}
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
                              alert("ERROR: " + json.message.toUpperCase());
                            }
                          } catch (err) {
                            alert("❌ ERROR AL CONECTAR CON EL SERVIDOR.");
                          }
                        }}
                      >
                        GUARDAR
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ Heatmap ══ */}
      {porMes.length > 0 && <>
        <h2 className="section-title">🗓️ HEATMAP DE CUMPLIMIENTO MENSUAL — {anio}</h2>
        <div className="mvr-card">
          <div className="heatmap-grid">
            {heatmapData.map(m => {
              const lvl = m.cumplimiento != null ? levelClass(m.cumplimiento) : "muted";
              return (
                <div
                  key={m.mes}
                  className={`heatmap-cell ${lvl}${m.esActivo ? " heatmap-cell-active" : ""}`}
                  title={`META: ${usd(m.meta)} | REAL: ${usd(m.real)} | DIF: ${usd(m.diferencia)}`}
                >
                  <div className="heatmap-mes">{m.mesLabel?.toUpperCase()}</div>
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
            {hasMeses && <span className="heatmap-legend-active">⬛ SELECCIONADO</span>}
          </div>
        </div>
      </>}

      {/* ══ Evolución del cumplimiento ══ */}
      {porMes.some(m => m.cumplimiento != null) && <>
        <h2 className="section-title">📈 EVOLUCIÓN DEL CUMPLIMIENTO — {anio}</h2>
        <div className="mvr-card">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={porMes} margin={{ top: 8, right: 20, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 11, textTransform: 'uppercase' }} />
              <YAxis
                tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                tick={{ fontSize: 10 }}
                domain={[0, "auto"]}
              />
              <Tooltip
                content={({ active, payload, label }) => (
                  <ChartTooltip active={active} payload={payload} label={label?.toUpperCase()} render={p => {
                    const v = p.find(x => x.dataKey === "cumplimiento")?.value;
                    return <>
                      <div>CUMPLIMIENTO: <strong>{pct(v)}</strong></div>
                      <div>META: {usd(p[0]?.payload?.meta)}</div>
                      <div>REAL: {usd(p[0]?.payload?.real)}</div>
                    </>;
                  }} />
                )}
              />
              <ReferenceLine y={1} stroke={CHART_REF} strokeDasharray="4 4"
                label={{ value: "100%", fill: CHART_REF, fontSize: 10 }} />
              {hasMeses && mesesArr.map(m => (
                <ReferenceLine
                  key={m}
                  x={MESES[m - 1]}
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  label={{ value: MESES[m - 1], fill: "#6366f1", fontSize: 10 }}
                />
              ))}
              <Line
                dataKey="cumplimiento" name="CUMPLIMIENTO"
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
        <h2 className="section-title">🍩 DISTRIBUCIÓN POR CATEGORÍA — {periodoLabel}</h2>
        <div className="mvr-card-grid-2">
          {[
            { title: `DISTRIBUCIÓN DE META`, data: donutMeta, total: totalDonutMeta },
            { title: `DISTRIBUCIÓN DE REAL`, data: donutReal, total: totalDonutReal },
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
                      <span className="donut-legend-name">{e.name?.toUpperCase()}</span>
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
        <h2 className="section-title">📅 META VS REAL POR MES — {anio}</h2>
        <div className="dashboard-card card-metas">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={porMes} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 12, textTransform: 'uppercase' }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip
                content={({ active, payload, label }) => (
                  <ChartTooltip active={active} payload={payload} label={label?.toUpperCase()} render={p => {
                    const d = p[0]?.payload;
                    return <>
                      <div>META: {usd(d?.meta)}</div>
                      <div>REAL: {usd(d?.real)}</div>
                      {d?.cumplimiento != null && <div>CUMPLIMIENTO: {pct(d.cumplimiento)}</div>}
                    </>;
                  }} />
                )}
              />
              <Legend wrapperStyle={{ textTransform: 'uppercase' }} />
              {hasMeses && mesesArr.map(m => (
                <ReferenceLine
                  key={m}
                  x={MESES[m - 1]}
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  label={{ value: "ACTIVO", fill: "#6366f1", fontSize: 10, position: "top" }}
                />
              ))}
              <Bar dataKey="meta" name="META" fill={CHART_META} radius={[4, 4, 0, 0]} />
              <Bar dataKey="real" name="REAL" fill={CHART_REAL} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>}

      {/* ══ Tabla detalle por vendedora/categoría (Ahora colapsable y sin mes en el título) ══ */}
      <h2 
        className="section-title" 
        onClick={() => setMostrarTablaDetalle(!mostrarTablaDetalle)}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px" }}
      >
        <span>👩‍💼 META VS REAL POR VENDEDORA Y CATEGORÍA</span>
        <span style={{ fontSize: "0.85em", color: "#64748b", fontWeight: "normal" }}>
          {mostrarTablaDetalle ? "▲ OCULTAR SECCIÓN" : "▼ MOSTRAR SECCIÓN"}
        </span>
      </h2>
      
      {mostrarTablaDetalle && (
        <div className="dashboard-card card-metas tabla-comparacion-wrapper">
          {porVend.length > 0 ? (
            <div className="tabla-comparacion-scroll">
              <table className="tabla-comparacion">
                <thead>
                  <tr>
                    {[
                      "VENDEDORA", "CATEGORÍA", "TIPO",
                      "META AÑO", "REAL AÑO", "CUMPL. AÑO",
                      ...(hasMeses
                        ? [`META PERIODO`, `REAL PERIODO`, "CUMPL. PERIODO"]
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
                      <td>{r.nombre?.toUpperCase() || "—"}</td>
                      <td>{r.categoria?.toUpperCase() || "—"}</td>
                      <td>
                        <span className={`tipo-badge ${r.tipo === "match" ? "match"
                            : r.tipo === "solo_meta" ? "solo-meta"
                              : "solo-real"
                          }`}>
                          {r.tipo === "match" ? "✓ MATCH"
                            : r.tipo === "solo_meta" ? "SOLO META"
                              : "SOLO REAL"}
                        </span>
                      </td>
                      <td className="num">{usd(r.metaAnio)}</td>
                      <td className="num">{usd(r.realAnio)}</td>
                      <td className="num" style={cumplStyle(r.cumplimientoAnio)}>{pct(r.cumplimientoAnio)}</td>
                      {hasMeses && <>
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
            <p className="sin-datos">NO HAY DATOS DE COMPARACIÓN PARA LOS FILTROS SELECCIONADOS.</p>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="dashboard-metas-footer" style={{ marginTop: '20px' }}>
        <button type="button" className="btn-link" onClick={() => navigate("/forecast-admin")} style={{ textTransform: 'uppercase' }}>
          📊 IR A FORECAST / METAS
        </button>
      </div>

    </div>
  );
};

export default DashboardMetaVsReal;