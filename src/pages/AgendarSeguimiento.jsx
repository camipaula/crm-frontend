import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select"; // Usamos Select para mejor UX
import "../styles/agendarSeguimiento.css";
import { obtenerCedulaDesdeToken } from "../utils/auth";

const AgendarSeguimiento = () => {
  const { id_venta } = useParams();
  const navigate = useNavigate();

  const [fecha_programada, setFechaProgramada] = useState("");
  const [id_tipo, setIdTipo] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [nota, setNota] = useState("");
  const [tiposSeguimiento, setTiposSeguimiento] = useState([]);
  const [error, setError] = useState("");
  const cedula_vendedora = obtenerCedulaDesdeToken();


  // Obtener tipos de seguimiento desde el backend
  useEffect(() => {
    const obtenerTiposSeguimiento = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/tipos-seguimiento`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Error obteniendo tipos de seguimiento");
        const data = await res.json();
        setTiposSeguimiento(data.map(t => ({ value: t.id_tipo, label: t.descripcion })));
      } catch (err) {
        console.error(" Error obteniendo tipos de seguimiento:", err);
      }
    };

    obtenerTiposSeguimiento();
  }, []);

  const agendar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
  
      const resProspecto = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${id_venta}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!resProspecto.ok) throw new Error("Error obteniendo datos del prospecto");
  
      const venta = await resProspecto.json();
      const cedulaVendedoraAsignada = venta.prospecto?.cedula_vendedora; 
  
      if (!cedulaVendedoraAsignada) throw new Error("No se encontró vendedora asignada al prospecto");
  
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_venta,
          cedula_vendedora: cedulaVendedoraAsignada, 
          fecha_programada,
          id_tipo: id_tipo?.value,
          motivo,
          nota,
        }),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al agendar seguimiento");
  
      alert("Seguimiento agendado con éxito para la vendedora correcta");
      navigate(-1);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    }
  };
  
  

  return (
    <div className="agendar-container">
            <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

      <h1>➕ Agendar Seguimiento</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={agendar}>
        <input
          type="datetime-local"
          value={fecha_programada}
          onChange={(e) => setFechaProgramada(e.target.value)}
          required
        />

        <Select
          options={tiposSeguimiento}
          placeholder="Seleccionar Tipo de Seguimiento"
          onChange={setIdTipo}
          className="custom-select"
          required
        />

        <input
          type="text"
          placeholder="Motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          required
        />
        <textarea
          placeholder="Nota"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
        <button type="submit">Agendar Seguimiento</button>
      </form>
    
    </div>
  );
};

export default AgendarSeguimiento;
