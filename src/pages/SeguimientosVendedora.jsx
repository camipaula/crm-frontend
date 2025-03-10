import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/seguimientosVendedora.css";

const SeguimientosVendedora = () => {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ventasAbiertas, setVentasAbiertas] = useState({}); // Estado para controlar qué ventas están abiertas

  useEffect(() => {
    buscarSeguimientos();
  }, []);

  const buscarSeguimientos = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error obteniendo seguimientos");
      const data = await res.json();
      setVentas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      <h1 className="title">Seguimientos de Prospectos</h1>
      {loading && <p>Cargando seguimientos...</p>}
      {error && <p className="error">{error}</p>}

      {ventas.map((venta) => (
        <div key={venta.id_venta} className="venta-card">
          <div className="venta-header">
            <h2> {venta.prospecto.nombre}</h2>
            <h3>🛒 Venta: {venta.objetivo}</h3>
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
                className="btn-abrir-venta"
                onClick={() =>
                  navigate(`/abrir-venta/${venta.prospecto.id_prospecto}`)
                }
              >
                🛒 Abrir Nueva Venta
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
                  <th>Motivo</th>
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
                    <td>{s.motivo ?? "Sin motivo"}</td>
                    <td>{s.nota ?? "Sin nota"}</td>
                    <td>
                      <button
                        className="btn-resultado"
                        onClick={() =>
                          navigate(`/registrar-resultado/${s.id_seguimiento}`)
                        }
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

export default SeguimientosVendedora;
