import { useState, useEffect } from "react";
import { getRol } from "../utils/auth";
import Layout from "../components/Layout";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,

} from "recharts";
import "../styles/home.css";
import { obtenerCedulaDesdeToken } from "../utils/auth";
import FunnelD3 from "../components/FunnelD3";



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
  // Estados posibles para prospecciones abiertas (excluyendo "Cierre de venta" que son ganadas)
  const ordenEstadosAbiertas = [
    "Captación/ensayo",
    "Citas",
    "Cotizaciones",
    "Seguimiento",
    "Cierre de venta",
  ];

  const filasPorPagina1 = 20;

  const abiertasFiltradas = dashboardData?.tablaAbiertas?.filter(f =>
    !filtroEstadoAbiertas || f.estado === filtroEstadoAbiertas
  );

  const abiertasPaginada = abiertasFiltradas?.slice(
    (paginaAbiertas - 1) * filasPorPagina1,
    paginaAbiertas * filasPorPagina1
  );



  const COLORS = ["#1a73e8", "#34a853", "#fbbc05", "#ea4335", "#ff6d00", "#8e44ad"];

  const fetchCategorias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setCategorias(data);
    } catch (error) {
      console.error("❌ Error cargando categorías:", error);
    }
  };


  const hayFiltrosActivos = () => {
    return (
      (rol === "admin" && cedulaVendedora) ||
      ciudad ||
      sector ||
      idCategoria ||
      idOrigen ||
      fechaInicio !== fechaInicioDefecto ||
      fechaFin !== fechaFinDefecto
    );
  };

  const limpiarFiltros = () => {
    const hoy = new Date();
    const haceTresMeses = new Date();
    haceTresMeses.setMonth(hoy.getMonth() - 3);

    // SETEAR fecha fin como mañana
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1); // suma un día

    const inicio = haceTresMeses.toISOString().slice(0, 10);
    const fin = manana.toISOString().slice(0, 10); // ahora incluye todo lo de hoy

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
      const data = await res.json();
      setVendedoras(data);
    } catch (error) {
      console.error("Error al cargar vendedoras", error);
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

    if (rol === "admin") fetchVendedoras();

    const fetchData = async () => {
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

        const sectores = await sectoresRes.json();
        const ciudades = await ciudadesRes.json();
        const origenes = await origenesRes.json();

        setSectores(Array.isArray(sectores) ? sectores : []);
        setCiudades(Array.isArray(ciudades) ? ciudades : []);
        setOrigenes(Array.isArray(origenes) ? origenes : []);
      } catch (error) {
        console.error("❌ Error cargando filtros:", error);
      }
    };

    fetchData();
    fetchCategorias();
    fetchDashboardData();
  }, []);



  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchDashboardData();
    }
  }, [fechaInicio, fechaFin]);



  const handleMesChange = (mesSeleccionado) => {
    if (!mesSeleccionado) return;

    const anioActual = new Date().getFullYear();
    const primerDia = new Date(`${anioActual}-${mesSeleccionado}-01`);
    const ultimoDia = new Date(anioActual, parseInt(mesSeleccionado), 0); // el día 0 del siguiente mes es el último día del mes actual

    const inicio = primerDia.toISOString().slice(0, 10);
    const fin = ultimoDia.toISOString().slice(0, 10);

    setFechaInicio(inicio);
    setFechaFin(fin);
  };

  const fetchDashboardData = async () => {
    try {
      let url = new URL(`${import.meta.env.VITE_API_URL}/api/dashboard`);
      let params = {};

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

      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!res.ok) throw new Error("Error al obtener datos del dashboard");

      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMontoChange = (index, nuevoMonto) => {
    const copia = [...dashboardData.tablaCierres];
    copia[index].monto = nuevoMonto;
    setDashboardData(prev => ({ ...prev, tablaCierres: copia }));
  };

  const guardarMontosActualizados = async () => {
    try {
      const token = localStorage.getItem("token");
      for (const fila of dashboardData.tablaCierres) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/actualizar-monto`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            id_venta: fila.id_venta,
            monto: parseFloat(fila.monto)
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Error actualizando monto");
        }
      }

      alert("Montos actualizados correctamente");

      setLoading(true);
      fetchDashboardData();

    } catch (err) {
      alert("❌ " + err.message);
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();

    fetchDashboardData();
  };

  if (loading) return (
    <Layout extraClass="dashboard-home">
      <div className="home-container">
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: "60vh",
          fontSize: "18px",
          color: "#667eea",
          fontWeight: "600"
        }}>
          Cargando dashboard...
        </div>
      </div>
    </Layout>
  );
  
  if (error) return (
    <Layout extraClass="dashboard-home">
      <div className="home-container">
        <div className="error" style={{ 
          padding: "20px",
          background: "rgba(239, 68, 68, 0.1)",
          borderRadius: "12px",
          borderLeft: "4px solid #ef4444"
        }}>
          {error}
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout extraClass="dashboard-home">
      <div className="home-container">
        <header className="dashboard-header">
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            {rol === "vendedora" ? "Resumen de tus prospecciones" : "Vista general de prospecciones"}
          </p>
        </header>

        <form className="filtros-dashboard" onSubmit={handleSubmit}>
            <div className="filtros-dashboard-header">
              <span className="filtros-dashboard-icon">🔍</span>
              <span className="filtros-dashboard-titulo">Filtros del dashboard</span>
            </div>
            <div className="filtros-dashboard-grid">
              <div className="filtro-grupo-home">
                <label>Mes</label>
                <select onChange={(e) => handleMesChange(e.target.value)} defaultValue="">
                  <option value="">Todos</option>
                  <option value="01">Enero</option>
                  <option value="02">Febrero</option>
                  <option value="03">Marzo</option>
                  <option value="04">Abril</option>
                  <option value="05">Mayo</option>
                  <option value="06">Junio</option>
                  <option value="07">Julio</option>
                  <option value="08">Agosto</option>
                  <option value="09">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
              </div>
              <div className="filtro-grupo-home">
                <label>Desde</label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div className="filtro-grupo-home">
                <label>Hasta</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
              {rol === "admin" && (
                <div className="filtro-grupo-home">
                  <label>Vendedora</label>
                  <select value={cedulaVendedora} onChange={(e) => setCedulaVendedora(e.target.value)}>
                    <option value="">Todas</option>
                    {vendedoras.map((v) => (
                      <option key={v.cedula_ruc} value={v.cedula_ruc}>{v.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="filtro-grupo-home">
                <label>Ciudad</label>
                <select value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
                  <option value="">Todas</option>
                  {ciudades.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="filtro-grupo-home">
                <label>Sector</label>
                <select value={sector} onChange={(e) => setSector(e.target.value)}>
                  <option value="">Todos</option>
                  {sectores.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="filtro-grupo-home">
                <label>Origen</label>
                <select value={idOrigen} onChange={(e) => setIdOrigen(e.target.value)}>
                  <option value="">Todos</option>
                  {origenes.map((o) => (
                    <option key={o.id_origen} value={o.id_origen}>{o.descripcion}</option>
                  ))}
                </select>
              </div>
              <div className="filtro-grupo-home">
                <label>Categoría</label>
                <select value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)}>
                  <option value="">Todas</option>
                  {categorias.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="filtros-dashboard-actions">
              <button type="submit" className="filtros-btn-aplicar">Aplicar filtros</button>
              <button type="button" onClick={limpiarFiltros} className="filtros-btn-limpiar">
                Limpiar
              </button>
            </div>
          </form>

        {/* Tarjetas de métricas principales */}
        <div className="dashboard-metrics-section">
          <div className="metric-card primary">
            <h4>Total Prospecciones</h4>
            <div className="metric-value">{dashboardData.totalVentas}</div>
            <div className="metric-label">Prospecciones totales</div>
          </div>
          <div className="metric-card success">
            <h4>Prospecciones Cerradas</h4>
            <div className="metric-value">{dashboardData.totalVentasGanadas}</div>
            <div className="metric-label">{(dashboardData.porcentajeGanadas ?? 0).toFixed(1)}% del total</div>
          </div>
          <div className="metric-card warning">
            <h4>Prospecciones Abiertas</h4>
            <div className="metric-value">{dashboardData.totalVentasAbiertas}</div>
            <div className="metric-label">En proceso</div>
          </div>
        </div>

        <hr />

        <div className="dashboard-grid">

          <div className="dashboard-card-c chart-card">

            <h3>🥧 Prospecciones: Abiertas y Ganadas</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={(dashboardData.graficoVentas || []).filter(d => d.estado !== "Perdidas")}
                  dataKey="cantidad"
                  nameKey="estado"
                  outerRadius={80}
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    //const total = dashboardData.graficoVentas.reduce((sum, d) => sum + d.cantidad, 0);
                    const datosChart = (dashboardData.graficoVentas || []).filter(d => d.estado !== "Perdidas");
                    const value = datosChart[index]?.cantidad ?? 0;
                    //const porcentaje = ((value / total) * 100).toFixed(1);

                    return (
                      <text x={x} y={y} fill="#333" textAnchor="middle" dominantBaseline="central" fontSize={12}>
                        {`${value}`}
                      </text>
                    );
                  }}

                >
                  {(dashboardData.graficoVentas || []).filter(d => d.estado !== "Perdidas").map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} ventas`, name]}
                />
                <Legend
                  formatter={(value) => {
                    const datosChart = (dashboardData.graficoVentas || []).filter(d => d.estado !== "Perdidas");
                    const item = datosChart.find((d) => d.estado === value);
                    const total = datosChart.reduce((sum, d) => sum + d.cantidad, 0);
                    const porcentaje = item && total > 0 ? ((item.cantidad / total) * 100).toFixed(1) : 0;
                    return `${value}: ${item?.cantidad || 0} (${porcentaje}%)`;
                  }}
                />

              </PieChart>
            </ResponsiveContainer>

          </div>
          <div className="dashboard-resumen-container">
            <div className="dashboard-card resumen">
              <h3>📊 Métricas de Rendimiento</h3>
              <div style={{ marginTop: "20px" }}>
                <h4>✅ Tasa de Cierre</h4>
                <p style={{ fontSize: "28px", fontWeight: "700", color: "#10b981", marginBottom: "20px" }}>
                  {(dashboardData.porcentajeGanadas ?? 0).toFixed(1)}%
                </p>
                
                <h4>📅 Tiempo Promedio</h4>
                <p style={{ fontSize: "20px", fontWeight: "600", color: "#667eea", marginBottom: "20px" }}>
                  {dashboardData.promedioDiasCierre} días
                </p>
                
                <h4>💵 Monto Promedio</h4>
                <p style={{ fontSize: "20px", fontWeight: "600", color: "#764ba2" }}>
                  ${dashboardData.promedioMontoCierre}
                </p>
              </div>
            </div>

            <div className="dashboard-card resumen-secundario">
              <h3>📈 Resumen Detallado</h3>
              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                  <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "5px" }}>TOTALES</p>
                  <p style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>{dashboardData.totalVentas}</p>
                </div>
                <div>
                  <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "5px" }}>ABIERTAS</p>
                  <p style={{ fontSize: "24px", fontWeight: "700", color: "#f59e0b" }}>{dashboardData.totalVentasAbiertas}</p>
                </div>
                <div>
                  <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "5px" }}>CERRADAS (GANADAS)</p>
                  <p style={{ fontSize: "24px", fontWeight: "700", color: "#10b981" }}>{dashboardData.totalVentasGanadas}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fases de Prospección */}
          <div className="dashboard-card1">
            <h3>📊 Fases de Prospección</h3>
            {dashboardData?.graficoEstadosProspecto?.length > 0 && (
              <FunnelD3 data={dashboardData.graficoEstadosProspecto} />
            )}
          </div>


          {/*<div className="dashboard-card">
            <h3>🏷️ PROSPECTOS POR CATEGORÍA</h3>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip formatter={(value) => [`${value} prospectos`]} />
                <Funnel
                  dataKey="cantidad"
                  nameKey="categoria"
                  data={[...dashboardData.graficoCategorias].sort((a, b) => b.cantidad - a.cantidad)}
                  isAnimationActive
                >
                  {dashboardData.graficoCategorias.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="cantidad"
                    position="inside"
                    style={{ fill: "#fff", fontSize: 12, fontWeight: "bold" }}
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>

            {/* Leyenda manual 
            <div style={{ marginTop: "10px" }}>
              {[...dashboardData.graficoCategorias]
                .sort((a, b) => b.cantidad - a.cantidad)
                .map((cat, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor: COLORS[idx % COLORS.length],
                        marginRight: "8px",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span style={{ fontSize: "13px", color: "#333" }}>
                      {cat.categoria.toUpperCase()}: {cat.cantidad}
                    </span>
                  </div>
                ))}
            </div>
          </div> */}

          <div className="dashboard-card chart-card">
            <h3>🏷️ Prospectos por Categoría</h3>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.graficoCategorias}
                    dataKey="cantidad"
                    nameKey="categoria"
                    outerRadius={90}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const value = dashboardData.graficoCategorias[index].cantidad;

                      return (
                        <text x={x} y={y} fill="#333" textAnchor="middle" dominantBaseline="central" fontSize={12}>
                          {`${value}`}
                        </text>
                      );
                    }}
                  >
                    {dashboardData.graficoCategorias.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} prospectos`, name]} />
                </PieChart>
              </ResponsiveContainer>

              {/* 💡 Leyenda personalizada separada abajo */}
              <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
                {dashboardData.graficoCategorias.map((cat, idx) => {
                  const total = dashboardData.graficoCategorias.reduce((sum, d) => sum + d.cantidad, 0);
                  const porcentaje = ((cat.cantidad / total) * 100).toFixed(1);
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", fontSize: "13px" }}>
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          backgroundColor: COLORS[idx % COLORS.length],
                          marginRight: "6px",
                          borderRadius: "2px"
                        }}
                      />
                      <span>{cat.categoria}: {cat.cantidad} ({porcentaje}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>





          <div className="dashboard-card tabla-cierres">
            <h3>📋 Detalle de Prospecciones Ganadas</h3>
            <div className="tabla-detalle-cierres">

              <table>
                <thead>
                  <tr>
                    <th>Prospecto</th>
                    <th>Empleados</th>
                    <th>Apertura</th>
                    <th>Cierre</th>
                    <th>Días</th>
                    <th>Monto Proyectado</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.tablaCierres.map((fila, i) => (
                    <tr key={i}>
                      <td>{fila.prospecto}</td>
                      <td>{fila.numero_empleados}</td>
                      <td>{new Date(fila.fecha_apertura).toLocaleDateString()}</td>
                      <td>{new Date(fila.fecha_cierre).toLocaleDateString()}</td>
                      <td>{fila.dias}</td>
                      <td>{fila.monto_proyectado != null ? `$${parseFloat(fila.monto_proyectado).toFixed(2)}` : "No definido"}</td>

                      <td>
                        {rol === "admin" ? (
                          <input
                            type="number"
                            min="0"
                            value={fila.monto}
                            onChange={(e) => handleMontoChange(i, e.target.value)}
                            className="sin-spinners"

                            style={{ width: "80px" }}
                            onWheel={(e) => e.target.blur()} // ❌ Previene scroll accidental

                          />
                        ) : (
                          `$${fila.monto}`
                        )}
                      </td>



                    </tr>
                  ))}
                </tbody>
              </table>
              {rol === "admin" && (
                <button onClick={guardarMontosActualizados}>
                  💾 Guardar montos editados
                </button>
              )}
            </div>
          </div>

          <div className="dashboard-card tabla-cierres">
            <div style={{ marginBottom: "10px" }}>
              <label style={{ marginRight: "10px" }}>Filtrar por estado:</label>
              <select
                value={filtroEstadoAbiertas}
                onChange={(e) => {
                  setFiltroEstadoAbiertas(e.target.value);
                  setPaginaAbiertas(1); // Reinicia paginación al cambiar filtro
                }}
              >
                <option value="">Todos</option>
                {(() => {
                  // Obtener estados únicos de tablaAbiertas si están disponibles, sino usar ordenEstadosAbiertas
                  const estadosUnicos = dashboardData?.tablaAbiertas
                    ? [...new Set(dashboardData.tablaAbiertas.map(f => f.estado).filter(Boolean))]
                        .sort((a, b) => {
                          const idxA = ordenEstadosAbiertas.indexOf(a);
                          const idxB = ordenEstadosAbiertas.indexOf(b);
                          if (idxA === -1 && idxB === -1) return a.localeCompare(b);
                          if (idxA === -1) return 1;
                          if (idxB === -1) return -1;
                          return idxA - idxB;
                        })
                    : ordenEstadosAbiertas;
                  return estadosUnicos.map((estado, i) => (
                    <option key={i} value={estado}>{estado}</option>
                  ));
                })()}
              </select>
            </div>

            <h3>🔓 Prospecciones Abiertas</h3>
            <div className="tabla-detalle-cierres">

              <table>
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
                      <td>{fila.prospecto}</td>
                      <td>{fila.objetivo}</td>

                      <td>{fila.numero_empleados}</td>
                      <td>{new Date(fila.fecha_apertura).toLocaleDateString()}</td>
                      <td>{fila.estado}</td>
                      <td>{fila.motivo}</td>
                      <td>{fila.nota}</td>
                      <td>{fila.proximo_paso}</td>
                      <td>{fila.vendedora}</td>
                    </tr>
                  ))}
                </tbody>

              </table>
              <div className="paginador-abiertas">
                {paginaAbiertas > 1 && (
                  <button onClick={() => setPaginaAbiertas(paginaAbiertas - 1)}>Anterior</button>
                )}
                <span>Página {paginaAbiertas} de {Math.ceil((abiertasFiltradas?.length || 0) / filasPorPagina1)}</span>
                {paginaAbiertas * filasPorPagina1 < (abiertasFiltradas?.length || 0) && (
                  <button onClick={() => setPaginaAbiertas(paginaAbiertas + 1)}>Siguiente</button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Home;