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

      //Ordenamos los seguimientos de la más nueva a la más antigua 📅
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
          <p><strong>Contacto:</strong> {venta.prospecto?.nombre_contacto || "No registrado"}</p>
          <p><strong>Correo:</strong> {venta.prospecto?.correo || "No registrado"}</p>
          <p><strong>Objetivo:</strong> {venta.objetivo}</p>
          <p><strong>Estado:</strong> {venta.abierta ? "Abierta" : "Cerrada"}</p>
          <p><strong>📅 Prospecto creado:</strong>{" "}
      {venta.prospecto?.created_at
        ? new Date(venta.prospecto.created_at).toLocaleDateString("es-EC", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Sin fecha"}
    </p>
        </div>
      )}
      

{seguimientos.length === 0 ? (
  <div className="sin-seguimientos">
    <p>No hay seguimientos registrados para esta prospección.</p>
    <button
      className="btn-agendar"
      onClick={() => navigate(`/agendar-seguimiento/${id_venta}`)}
    >
      ➕ Agendar Primer Seguimiento
    </button>
  </div>
) : (
  <table className="ver-seguimientos-table">
    
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Tipo</th>
        <th>Estado</th>
        <th>Motivo</th>
        <th>Nota</th>
        <th>Resultado</th>
        <th>Acción</th>
      </tr>
    </thead>
    <tbody>
      {seguimientos.map((s) => {
        return (
          <tr key={s.id_seguimiento}>
            <td>{new Date(s.fecha_programada).toLocaleDateString()}</td>
            <td>{s.tipo_seguimiento?.descripcion || "Sin tipo"}</td>
            <td>{s.estado}</td>
            <td>{s.motivo || "Sin motivo"}</td>
            <td>{s.nota || "Sin nota"}</td>
            <td>{s.resultado || "Pendiente"}</td>

            <td>
  {!s.resultado && (
    <button
      className="btn-resultado"
      onClick={() => navigate(`/registrar-resultado/${s.id_seguimiento}`)}
    >
      ✍️ Registrar Resultado
    </button>
  )}
</td>

          </tr>
        );
      })}
    </tbody>
  </table>
)}



      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>
    </div>
  );
};

export default VerSeguimientos;
