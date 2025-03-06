import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/historialVenta.css";

const HistorialVenta = () => {
  const { id_venta } = useParams();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const obtenerHistorial = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/seguimientos/venta/${id_venta}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Error al obtener historial");
        const data = await res.json();
        setHistorial(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    obtenerHistorial();
  }, [id_venta]);

  return (
    <div className="historial-container">
      <h1>📜 Historial de Seguimientos</h1>
      {loading && <p>Cargando historial...</p>}
      {error && <p className="error">{error}</p>}

      <table className="historial-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Resultado</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((h) => (
            <tr key={h.id_seguimiento}>
              <td>{new Date(h.fecha_programada).toLocaleDateString()}</td>
              <td>{h.tipo}</td>
              <td>{h.estado}</td>
              <td>{h.resultado}</td>
              <td>{h.nota}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistorialVenta;
