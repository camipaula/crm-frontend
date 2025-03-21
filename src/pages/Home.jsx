import { useState, useEffect } from "react";
import { getRol } from "../utils/auth";
import Layout from "../components/Layout";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/dashboard`;
      if (rol === "vendedora") {
        url += `?cedula_vendedora=${localStorage.getItem("cedula")}`;
      }

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

  if (loading) return <p>Cargando dashboard...</p>;
  if (error) return <p className="error">{error}</p>;

  const COLORS = ["#1a73e8", "#34a853", "#fbbc05", "#ea4335", "#ff6d00", "#8e44ad"];

  const charts = [
    { title: "📌 Prospectos por Estado", data: dashboardData.prospectosPorEstado, type: "pie", key: "estado" },
    { title: "💰 Ventas Abiertas vs Cerradas", data: dashboardData.ventasAbiertasCerradas, type: "pie", key: "estado" },
    { title: "⏳ Seguimientos Realizados vs Pendientes", data: dashboardData.seguimientosRealizadosPendientes, type: "bar", key: "estado" },
    { title: "🏭 Prospectos por Categoría", data: dashboardData.prospectosPorCategoria, type: "bar", key: "categoria_prospecto.nombre" },
    { title: "📊 Prospectos Nuevos", data: dashboardData.prospectosNuevos, type: "bar", key: "vendedora_prospecto.nombre" }
  ];

  return (
    <Layout>
      <div className="home-container">
        <h1>Bienvenida, {rol === "vendedora" ? "Vendedora" : "Administradora"}</h1>
        <p> Selecciona una opción del menú para empezar.</p>

        <div className="dashboard-grid">
          {charts.map((chart, index) => (
            <div key={index} className="dashboard-card">
              <h3>{chart.title}</h3>
              <ResponsiveContainer width="100%" height={250}>
                {chart.type === "pie" ? (
                  <PieChart>
                    <Pie
                      data={chart.data.length > 0 ? chart.data : [{ [chart.key]: "Sin datos", cantidad: 0 }]}
                      dataKey="cantidad"
                      nameKey={chart.key}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
                    >
                      {(chart.data.length > 0 ? chart.data : [{ cantidad: 0 }]).map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : (
                  <BarChart data={chart.data.length > 0 ? chart.data : [{ [chart.key]: "Sin datos", cantidad: 0 }]}>
                    <XAxis dataKey={chart.key} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill={COLORS[index % COLORS.length]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
