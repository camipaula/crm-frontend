import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/verSeguimientos.css";

const VerSeguimientos = () => {
  const { id_venta } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [seguimientos, setSeguimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerSeguimientos();
  }, []);

  const obtenerSeguimientos = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${id_venta}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error obteniendo los seguimientos");
      const data = await res.json();

      // 🔹 Ordenamos los seguimientos de la más nueva a la más antigua 📅
      const seguimientosOrdenados = (data.seguimientos || []).sort(
        (a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada)
      );

      setVenta(data);
      setSeguimientos(seguimientosOrdenados);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ver-seguimientos-container">
      <h1 className="title">Seguimientos de la Prospección</h1>

      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      {venta && (
        <div className="info-venta">
          <h2>📌 Prospección: {venta.prospecto?.nombre || "Sin Prospecto"}</h2>
          <p><strong>Objetivo:</strong> {venta.objetivo}</p>
          <p><strong>Estado:</strong> {venta.abierta ? "Abierta" : "Cerrada"}</p>
        </div>
      )}

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
  {seguimientos.map((s, index) => {
    const esUltimoSeguimiento = index === 0;

    return (
      <tr key={s.id_seguimiento}>
        <td>{new Date(s.fecha_programada).toLocaleDateString()}</td>
        <td>{s.tipo_seguimiento?.descripcion || "Sin tipo"}</td> {/* ✅ Ya debería mostrar correctamente */}
        <td>{s.estado}</td>
        <td>{s.resultado || "Pendiente"}</td>
        <td>{s.nota || "Sin nota"}</td>
        <td>
          {!s.resultado ? (
            <button
              className="btn-resultado"
              onClick={() => navigate(`/registrar-resultado/${s.id_seguimiento}`)}
            >
              ✍️ Registrar Resultado
            </button>
          ) : esUltimoSeguimiento ? (
            <button
              className="btn-agendar"
              onClick={() => navigate(`/agendar-seguimiento/${id_venta}`)}
            >
              ➕ Agendar Siguiente Interacción
            </button>
          ) : null}
        </td>
      </tr>
    );
  })}
</tbody>

      </table>

      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>
    </div>
  );
};

export default VerSeguimientos;
