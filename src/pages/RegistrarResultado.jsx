import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/registrarResultado.css";

const RegistrarResultado = () => {
  const { id_seguimiento } = useParams();
  const navigate = useNavigate();
  const [seguimiento, setSeguimiento] = useState(null);
  const [resultado, setResultado] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerSeguimiento();
  }, []);

  const obtenerSeguimiento = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/${id_seguimiento}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error cargando seguimiento");

      const data = await res.json();
      setSeguimiento(data);
      setResultado(data.resultado || "");
      setNota(data.nota || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const guardarResultado = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/${id_seguimiento}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resultado, nota }),
      });

      if (!res.ok) throw new Error("Error guardando resultado");

      alert("Resultado guardado correctamente");
      navigate("/seguimientos-vendedora");
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelarSeguimiento = async () => {
    if (seguimiento.estado === "cancelado") {
      alert("Este seguimiento ya está cancelado.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/${id_seguimiento}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: "cancelado" }),
      });

      if (!res.ok) throw new Error("Error cancelando seguimiento");

      alert("Seguimiento cancelado correctamente");
      navigate("/seguimientos-vendedora");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Cargando seguimiento...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="resultado-container">
      <h1>{seguimiento.estado === "pendiente" ? "Registrar Resultado" : "Editar Resultado"}</h1>
      <div className="seguimiento-info">
        <p><strong>Prospecto:</strong> {seguimiento.venta.prospecto.nombre}</p>
        <p><strong>Venta:</strong> {seguimiento.venta.objetivo}</p>
        <p><strong>Tipo de Seguimiento:</strong> {seguimiento.tipo_seguimiento.descripcion}</p>
        <p><strong>Fecha Programada:</strong> {new Date(seguimiento.fecha_programada).toLocaleDateString()}</p>
        <p><strong>Estado Actual:</strong> {seguimiento.estado}</p>
      </div>

      <textarea
        placeholder="Resultado de la interacción"
        value={resultado}
        onChange={(e) => setResultado(e.target.value)}
      />

      <textarea
        placeholder="Notas adicionales (opcional)"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />

      <button onClick={guardarResultado}>
        {seguimiento.estado === "pendiente" ? "Guardar Resultado" : "Actualizar Resultado"}
      </button>

      <button
        className="btn-cancelar"
        onClick={cancelarSeguimiento}
        disabled={seguimiento.estado === "cancelado"}
      >
        {seguimiento.estado === "cancelado" ? "Seguimiento Cancelado" : "Cancelar Seguimiento"}
      </button>
    </div>
  );
};

export default RegistrarResultado;
