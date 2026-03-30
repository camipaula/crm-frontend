import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "../styles/dashboardMetas.css";

const NOMBRES_MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const COLORS = ["#1a73e8", "#34a853", "#fbbc05", "#ea4335", "#8e44ad", "#00acc1", "#ff6d00", "#5c6bc0"];

const DashboardMetas = () => {
  const navigate = useNavigate();
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState(anioActual);
  const [mes, setMes] = useState(""); // vacío = todo el año; "1"-"12" = filtrar mes
  const [cedulaVendedora, setCedulaVendedora] = useState(""); // vacío = todas
  const [vendedoras, setVendedoras] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
    fetch(`${baseUrl}/api/usuarios/vendedoras`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((d) => setVendedoras(Array.isArray(d) ? d : []))
      .catch(() => setVendedoras([]));
  }, []);

  useEffect(() => {
    cargarDashboard();
  }, [anio, mes, cedulaVendedora]);

  const cargarDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
      const token = localStorage.getItem("token");
      let url = `${baseUrl}/api/dashboard/metas?anio=${anio}`;
      if (mes) url += `&mes=${mes}`;
      if (cedulaVendedora) url += `&cedula_vendedora=${encodeURIComponent(cedulaVendedora)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.message || json?.error || `Error ${res.status} al cargar dashboard de metas`;
        throw new Error(msg);
      }
      setData(json);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatMonto = (n) =>
    n != null && !Number.isNaN(n)
      ? `$${Number(n).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "-";

  if (loading && !data) {
    return (
      <div className="dashboard-metas-container">
        <button type="button" className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>
        <p className="loading-msg">Cargando dashboard de metas...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-metas-container">
        <button type="button" className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>
        <p className="error-msg">{error}</p>
      </div>
    );
  }

  const kpis = data?.kpis ?? {};
  const metaPorVendedora = data?.metaPorVendedora ?? { delAnio: [], delMes: null };
  const metaPorCategoria = data?.metaPorCategoria ?? { delAnio: [], delMes: null };
  const metaPorMes = data?.metaPorMes ?? [];

  const datosGraficoMes = metaPorMes.map((m) => ({
    mes: NOMBRES_MESES[m.mes - 1],
    total: m.total,
    full: m.total,
  }));

  return (
    <div className="dashboard-metas-container">
      <button type="button" className="btn-volver" onClick={() => navigate(-1)}>
        ⬅️ Volver
      </button>
      <h1 className="title">Dashboard de metas (forecast)</h1>
      <p className="subtitle">
        Metas por vendedora y categoría. En el futuro podrás comparar con ventas reales.
      </p>

      <div className="filtros-metas">
        <label>
          Año:
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
            {[anioActual - 2, anioActual - 1, anioActual, anioActual + 1, anioActual + 2]
              .filter((y) => y >= 2024)
              .map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
        </label>
        <label>
          Mes (opcional):
          <select value={mes} onChange={(e) => setMes(e.target.value)}>
            <option value="">Todo el año</option>
            {NOMBRES_MESES.map((nombre, i) => (
              <option key={i} value={i + 1}>{nombre}</option>
            ))}
          </select>
        </label>
        <label>
          Vendedora:
          <select value={cedulaVendedora} onChange={(e) => setCedulaVendedora(e.target.value)}>
            <option value="">Todas las vendedoras</option>
            {vendedoras.map((v) => (
              <option key={v.cedula_ruc} value={v.cedula_ruc}>{v.nombre}</option>
            ))}
          </select>
        </label>
      </div>

      {/* KPIs */}
      <div className="kpis-grid">
        <div className="kpi-card">
          <span className="kpi-label">Meta acumulada año</span>
          <span className="kpi-value">{formatMonto(kpis.metaAcumuladaAnio)}</span>
        </div>
        {kpis.metaTotalMes != null && (
          <div className="kpi-card destacado">
            <span className="kpi-label">Meta del mes seleccionado</span>
            <span className="kpi-value">{formatMonto(kpis.metaTotalMes)}</span>
          </div>
        )}
        <div className="kpi-card">
          <span className="kpi-label">Promedio mensual (año)</span>
          <span className="kpi-value">{formatMonto(kpis.metaPromedioMensualAnio)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Vendedoras con meta</span>
          <span className="kpi-value">{kpis.cantidadVendedorasConMeta ?? 0}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Categorías con meta</span>
          <span className="kpi-value">{kpis.cantidadCategoriasConMeta ?? 0}</span>
        </div>
      </div>

      {/* Meta por mes (12 meses) */}
      {datosGraficoMes.length > 0 && (
        <div className="dashboard-card card-metas">
          <h3>📅 Meta por mes ({anio})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosGraficoMes} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip formatter={(value) => [formatMonto(value), "Meta"]} labelFormatter={(l) => l} />
              <Bar dataKey="total" name="Meta" fill="#1a73e8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid-dos-columnas">
        {/* Meta por vendedora (año) */}
        <div className="dashboard-card card-metas">
          <h3>👩‍💼 Meta por vendedora (año)</h3>
          {metaPorVendedora.delAnio?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={metaPorVendedora.delAnio.map((v) => ({ ...v, nombre: (v.nombre || "").toUpperCase().slice(0, 20) }))}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <YAxis type="category" dataKey="nombre" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [formatMonto(value), "Meta"]} />
                  <Bar dataKey="total" name="Meta" fill="#34a853" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p className="sin-datos">No hay metas por vendedora para este año.</p>
          )}
        </div>

        {/* Meta por categoría (año) */}
        <div className="dashboard-card card-metas">
          <h3>🏷️ Meta por categoría (año)</h3>
          {metaPorCategoria.delAnio?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={metaPorCategoria.delAnio}
                    dataKey="total"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ nombre, total }) => `${nombre}: ${formatMonto(total)}`}
                  >
                    {metaPorCategoria.delAnio.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatMonto(value), "Meta"]} />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p className="sin-datos">No hay metas por categoría para este año.</p>
          )}
        </div>
      </div>

      {/* Si hay mes seleccionado: meta del mes por vendedora y por categoría */}
      {mes && (
        <div className="grid-dos-columnas">
          <div className="dashboard-card card-metas">
            <h3>👩‍💼 Meta del mes por vendedora</h3>
            {metaPorVendedora.delMes?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={metaPorVendedora.delMes.map((v) => ({ ...v, nombre: (v.nombre || "").toUpperCase().slice(0, 20) }))}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <YAxis type="category" dataKey="nombre" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [formatMonto(value), "Meta mes"]} />
                  <Bar dataKey="total" name="Meta mes" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="sin-datos">No hay metas para el mes seleccionado por vendedora.</p>
            )}
          </div>
          <div className="dashboard-card card-metas">
            <h3>🏷️ Meta del mes por categoría</h3>
            {metaPorCategoria.delMes?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={metaPorCategoria.delMes}
                    dataKey="total"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ nombre, total }) => `${nombre}: ${formatMonto(total)}`}
                  >
                    {metaPorCategoria.delMes.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatMonto(value), "Meta mes"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="sin-datos">No hay metas para el mes seleccionado por categoría.</p>
            )}
          </div>
        </div>
      )}

      <div className="dashboard-metas-footer">
        <button type="button" className="btn-link" onClick={() => navigate("/forecast-admin")}>
          📊 Ir a Forecast / Metas (cargar o editar metas)
        </button>
      </div>
    </div>
  );
};

export default DashboardMetas;
