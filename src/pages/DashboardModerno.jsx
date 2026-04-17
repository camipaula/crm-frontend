import { useState, useEffect, useMemo } from "react";
import { getRol, obtenerCedulaDesdeToken } from "../utils/auth";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import FunnelD3 from "../components/FunnelD3";
import "../styles/dashboardModerno.css";

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#a855f7",
  "#14b8a6",
  "#f97316",
];

// ACTUALIZADO: Los nombres correctos de la base de datos
const ordenEstadosAbiertas = [
  "Captación",
  "Citas",
  "Cotizaciones/ensayo",
  "Seguimiento",
  "Cierre de venta",
];

const filasPorPaginaAbiertas = 10;

const StatCard = ({ title, value, sub, variant = "purple" }) => (
  <div className={`db-stat-card ${variant}`}>
    <span className="db-stat-label">{title}</span>
    <span className="db-stat-value">{value}</span>
    {sub && <span className="db-stat-sub">{sub}</span>}
  </div>
);

const DashboardModerno = () => {
  const rol = getRol();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filtrosVisible, setFiltrosVisible] = useState(false);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaInicioDefecto, setFechaInicioDefecto] = useState("");
  const [fechaFinDefecto, setFechaFinDefecto] = useState("");

  const [cedulaVendedora, setCedulaVendedora] = useState("");
  const [sector, setSector] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [idCategoria, setIdCategoria] = useState("");
  const [idOrigen, setIdOrigen] = useState("");

  const [vendedoras, setVendedoras] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [origenes, setOrigenes] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [paginaAbiertas, setPaginaAbiertas] = useState(1);
  const [paginaDeclinadas, setPaginaDeclinadas] = useState(1);
  const [filtroEstadoAbiertas, setFiltroEstadoAbiertas] = useState("");

  const token = localStorage.getItem("token");

  const anioActualStr = new Date().getFullYear().toString();
  const anioPasadoStr = (new Date().getFullYear() - 1).toString();

  const graficoVentasSinPerdidas = useMemo(
    () => (dashboardData?.graficoVentas || []).filter((d) => d.estado !== "Perdidas"),
    [dashboardData]
  );

  const abiertasFiltradas = useMemo(() => {
    return (
      dashboardData?.tablaAbiertas?.filter(
        (f) => !filtroEstadoAbiertas || f.estado === filtroEstadoAbiertas
      ) || []
    );
  }, [dashboardData, filtroEstadoAbiertas]);

  const abiertasPaginada = useMemo(() => {
    const inicio = (paginaAbiertas - 1) * filasPorPaginaAbiertas;
    const fin = paginaAbiertas * filasPorPaginaAbiertas;
    return abiertasFiltradas.slice(inicio, fin);
  }, [abiertasFiltradas, paginaAbiertas]);

  const declinadasPaginada = useMemo(() => {
    const lista = dashboardData?.tablaDeclinadas || [];
    const inicio = (paginaDeclinadas - 1) * filasPorPaginaAbiertas;
    const fin = paginaDeclinadas * filasPorPaginaAbiertas;
    return lista.slice(inicio, fin);
  }, [dashboardData, paginaDeclinadas]);

  const hayFiltrosActivos =
    (rol === "admin" && cedulaVendedora) ||
    ciudad ||
    sector ||
    idCategoria ||
    idOrigen ||
    fechaInicio !== fechaInicioDefecto ||
    fechaFin !== fechaFinDefecto;

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString();
  };

  const fetchCategorias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error cargando categorías");
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  };

  const fetchVendedoras = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error cargando vendedoras");
      const data = await res.json();
      setVendedoras(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar vendedoras", err);
    }
  };

  const fetchFiltros = async () => {
    try {
      const [sectoresRes, ciudadesRes, origenesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/sectores`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/ciudades`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/origenes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const sectoresData = await sectoresRes.json();
      const ciudadesData = await ciudadesRes.json();
      const origenesData = await origenesRes.json();

      setSectores(Array.isArray(sectoresData) ? sectoresData : []);
      setCiudades(Array.isArray(ciudadesData) ? ciudadesData : []);
      setOrigenes(Array.isArray(origenesData) ? origenesData : []);
    } catch (err) {
      console.error("Error cargando filtros:", err);
    }
  };

  useEffect(() => {
    const hoy = new Date();
    const haceTresMeses = new Date();
    haceTresMeses.setMonth(hoy.getMonth() - 3);

    const inicio = haceTresMeses.toISOString().slice(0, 10);
    const fin = hoy.toISOString().slice(0, 10);

    setFechaInicio(inicio);
    setFechaFin(fin);
    setFechaInicioDefecto(inicio);
    setFechaFinDefecto(fin);

    fetchFiltros();
    fetchCategorias();

    if (rol === "admin") {
      fetchVendedoras();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol]);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const url = new URL(`${import.meta.env.VITE_API_URL}/api/dashboard`);
      const params = {};

      if (fechaInicio && fechaFin) {
        params.fecha_inicio = fechaInicio;
        params.fecha_fin = fechaFin;
      }

      if (rol === "vendedora") {
        params.cedula_vendedora = obtenerCedulaDesdeToken();
      } else if (cedulaVendedora) {
        params.cedula_vendedora = cedulaVendedora;
      }

      if (sector) params.sector = sector;
      if (ciudad) params.ciudad = ciudad;
      if (idCategoria) params.id_categoria = idCategoria;
      if (idOrigen) params.id_origen = idOrigen;

      Object.keys(params).forEach((key) => {
        url.searchParams.append(key, params[key]);
      });

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al obtener datos del dashboard");

      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message || "Error al cargar dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleMesChange = (mesSeleccionado) => {
    if (!mesSeleccionado) return;

    const anioActual = new Date().getFullYear();
    const primerDia = new Date(`${anioActual}-${mesSeleccionado}-01`);
    const ultimoDia = new Date(anioActual, parseInt(mesSeleccionado, 10), 0);

    setFechaInicio(primerDia.toISOString().slice(0, 10));
    setFechaFin(ultimoDia.toISOString().slice(0, 10));
  };

  const limpiarFiltros = () => {
    const hoy = new Date();
    const haceTresMeses = new Date();
    haceTresMeses.setMonth(hoy.getMonth() - 3);

    const inicio = haceTresMeses.toISOString().slice(0, 10);
    const fin = hoy.toISOString().slice(0, 10);

    setFechaInicio(inicio);
    setFechaFin(fin);
    setFechaInicioDefecto(inicio);
    setFechaFinDefecto(fin);
    setCedulaVendedora("");
    setSector("");
    setCiudad("");
    setIdCategoria("");
    setIdOrigen("");
    setFiltroEstadoAbiertas("");
    setPaginaAbiertas(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPaginaAbiertas(1);
    fetchDashboardData();
  };

  const handleMontoChange = (index, nuevoMonto) => {
    const copia = [...(dashboardData?.tablaCierres || [])];
    copia[index].monto = nuevoMonto;
    setDashboardData((prev) => ({ ...prev, tablaCierres: copia }));
  };

  const guardarMontos = async () => {
    try {
      const token = localStorage.getItem("token");

      for (const fila of dashboardData?.tablaCierres || []) {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/ventas/actualizar-monto`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              id_venta: fila.id_venta,
              monto: parseFloat(fila.monto),
            }),
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Error actualizando monto");
        }
      }

      alert("✅ Montos guardados correctamente");
      fetchDashboardData();
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  const estadosUnicosAbiertas = useMemo(() => {
    if (!dashboardData?.tablaAbiertas) return ordenEstadosAbiertas;

    return [
      ...new Set(dashboardData.tablaAbiertas.map((f) => f.estado).filter(Boolean)),
    ].sort((a, b) => {
      const ia = ordenEstadosAbiertas.indexOf(a);
      const ib = ordenEstadosAbiertas.indexOf(b);

      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [dashboardData]);

  const formatearMoneda = (valor) => {
    if (valor == null || valor === "") return "—";
    const numero = Number(valor);
    if (Number.isNaN(numero)) return valor;
    return `$${numero.toFixed(2)}`;
  };

  if (loading && !dashboardData) {
    return (
      <div className="db-loading">
        <div className="db-spinner" />
        <span>Cargando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return <div className="db-error">Hubo un error cargando el dashboard: {error}</div>;
  }

  return (
    <div className="db-container">
      <div className="db-header">
        <div className="db-header-titles">
          <h1 className="db-title">Visión General</h1>
          <p className="db-subtitle">
            {rol === "vendedora"
              ? "Resumen de tus prospecciones y cierres"
              : "Vista general de prospecciones del equipo"}
          </p>
        </div>

        <div className="db-header-actions">
          <button
            type="button"
            className={`db-btn-outline ${hayFiltrosActivos ? "has-filters" : ""}`}
            onClick={() => setFiltrosVisible((prev) => !prev)}
          >
            {filtrosVisible ? "Ocultar filtros" : "Mostrar filtros"}
            {hayFiltrosActivos && <span className="db-btn-dot" />}
          </button>
        </div>
      </div>

      {filtrosVisible && (
        <form className="db-filter-panel" onSubmit={handleSubmit}>
          <div className="db-filter-grid">
            <div className="db-filter-group">
              <label>Mes</label>
              <select onChange={(e) => handleMesChange(e.target.value)} defaultValue="">
                <option value="">Todos</option>
                {[
                  "Enero",
                  "Febrero",
                  "Marzo",
                  "Abril",
                  "Mayo",
                  "Junio",
                  "Julio",
                  "Agosto",
                  "Septiembre",
                  "Octubre",
                  "Noviembre",
                  "Diciembre",
                ].map((mes, i) => (
                  <option key={mes} value={String(i + 1).padStart(2, "0")}>
                    {mes}
                  </option>
                ))}
              </select>
            </div>

            <div className="db-filter-group">
              <label>Desde</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="db-filter-group">
              <label>Hasta</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>

            {rol === "admin" && (
              <div className="db-filter-group">
                <label>Vendedora</label>
                <select
                  value={cedulaVendedora}
                  onChange={(e) => setCedulaVendedora(e.target.value)}
                >
                  <option value="">Todas</option>
                  {vendedoras.map((v) => (
                    <option key={v.cedula_ruc} value={v.cedula_ruc}>
                      {v.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="db-filter-group">
              <label>Ciudad</label>
              <select value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
                <option value="">Todas</option>
                {ciudades.map((c, i) => (
                  <option key={`${c}-${i}`} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="db-filter-group">
              <label>Sector</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)}>
                <option value="">Todos</option>
                {sectores.map((s, i) => (
                  <option key={`${s}-${i}`} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="db-filter-group">
              <label>Origen</label>
              <select value={idOrigen} onChange={(e) => setIdOrigen(e.target.value)}>
                <option value="">Todos</option>
                {origenes.map((o) => (
                  <option key={o.id_origen} value={o.id_origen}>
                    {o.descripcion}
                  </option>
                ))}
              </select>
            </div>

            <div className="db-filter-group">
              <label>Categoría</label>
              <select value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)}>
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="db-filter-actions">
            <button type="submit" className="db-btn-primary">
              Aplicar filtros
            </button>
            <button type="button" className="db-btn-secondary" onClick={limpiarFiltros}>
              Limpiar
            </button>
          </div>
        </form>
      )}

      {dashboardData && (
        <>
          <div className="db-stats-grid">
            <StatCard
              title="Total Prospecciones"
              value={dashboardData.totalVentas ?? 0}
              sub="Prospecciones registradas"
              variant="purple"
            />
            <StatCard
              title="Ganadas / Cerradas"
              value={dashboardData.totalVentasGanadas ?? 0}
              sub={`Tasa de cierre: ${(dashboardData.porcentajeGanadas ?? 0).toFixed(1)}%`}
              variant="green"
            />
            <StatCard
              title="Abiertas / En proceso"
              value={dashboardData.totalVentasAbiertas ?? 0}
              sub="Prospecciones activas"
              variant="amber"
            />
            <StatCard
              title="Valor del Pipeline"
              value={formatearMoneda(dashboardData.valorPipeline ?? 0)}
              sub="Dinero proyectado a cerrar"
              variant="blue"
            />
            <StatCard
              title="Tiempo Promedio"
              value={`${dashboardData.promedioDiasCierre ?? 0} días`}
              sub="Promedio de cierre"
              variant="blue"
            />
          </div>

          <div className="db-content-grid">
            <div className="db-card">
              <div className="db-card-header">
                <h3 className="db-card-title">Distribución por Estado</h3>
              </div>

              <div className="db-chart-wrapper">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={graficoVentasSinPerdidas}
                      dataKey="cantidad"
                      nameKey="estado"
                      outerRadius={95}
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#fff"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={12}
                            fontWeight="700"
                          >
                            {graficoVentasSinPerdidas[index]?.cantidad ?? 0}
                          </text>
                        );
                      }}
                    >
                      {graficoVentasSinPerdidas.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#ffffff",
                      }}
                      formatter={(value, name) => [`${value} prospecciones`, name]}
                    />

                    <Legend
                      formatter={(value) => {
                        const item = graficoVentasSinPerdidas.find((d) => d.estado === value);
                        const total = graficoVentasSinPerdidas.reduce(
                          (sum, d) => sum + d.cantidad,
                          0
                        );
                        const pct =
                          item && total > 0 ? ((item.cantidad / total) * 100).toFixed(1) : 0;

                        return `${value}: ${item?.cantidad || 0} (${pct}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="db-card">
              <div className="db-card-header">
                <h3 className="db-card-title">Métricas de Rendimiento</h3>
              </div>

              <div className="db-metrics-list">
                <div className="db-metric-item">
                  <span className="db-metric-label">Tasa de cierre</span>
                  <span className="db-metric-value success">
                    {(dashboardData.porcentajeGanadas ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="db-metric-item">
                  <span className="db-metric-label">Tiempo promedio</span>
                  <span className="db-metric-value primary">
                    {dashboardData.promedioDiasCierre ?? 0} días
                  </span>
                </div>
                <div className="db-metric-item">
                  <span className="db-metric-label">Monto promedio</span>
                  <span className="db-metric-value info">
                    {formatearMoneda(dashboardData.promedioMontoCierre ?? 0)}
                  </span>
                </div>
                <div className="db-metric-item">
                  <span className="db-metric-label">Abiertas</span>
                  <span className="db-metric-value warning">
                    {dashboardData.totalVentasAbiertas ?? 0}
                  </span>
                </div>
                <div className="db-metric-item">
                  <span className="db-metric-label">Ganadas</span>
                  <span className="db-metric-value success">
                    {dashboardData.totalVentasGanadas ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="db-card full-width">
              <div className="db-card-header">
                <h3 className="db-card-title">Embudo de Prospección</h3>
              </div>

              <div className="db-funnel-wrapper">
                {dashboardData?.graficoEstadosProspecto?.length > 0 ? (
                  <FunnelD3 data={dashboardData.graficoEstadosProspecto} />
                ) : (
                  <div className="db-empty">Sin datos para el embudo</div>
                )}
              </div>
            </div>

            {/* GRÁFICO: RENDIMIENTO DE VENDEDORAS */}
            <div className="db-card">
              <div className="db-card-header">
                <h3 className="db-card-title">Efectividad por Vendedora (Win Rate)</h3>
              </div>
              <div className="db-chart-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.rendimientoVendedoras || []} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="vendedora" type="category" width={100} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      formatter={(value, name, props) => [
                        `${value}% (${props.payload.ganadas} ganadas)`, 
                        "Tasa de Cierre"
                      ]} 
                    />
                    <Bar dataKey="winRate" fill="#10b981" radius={[0, 6, 6, 0]} barSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GRÁFICO NUEVO: COMPARATIVA AÑO VS AÑO */}
            <div className="db-card full-width">
              <div className="db-card-header">
                <h3 className="db-card-title">Comparativa de Ventas: Este Año vs Año Pasado</h3>
              </div>
              <div className="db-chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={dashboardData.comparativaAnual || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 13 }} tickLine={false} axisLine={false} dy={10} />
                    <YAxis tickFormatter={(val) => `$${val}`} tick={{ fill: '#64748b', fontSize: 13 }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      formatter={(value, name) => [formatearMoneda(value), `Ventas ${name}`]}
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "15px" }} />
                    <Bar dataKey={anioPasadoStr} fill="#cbd5e1" name={anioPasadoStr} radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey={anioActualStr} fill="#6366f1" name={anioActualStr} radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="db-card">
              <div className="db-card-header">
                <h3 className="db-card-title">Prospectos por Categoría</h3>
              </div>

              <div className="db-chart-wrapper">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={dashboardData.graficoCategorias || []}
                      dataKey="cantidad"
                      nameKey="categoria"
                      outerRadius={95}
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#fff"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={12}
                            fontWeight="700"
                          >
                            {dashboardData.graficoCategorias?.[index]?.cantidad ?? 0}
                          </text>
                        );
                      }}
                    >
                      {(dashboardData.graficoCategorias || []).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#ffffff",
                      }}
                      formatter={(value, name) => [`${value} prospectos`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="db-legend-custom">
                {(dashboardData.graficoCategorias || []).map((cat, idx) => {
                  const total = (dashboardData.graficoCategorias || []).reduce(
                    (sum, d) => sum + d.cantidad,
                    0
                  );
                  const pct = total > 0 ? ((cat.cantidad / total) * 100).toFixed(1) : 0;

                  return (
                    <div key={idx} className="db-legend-item">
                      <span
                        className="db-legend-dot"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span>
                        {cat.categoria}: {cat.cantidad} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="db-card">
              <div className="db-card-header">
                <h3 className="db-card-title">Resumen Rápido</h3>
              </div>

              <div className="db-summary-block">
                <div className="db-summary-row">
                  <span>Total prospecciones</span>
                  <strong>{dashboardData.totalVentas ?? 0}</strong>
                </div>
                <div className="db-summary-row">
                  <span>Prospecciones ganadas</span>
                  <strong>{dashboardData.totalVentasGanadas ?? 0}</strong>
                </div>
                <div className="db-summary-row">
                  <span>Prospecciones abiertas</span>
                  <strong>{dashboardData.totalVentasAbiertas ?? 0}</strong>
                </div>
                <div className="db-summary-row">
                  <span>Monto promedio</span>
                  <strong>{formatearMoneda(dashboardData.promedioMontoCierre ?? 0)}</strong>
                </div>
                <div className="db-summary-row">
                  <span>Días promedio</span>
                  <strong>{dashboardData.promedioDiasCierre ?? 0}</strong>
                </div>
              </div>
            </div>

            <div className="db-card full-width">
              <div className="db-card-header">
                <h3 className="db-card-title">Detalle de Prospecciones Ganadas</h3>

                {rol === "admin" && (dashboardData.tablaCierres || []).length > 0 && (
                  <button className="db-btn-primary" onClick={guardarMontos}>
                    Guardar montos editados
                  </button>
                )}
              </div>

              <div className="db-table-wrapper">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>Prospecto</th>
                      <th>Empleados</th>
                      <th>Apertura</th>
                      <th>Cierre</th>
                      <th>Días</th>
                      <th>Monto Proyectado</th>
                      <th>Monto Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData.tablaCierres || []).length === 0 && (
                      <tr>
                        <td colSpan="7" className="db-empty">
                          No hay cierres en este periodo
                        </td>
                      </tr>
                    )}

                    {(dashboardData.tablaCierres || []).map((fila, i) => (
                      <tr key={i}>
                        <td className="db-font-bold">{fila.prospecto}</td>
                        <td>{fila.numero_empleados}</td>
                        <td>{formatearFecha(fila.fecha_apertura)}</td>
                        <td>{formatearFecha(fila.fecha_cierre)}</td>
                        <td>{fila.dias}</td>
                        <td>{formatearMoneda(fila.monto_proyectado)}</td>
                        <td>
                          {rol === "admin" ? (
                            <input
                              type="number"
                              min="0"
                              value={fila.monto}
                              onChange={(e) => handleMontoChange(i, e.target.value)}
                              className="db-monto-input"
                              onWheel={(e) => e.target.blur()}
                            />
                          ) : (
                            <span className="db-money">{formatearMoneda(fila.monto)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="db-card full-width">
              <div className="db-card-header responsive">
                <h3 className="db-card-title">Prospecciones Abiertas</h3>

                <div className="db-inline-filter">
                  <label>Estado</label>
                  <select
                    value={filtroEstadoAbiertas}
                    onChange={(e) => {
                      setFiltroEstadoAbiertas(e.target.value);
                      setPaginaAbiertas(1);
                    }}
                  >
                    <option value="">Todos</option>
                    {estadosUnicosAbiertas.map((estado, i) => (
                      <option key={`${estado}-${i}`} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="db-table-wrapper">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>Prospecto</th>
                      <th>Objetivo</th>
                      <th>Empleados</th>
                      <th>Apertura</th>
                      <th>Estado</th>
                      <th>Motivo</th>
                      <th>Nota</th>
                      <th>Próximo Paso</th>
                      <th>Vendedora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abiertasPaginada.length === 0 && (
                      <tr>
                        <td colSpan="9" className="db-empty">
                          No hay prospecciones abiertas para mostrar
                        </td>
                      </tr>
                    )}

                    {abiertasPaginada.map((fila, i) => (
                      <tr key={i}>
                        <td className="db-font-bold">{fila.prospecto}</td>
                        <td>{fila.objetivo}</td>
                        <td>{fila.numero_empleados}</td>
                        <td>{formatearFecha(fila.fecha_apertura)}</td>
                        <td>
                          <span
                            className={`db-badge db-badge-${(fila.estado || "")
                              .toLowerCase()
                              .replace(/\s|\//g, "-")}`}
                          >
                            {fila.estado}
                          </span>
                        </td>
                        <td>{fila.motivo || "—"}</td>
                        <td>{fila.nota || "—"}</td>
                        <td>{fila.proximo_paso || "—"}</td>
                        <td>{fila.vendedora || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="db-pagination">
                <button
                  type="button"
                  disabled={paginaAbiertas <= 1}
                  onClick={() => setPaginaAbiertas((p) => p - 1)}
                >
                  ← Anterior
                </button>

                <span>
                  Página {paginaAbiertas} de{" "}
                  {Math.ceil(abiertasFiltradas.length / filasPorPaginaAbiertas) || 1}
                </span>

                <button
                  type="button"
                  disabled={
                    paginaAbiertas * filasPorPaginaAbiertas >= abiertasFiltradas.length
                  }
                  onClick={() => setPaginaAbiertas((p) => p + 1)}
                >
                  Siguiente →
                </button>
              </div>
            </div>

            <div className="db-card full-width">
              <div className="db-card-header">
                <h3 className="db-card-title">Prospecciones Declinadas / Perdidas</h3>
              </div>

              <div className="db-table-wrapper">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>Prospecto</th>
                      <th>Estado</th>
                      <th>Apertura</th>
                      <th>Cierre</th>
                      <th>Motivo de Pérdida</th>
                      <th>Observación</th>
                      <th>Vendedora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData?.tablaDeclinadas || []).length === 0 && (
                      <tr>
                        <td colSpan="7" className="db-empty">
                          No hay prospecciones declinadas para mostrar
                        </td>
                      </tr>
                    )}

                    {declinadasPaginada.map((fila, i) => (
                      <tr key={i}>
                        <td className="db-font-bold">{fila.prospecto}</td>
                        <td>
                          <span className="db-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                            {fila.estado}
                          </span>
                        </td>
                        <td>{formatearFecha(fila.fecha_apertura)}</td>
                        <td>{formatearFecha(fila.fecha_cierre)}</td>
                        <td className="db-font-bold">{fila.motivo_declinacion}</td>
                        <td style={{ maxWidth: '250px', whiteSpace: 'normal', fontSize: '0.85rem' }}>
                          {fila.observacion_declinacion}
                        </td>
                        <td>{fila.vendedora}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="db-pagination">
                <button
                  type="button"
                  disabled={paginaDeclinadas <= 1}
                  onClick={() => setPaginaDeclinadas((p) => p - 1)}
                >
                  ← Anterior
                </button>

                <span>
                  Página {paginaDeclinadas} de{" "}
                  {Math.ceil((dashboardData?.tablaDeclinadas?.length || 0) / filasPorPaginaAbiertas) || 1}
                </span>

                <button
                  type="button"
                  disabled={
                    paginaDeclinadas * filasPorPaginaAbiertas >= (dashboardData?.tablaDeclinadas?.length || 0)
                  }
                  onClick={() => setPaginaDeclinadas((p) => p + 1)}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {loading && dashboardData && (
        <div className="db-overlay-loading">
          <div className="db-spinner small" />
          <span>Actualizando datos...</span>
        </div>
      )}
    </div>
  );
};

export default DashboardModerno;