import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import "../styles/agendarSeguimiento.css";
import { obtenerCedulaDesdeToken } from "../utils/auth";

const AgendarSeguimiento = () => {
  const { id_venta } = useParams();
  const navigate = useNavigate();

  const [fecha_programada, setFechaProgramada] = useState("");
  const [id_tipo, setIdTipo] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [motivo, setMotivo] = useState("");
  const [nota, setNota] = useState("");
  const [tiposSeguimiento, setTiposSeguimiento] = useState([]);
  const [error, setError] = useState("");
  const [prospecto, setProspecto] = useState({});
  const [formDataExtra, setFormDataExtra] = useState({});

  const cedula_vendedora = obtenerCedulaDesdeToken();

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
        console.error("Error obteniendo tipos de seguimiento:", err);
      }
    };

    obtenerTiposSeguimiento();
  }, []);

  const agendar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const resVenta = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${id_venta}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resVenta.ok) throw new Error("Error obteniendo datos del prospecto");

      const venta = await resVenta.json();
      const prospectoData = venta.prospecto;
      setProspecto(prospectoData);

      const cedulaVendedoraAsignada = prospectoData?.cedula_vendedora;
      if (!cedulaVendedoraAsignada) throw new Error("No se encontró vendedora asignada al prospecto");

      // Validar campos requeridos según tipo
      if (tipoSeleccionado === "email" && !prospectoData.correo && !formDataExtra.correo) {
        setError("El prospecto necesita un correo para agendar un Email.");
        return;
      }
      if ((tipoSeleccionado === "llamada" || tipoSeleccionado === "whatsapp") && !prospectoData.telefono && !formDataExtra.telefono) {
        setError("El prospecto necesita un teléfono para este tipo de seguimiento.");
        return;
      }
      if (tipoSeleccionado === "visita" && !prospectoData.direccion && !formDataExtra.direccion) {
        setError("El prospecto necesita una dirección para agendar una visita.");
        return;
      }

      // Actualizar prospecto si se llenaron datos extra
      if (Object.keys(formDataExtra).length > 0) {
        const resActualizar = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/${prospectoData.id_prospecto}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formDataExtra),
        });

        if (!resActualizar.ok) throw new Error("Error actualizando prospecto con los nuevos datos");
      }

      // Agendar el seguimiento
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

      alert("Seguimiento agendado con éxito");
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
      {prospecto?.nombre && (
  <p><strong>Prospecto:</strong> {prospecto.nombre}</p>
)}

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
          onChange={(selected) => {
            setIdTipo(selected);
            setTipoSeleccionado(selected.label.toLowerCase());
          }}
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

        {/* Campos condicionales si faltan */}
        {tipoSeleccionado === "email" && !prospecto.correo && (
          <>
            <label>Correo del Prospecto *</label>
            <input
              type="email"
              value={formDataExtra.correo || ""}
              onChange={(e) => setFormDataExtra({ ...formDataExtra, correo: e.target.value })}
              required
            />
          </>
        )}

        {(tipoSeleccionado === "llamada" || tipoSeleccionado === "whatsapp") && !prospecto.telefono && (
          <>
            <label>Teléfono del Prospecto *</label>
            <input
              type="text"
              value={formDataExtra.telefono || ""}
              onChange={(e) => setFormDataExtra({ ...formDataExtra, telefono: e.target.value })}
              required
            />
          </>
        )}

        {tipoSeleccionado === "visita" && !prospecto.direccion && (
          <>
            <label>Dirección del Prospecto *</label>
            <input
              type="text"
              value={formDataExtra.direccion || ""}
              onChange={(e) => setFormDataExtra({ ...formDataExtra, direccion: e.target.value })}
              required
            />
          </>
        )}

        <button type="submit">Agendar Seguimiento</button>
      </form>
    </div>
  );
};

export default AgendarSeguimiento;
