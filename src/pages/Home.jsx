import { useState, useEffect } from "react";
import { getRol, obtenerCedulaDesdeToken } from "../utils/auth";
import Layout from "../components/Layout";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import FunnelD3 from "../components/FunnelD3";
import "../styles/home.css";

// Colores SaaS para el Light Theme
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7"];

const StatCard = ({ label, value, sub, accent }) => (
  <div className={`stat-card-home ${accent || ""}`}>
    <span className="stat-card-home__label">{label}</span>
    <span className="stat-card-home__value">{value}</span>
    {sub && <span className="stat-card-home__sub">{sub}</span>}
  </div>
);

const SectionCard = ({ children, className = "" }) => (
  <div className={`dash-card ${className}`}>{children}</div>
);

const CardTitle = ({ children }) => (
  <h3 className="dash-card__title">{children}</h3>
);

const Home = () => {
  const rol = getRol();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  const [filtroEstadoAbiertas, setFiltroEstadoAbiertas] = useState("");
  const [filtrosVisible, setFiltrosVisible] = useState(false);

  const ordenEstadosAbiertas = [
    "Captación/ensayo",
    "Citas",
    "Cotizaciones",
    "Seguimiento",
    "Cierre de venta",
  ];

  const filasPorPagina1 = 20;

  const abiertasFiltradas = dashboardData?.tablaAbiertas?.filter(
    (f) => !filtroEstadoAbiertas || f.estado === filtroEstadoAbiertas
  ) || [];

  const abiertasPaginada = abiertasFiltradas.slice(
    (paginaAbiertas - 1) * filasPorPagina1,
    paginaAbiertas * filasPorPagina1
  );

  const fetchCategorias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!res.ok) throw new Error("Error cargando categorías");

      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  };

  const limpiarFiltros = () => {
    const hoy = new Date();
    const haceTresMeses = new Date();
    haceTresMeses.setMonth(hoy.getMonth() - 3);
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    const inicio = haceTresMeses.toISOString().slice(0, 10);
    const fin = manana.toISOString().slice(0, 10);

    setFechaInicio(inicio);
    setFechaFin(fin);
    setFechaInicioDefecto(inicio);
    setFechaFinDefecto(fin);
    setCedulaVendedora("");
    setSector("");
    setCiudad("");
    setIdCategoria("");
    setIdOrigen("");
    setPaginaAbiertas(1);
  };

  const fetchVendedoras = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!res.ok) throw new Error("Error al cargar vendedoras");

      const data = await res.json();
      setVendedoras(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar vendedoras", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    const hoy = new Date();
    const haceTresMeses = new Date();
    haceTresMeses.setMonth(hoy.getMonth() - 3);

    const inicio = haceTresMeses.toISOString().slice(0, 10);
    const fin = hoy.toISOString().slice(0, 10);

    setFechaInicio(inicio);
    setFechaFin(fin);
    setFechaInicioDefecto(inicio);
    setFechaFinDefecto(fin);

    if (rol === "admin") {
      fetchVendedoras();
    }

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

    fetchFiltros();
    fetchCategorias();
  }, [rol]);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin]);

  const handleMesChange = (mesSeleccionado) => {
    if (!mesSeleccionado) return;

    const anioActual = new Date().getFullYear();
    const primerDia = new Date(`${anioActual}-${mesSeleccionado}-01`);
    const ultimoDia = new Date(anioActual, parseInt(mesSeleccionado, 10), 0);

    setFechaInicio(primerDia.toISOString().slice(0, 10));
    setFechaFin(ultimoDia.toISOString().slice(0, 10));
  };

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

      Object.keys(params).forEach((k) => {
        url.searchParams.append(k, params[k]);
      });

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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

  const handleMontoChange = (index, nuevoMonto) => {
    const copia = [...dashboardData.tablaCierres];
    copia[index].monto = nuevoMonto;
    setDashboardData((prev) => ({ ...prev, tablaCierres: copia }));
  };

  const guardarMontosActualizados = async () => {
    try {
      const token = localStorage.getItem("token");

      for (const fila of dashboardData.tablaCierres) {
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

      alert("Montos actualizados correctamente");
      fetchDashboardData();
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPaginaAbiertas(1);
    fetchDashboardData();
  };

  const hayFiltrosActivos =
    (rol === "admin" && cedulaVendedora) ||
    ciudad ||
    sector ||
    idCategoria ||
    idOrigen ||
    fechaInicio !== fechaInicioDefecto ||
    fechaFin !== fechaFinDefecto;

  if (loading) {
    return (
      <Layout extraClass="dashboard-home">
        <div className="home-wrapper">
          <div className="dash-loading">
            <div className="dash-loading__spinner" />
            <span>Cargando dashboard...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout extraClass="dashboard-home">
        <div className="home-wrapper">
          <div className="dash-error">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout extraClass="dashboard-home">
      <div className="home-wrapper">
        <header className="dash-header">
          <div>
            <h1 className="dash-header__title">Dashboard</h1>
            <p className="dash-header__sub">
              {rol === "vendedora"
                ? "Resumen de tus prospecciones"
                : "Vista general de prospecciones"}
            </p>
          </div>

          <button
            className={`dash-filter-toggle ${filtrosVisible ? "active" : ""} ${
              hayFiltrosActivos ? "has-filters" : ""
            }`}
            onClick={() => setFiltrosVisible((v) => !v)}
            type="button"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filtros
            {hayFiltrosActivos && <span className="dash-filter-toggle__dot" />}
          </button>
        </header>

        {filtrosVisible && (
          <form className="filtros-panel" onSubmit={handleSubmit}>
            <div className="filtros-panel__grid">
              <div className="filtro-grupo">
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
                  ].map((m, i) => (
                    <option key={i} value={String(i + 1).padStart(2, "0")}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filtro-grupo">
                <label>Desde</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>

              <div className="filtro-grupo">
                <label>Hasta</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>

              {rol === "admin" && (
                <div className="filtro-grupo">
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

              <div className="filtro-grupo">
                <label>Ciudad</label>
                <select value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
                  <option value="">Todas</option>
                  {ciudades.map((c, i) => (
                    <option key={i} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filtro-grupo">
                <label>Sector</label>
                <select value={sector} onChange={(e) => setSector(e.target.value)}>
                  <option value="">Todos</option>
                  {sectores.map((s, i) => (
                    <option key={i} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filtro-grupo">
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

              <div className="filtro-grupo">
                <label>Categoría</label>
                <select
                  value={idCategoria}
                  onChange={(e) => setIdCategoria(e.target.value)}
                >
                  <option value="">Todas</option>
                  {categorias.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filtros-panel__actions">
              <button type="submit" className="btn-aplicar">
                Aplicar filtros
              </button>
              <button type="button" onClick={limpiarFiltros} className="btn-limpiar">
                Limpiar
              </button>
            </div>
          </form>
        )}

        <div className="stats-row">
          <StatCard
            label="Total Prospecciones"
            value={dashboardData.totalVentas}
            sub="Prospecciones totales"
            accent="accent-purple"
          />
          <StatCard
            label="Prospecciones Cerradas"
            value={dashboardData.totalVentasGanadas}
            sub={`${(dashboardData.porcentajeGanadas ?? 0).toFixed(1)}% del total`}
            accent="accent-green"
          />
          <StatCard
            label="Prospecciones Abiertas"
            value={dashboardData.totalVentasAbiertas}
            sub="En proceso"
            accent="accent-amber"
          />
        </div>

        <div className="dash-divider" />

        <div className="dashboard-grid">
          <SectionCard className="col-6">
            <CardTitle>Prospecciones: Abiertas y Ganadas</CardTitle>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={(dashboardData.graficoVentas || []).filter(
                    (d) => d.estado !== "Perdidas"
                  )}
                  dataKey="cantidad"
                  nameKey="estado"
                  outerRadius={90}
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const datos = (dashboardData.graficoVentas || []).filter(
                      (d) => d.estado !== "Perdidas"
                    );

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#ffffff"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={12}
                        fontWeight="600"
                      >
                        {datos[index]?.cantidad ?? 0}
                      </text>
                    );
                  }}
                >
                  {(dashboardData.graficoVentas || [])
                    .filter((d) => d.estado !== "Perdidas")
                    .map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    color: "#0f172a",
                  }}
                  formatter={(value, name) => [`${value} ventas`, name]}
                />

                <Legend
                  wrapperStyle={{ fontSize: "12px", color: "#475569" }}
                  formatter={(value) => {
                    const datos = (dashboardData.graficoVentas || []).filter(
                      (d) => d.estado !== "Perdidas"
                    );
                    const item = datos.find((d) => d.estado === value);
                    const total = datos.reduce((sum, d) => sum + d.cantidad, 0);
                    const pct =
                      item && total > 0
                        ? ((item.cantidad / total) * 100).toFixed(1)
                        : 0;

                    return `${value}: ${item?.cantidad || 0} (${pct}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard className="col-6 metrics-col">
            <CardTitle>Métricas de Rendimiento</CardTitle>
            <div className="metrics-list">
              <div className="metrics-item">
                <span className="metrics-item__label">Tasa de Cierre</span>
                <span className="metrics-item__value green">
                  {(dashboardData.porcentajeGanadas ?? 0).toFixed(1)}%
                </span>
              </div>
              <div className="metrics-item">
                <span className="metrics-item__label">Tiempo Promedio</span>
                <span className="metrics-item__value purple">
                  {dashboardData.promedioDiasCierre} días
                </span>
              </div>
              <div className="metrics-item">
                <span className="metrics-item__label">Monto Promedio</span>
                <span className="metrics-item__value blue">
                  ${dashboardData.promedioMontoCierre}
                </span>
              </div>
              <div className="metrics-item">
                <span className="metrics-item__label">Abiertas</span>
                <span className="metrics-item__value amber">
                  {dashboardData.totalVentasAbiertas}
                </span>
              </div>
              <div className="metrics-item">
                <span className="metrics-item__label">Cerradas (ganadas)</span>
                <span className="metrics-item__value green">
                  {dashboardData.totalVentasGanadas}
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard className="col-12">
            <CardTitle>Fases de Prospección</CardTitle>
            {dashboardData?.graficoEstadosProspecto?.length > 0 && (
              <FunnelD3 data={dashboardData.graficoEstadosProspecto} />
            )}
          </SectionCard>

          <SectionCard className="col-6">
            <CardTitle>Prospectos por Categoría</CardTitle>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={dashboardData.graficoCategorias || []}
                  dataKey="cantidad"
                  nameKey="categoria"
                  outerRadius={90}
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
                        fill="#ffffff"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={12}
                        fontWeight="600"
                      >
                        {dashboardData.graficoCategorias[index].cantidad}
                      </text>
                    );
                  }}
                >
                  {(dashboardData.graficoCategorias || []).map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    color: "#0f172a",
                  }}
                  formatter={(value, name) => [`${value} prospectos`, name]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="leyenda-custom">
              {(dashboardData.graficoCategorias || []).map((cat, idx) => {
                const total = (dashboardData.graficoCategorias || []).reduce(
                  (s, d) => s + d.cantidad,
                  0
                );
                const pct = total > 0 ? ((cat.cantidad / total) * 100).toFixed(1) : 0;

                return (
                  <div key={idx} className="leyenda-item">
                    <span
                      className="leyenda-dot"
                      style={{ background: COLORS[idx % COLORS.length] }}
                    />
                    <span>
                      {cat.categoria}: {cat.cantidad} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard className="col-12">
            <CardTitle>Detalle de Prospecciones Ganadas</CardTitle>
            <div className="tabla-scroll">
              <table className="dash-table">
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
                  {(dashboardData.tablaCierres || []).map((fila, i) => (
                    <tr key={i}>
                      <td className="font-medium">{fila.prospecto}</td>
                      <td>{fila.numero_empleados}</td>
                      <td>{new Date(fila.fecha_apertura).toLocaleDateString()}</td>
                      <td>{new Date(fila.fecha_cierre).toLocaleDateString()}</td>
                      <td>{fila.dias}</td>
                      <td>
                        {fila.monto_proyectado != null
                          ? `$${parseFloat(fila.monto_proyectado).toFixed(2)}`
                          : "—"}
                      </td>
                      <td>
                        {rol === "admin" ? (
                          <input
                            type="number"
                            min="0"
                            value={fila.monto}
                            onChange={(e) => handleMontoChange(i, e.target.value)}
                            className="monto-input"
                            onWheel={(e) => e.target.blur()}
                          />
                        ) : (
                          <span className="font-bold text-green">${fila.monto}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {rol === "admin" && (dashboardData.tablaCierres || []).length > 0 && (
                <button className="btn-guardar" onClick={guardarMontosActualizados}>
                  Guardar montos editados
                </button>
              )}
            </div>
          </SectionCard>

          <SectionCard className="col-12">
            <div className="tabla-header-row">
              <CardTitle>Prospecciones Abiertas</CardTitle>

              <div className="filtro-inline">
                <label>Estado:</label>
                <select
                  value={filtroEstadoAbiertas}
                  onChange={(e) => {
                    setFiltroEstadoAbiertas(e.target.value);
                    setPaginaAbiertas(1);
                  }}
                >
                  <option value="">Todos</option>
                  {(() => {
                    const estadosUnicos = dashboardData?.tablaAbiertas
                      ? [
                          ...new Set(
                            dashboardData.tablaAbiertas
                              .map((f) => f.estado)
                              .filter(Boolean)
                          ),
                        ].sort((a, b) => {
                          const ia = ordenEstadosAbiertas.indexOf(a);
                          const ib = ordenEstadosAbiertas.indexOf(b);

                          if (ia === -1 && ib === -1) return a.localeCompare(b);
                          if (ia === -1) return 1;
                          if (ib === -1) return -1;
                          return ia - ib;
                        })
                      : ordenEstadosAbiertas;

                    return estadosUnicos.map((e, i) => (
                      <option key={i} value={e}>
                        {e}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            <div className="tabla-scroll">
              <table className="dash-table">
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
                  {abiertasPaginada.map((fila, i) => (
                    <tr key={i}>
                      <td className="font-medium">{fila.prospecto}</td>
                      <td>{fila.objetivo}</td>
                      <td>{fila.numero_empleados}</td>
                      <td>{new Date(fila.fecha_apertura).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={`estado-badge estado-${(fila.estado || "")
                            .toLowerCase()
                            .replace(/\s|\//g, "-")}`}
                        >
                          {fila.estado}
                        </span>
                      </td>
                      <td>{fila.motivo}</td>
                      <td>{fila.nota}</td>
                      <td>{fila.proximo_paso}</td>
                      <td>{fila.vendedora}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="paginador">
                <button
                  disabled={paginaAbiertas <= 1}
                  onClick={() => setPaginaAbiertas((p) => p - 1)}
                >
                  ← Anterior
                </button>

                <span>
                  Página {paginaAbiertas} de{" "}
                  {Math.ceil(abiertasFiltradas.length / filasPorPagina1) || 1}
                </span>

                <button
                  disabled={paginaAbiertas * filasPorPagina1 >= abiertasFiltradas.length}
                  onClick={() => setPaginaAbiertas((p) => p + 1)}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </Layout>
  );
};

export default Home;