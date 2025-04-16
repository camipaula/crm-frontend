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

  const Home = () => {
    const rol = getRol();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [cedulaVendedora, setCedulaVendedora] = useState("");
    const [sector, setSector] = useState("");
    const [ciudad, setCiudad] = useState("");
    const [idCategoria, setIdCategoria] = useState("");
    const [idOrigen, setIdOrigen] = useState("");
    const [vendedoras, setVendedoras] = useState([]);
    const [sectores, setSectores] = useState([]);
    const [ciudades, setCiudades] = useState([]);
    const [origenes, setOrigenes] = useState([]);

    const COLORS = ["#1a73e8", "#34a853", "#fbbc05", "#ea4335", "#ff6d00", "#8e44ad"];


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

  setFechaInicio(haceTresMeses.toISOString().slice(0, 10));
  setFechaFin(hoy.toISOString().slice(0, 10));

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
  fetchDashboardData();
}, []);

   
    
    useEffect(() => {
      if (fechaInicio && fechaFin) {
        fetchDashboardData();
      }
    }, [fechaInicio, fechaFin]);
    

    

    const fetchDashboardData = async () => {
      try {
        let url = new URL(`${import.meta.env.VITE_API_URL}/api/dashboard`);
        let params = {};

        if (fechaInicio && fechaFin) {
          params.fecha_inicio = fechaInicio;
          params.fecha_fin = fechaFin;
        }

        if (rol === "vendedora") {
          params.cedula_vendedora = localStorage.getItem("cedula");
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

    const handleSubmit = (e) => {
      e.preventDefault();
      fetchDashboardData();
    };

    if (loading) return <p>Cargando dashboard...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
      <Layout extraClass="dashboard-home">
        <div className="home-container">
          <h1>Bienvenida, {rol === "vendedora" ? "Vendedora" : "Administradora"}</h1>

          <form className="filtros-dashboard" onSubmit={handleSubmit}>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />

            {rol === "admin" && (
              <select value={cedulaVendedora} onChange={(e) => setCedulaVendedora(e.target.value)}>
                <option value="">Todas las vendedoras</option>
                {vendedoras.map((v) => (
                  <option key={v.cedula_ruc} value={v.cedula_ruc}>{v.nombre}</option>
                ))}
              </select>
            )}

            <select value={sector} onChange={(e) => setSector(e.target.value)}>
  <option value="">Todos los sectores</option>
  {sectores.map((s, i) => (
    <option key={i} value={s}>{s}</option>
  ))}
</select>

<select value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
  <option value="">Todas las ciudades</option>
  {ciudades.map((c, i) => (
    <option key={i} value={c}>{c}</option>
  ))}
</select>

<select value={idOrigen} onChange={(e) => setIdOrigen(e.target.value)}>
  <option value="">Todos los orígenes</option>
  {origenes.map((o) => (
    <option key={o.id_origen} value={o.id_origen}>{o.descripcion}</option>
  ))}
</select>

            <button type="submit">Filtrar</button>
          </form>
          <hr style={{ margin: "20px 0" }} />  {/* 👈 separador visual */}

          <div className="dashboard-grid">
          <div className="dashboard-card">
  <h3>📊 Resumen de Ventas</h3>
  <p>📂 Totales: <strong>{dashboardData.totalVentas}</strong></p>
  <p>🔓 Abiertas: <strong>{dashboardData.totalVentasAbiertas}</strong></p>
  <p>🔒 Cerradas: <strong>{dashboardData.totalVentasCerradas}</strong></p>
</div>


            <div className="dashboard-card">
            <h3>✅ Porcentaje Cerradas: <strong>{dashboardData.porcentajeCerradas.toFixed(1)}%</strong></h3>

              <h3>📅 Promedio de días hasta el cierre</h3>
              <p>{dashboardData.promedioDiasCierre} días</p>
            </div>
            <div className="dashboard-card">
  <h3>💵 Promedio del Monto de Cierre</h3>
  <p>${dashboardData.promedioMontoCierre}</p>
</div>


            <div className="dashboard-card">
              <h3>💡 Interés Generado</h3>
              <p>Total interesados: {dashboardData.interes.total}</p>
              <p>Porcentaje: {dashboardData.interes.porcentaje.toFixed(1)}%</p>
              <p>Cerrados desde interesados: {dashboardData.interes.cerrados}</p>
            </div>

            <div className="dashboard-card">
              <h3>🥧 Ventas Abiertas vs Cerradas</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={dashboardData.graficoVentas} dataKey="cantidad" nameKey="estado" outerRadius={80}>
                    {dashboardData.graficoVentas.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="dashboard-card">
              <h3>📌 Estados de Prospectos</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={dashboardData.graficoEstadosProspecto} dataKey="cantidad" nameKey="estado" outerRadius={80}>
                    {dashboardData.graficoEstadosProspecto.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="dashboard-card">
              <h3>📋 Detalle de Cierres</h3>
              <table>
                <thead>
                  <tr>
                    <th>Prospecto</th>
                    <th>Apertura</th>
                    <th>Cierre</th>
                    <th>Días</th>
                    <th>Monto</th>

                  </tr>
                </thead>
                <tbody>
                  {dashboardData.tablaCierres.map((fila, i) => (
                    <tr key={i}>
                      <td>{fila.prospecto}</td>
                      <td>{new Date(fila.fecha_apertura).toLocaleDateString()}</td>
                      <td>{new Date(fila.fecha_cierre).toLocaleDateString()}</td>
                      <td>{fila.dias}</td>
                      <td>${fila.monto}</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Layout>
    );
  };

  export default Home;
