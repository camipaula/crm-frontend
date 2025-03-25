  import { useState, useEffect } from "react";
  import { useParams, useNavigate } from "react-router-dom";
  import "../styles/registrarResultado.css";

  const opcionesEstado = [
    { value: "nuevo", label: "Nuevo" },
    { value: "contactar", label: "Contactar" },
    { value: "cita", label: "Cita" },
    { value: "visita", label: "Visita" },
    { value: "en_prueba", label: "En Prueba" },       
    { value: "proformado", label: "Proformado" },
    { value: "no_interesado", label: "No Interesado" }, 
    { value: "interesado", label: "Interesado" },
    { value: "ganado", label: "Ganado" },
    { value: "perdido", label: "Perdido" },
    { value: "archivado", label: "Archivado" },
  ];



  const RegistrarResultado = () => {
    const { id_seguimiento } = useParams();
    const navigate = useNavigate();
    const [seguimiento, setSeguimiento] = useState(null);
    const [resultado, setResultado] = useState("");
    const [nota, setNota] = useState("");
    const [estadoProspecto, setEstadoProspecto] = useState("interesado"); // 🔹 Estado inicial como "interesado"
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

        // Asegurar que el estado del prospecto se establezca correctamente
        if (data.venta && data.venta.prospecto) {
          setEstadoProspecto(data.venta.prospecto.estado);
        }

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
          body: JSON.stringify({ 
            resultado, 
            nota, 
            estado: estadoProspecto // 🔹 Enviar el estado correctamente
          }),
        });

        if (!res.ok) throw new Error("Error guardando resultado");

        // Obtener nuevamente el seguimiento para reflejar cambios
        await obtenerSeguimiento();

        alert("Resultado guardado correctamente");
        navigate(-1);
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
        navigate(-1);
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
          <p><strong>Motivo:</strong> {seguimiento.motivo}</p>

        </div>

        <textarea
          placeholder="Resultado de la interacción"
          value={resultado}
          onChange={(e) => setResultado(e.target.value)}
        />

        <textarea
          placeholder="Notas adicionales (opcional)"
          value={nota}
          readOnly
          onChange={(e) => setNota(e.target.value)}
        />

        {/* Selector para cambiar el estado del prospecto */}
        <label>Estado del Prospecto:</label>
        <select 
          value={estadoProspecto} 
          onChange={(e) => setEstadoProspecto(e.target.value)}
        >
          {opcionesEstado.map((estado) => (
            <option key={estado.value} value={estado.value}>
              {estado.label}
            </option>
          ))}
        </select>

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
        <button className="btn-volver" onClick={() => navigate(-1)}>← Volver</button>

      </div>
    );
  };

  export default RegistrarResultado;
