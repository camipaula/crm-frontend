import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/seguimientosVendedora.css";

const SeguimientosProspecto = () => {
  const { id_prospecto } = useParams();
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]); // Ventas traídas del backend
  const [ventasFiltradas, setVentasFiltradas] = useState([]); // Ventas después del filtro
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ventasAbiertas, setVentasAbiertas] = useState({});
  const [filtroEstado, setFiltroEstado] = useState("todas"); // Estado del filtro

  useEffect(() => {
    buscarSeguimientos();
  }, []);

  useEffect(() => {
    filtrarVentas(); // Filtrar ventas cuando cambia el filtro
  }, [filtroEstado, ventas]);

  const buscarSeguimientos = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/prospecto/${id_prospecto}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error obteniendo seguimientos del prospecto");
      const data = await res.json();
      setVentas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtrarVentas = () => {
    if (filtroEstado === "todas") {
      setVentasFiltradas(ventas);
    } else {
      const abiertas = filtroEstado === "abiertas";
      setVentasFiltradas(ventas.filter(venta => venta.abierta === (abiertas ? 1 : 0)));
    }
  };

  const toggleTablaSeguimientos = (id_venta) => {
    setVentasAbiertas((prev) => ({
      ...prev,
      [id_venta]: !prev[id_venta],
    }));
  };

  return (
    <div className="seguimientos-container">
      <h1 className="title">Seguimientos del Prospecto</h1>

      {/* 🔹 Filtro de Ventas Abiertas / Cerradas / Todas */}
      <div className="filtros-container">
        <label>Filtrar ventas:</label>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todas">Todas</option>
          <option value="abiertas">Abiertas</option>
          <option value="cerradas">Cerradas</option>
        </select>
      </div>

      {loading && <p>Cargando seguimientos...</p>}
      {error && <p className="error">{error}</p>}

      {ventasFiltradas.map((venta) => (
        <div key={venta.id_venta} className="venta-card">
          <div className="venta-header">
            <h3>🛒 Venta: {venta.objetivo}</h3>
            <p><strong>Estado:</strong> {venta.abierta ? "Abierta" : "Cerrada"}</p>
            <div className="venta-botones">
              <button
                className="btn-historial"
                onClick={() => navigate(`/historial-venta/${venta.id_venta}`)}
              >
                📜 Ver Historial
              </button>
              <button
                className="btn-agendar"
                onClick={() => navigate(`/agendar-seguimiento/${venta.id_venta}`)}
              >
                ➕ Agendar Seguimiento
              </button>
              <button
                className="btn-toggle-tabla"
                onClick={() => toggleTablaSeguimientos(venta.id_venta)}
              >
                {ventasAbiertas[venta.id_venta] ? "🔼 Ocultar Seguimientos" : "🔽 Ver Seguimientos"}
              </button>
            </div>
          </div>

          {ventasAbiertas[venta.id_venta] && (
            <table className="seguimientos-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Resultado</th>
                  <th>Nota</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {venta.seguimientos.map((s) => (
                  <tr key={s.id_seguimiento}>
                    <td>{new Date(s.fecha_programada).toLocaleDateString()}</td>
                    <td>{s.tipo_seguimiento.descripcion}</td>
                    <td>{s.estado}</td>
                    <td>{s.resultado ?? "Pendiente"}</td>
                    <td>{s.nota ?? "Sin nota"}</td>
                    <td>
                      <button
                        className="btn-resultado"
                        onClick={() => navigate(`/registrar-resultado/${s.id_seguimiento}`)}
                      >
                        ✍️ Registrar Resultado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
};

export default SeguimientosProspecto;
