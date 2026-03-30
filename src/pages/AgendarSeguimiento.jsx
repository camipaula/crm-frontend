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
  const [duracionMinutos, setDuracionMinutos] = useState(30);

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
        setTiposSeguimiento(data.map((t) => ({ value: t.id_tipo, label: t.descripcion })));
      } catch (err) {
        console.error("Error obteniendo tipos de seguimiento:", err);
      }
    };

    obtenerTiposSeguimiento();
  }, []);

  useEffect(() => {
    const obtenerProspecto = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${id_venta}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Error cargando prospecto");
        const data = await res.json();
        setProspecto(data.prospecto);
      } catch (err) {
        console.error("Error al obtener prospecto:", err);
      }
    };

    obtenerProspecto();
  }, [id_venta]);

  const agendar = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const fechaSeleccionada = new Date(fecha_programada);
      const hoy = new Date();
      const unAnioDespues = new Date();
      unAnioDespues.setFullYear(hoy.getFullYear() + 1);

      if (fechaSeleccionada > unAnioDespues) {
        setError("La fecha programada es muy lejana.");
        return;
      }

      const cedulaVendedoraAsignada = prospecto?.cedula_vendedora;
      if (!cedulaVendedoraAsignada) {
        throw new Error("No se encontró vendedora asignada al prospecto");
      }

      if (tipoSeleccionado === "email" && !prospecto.correo && !formDataExtra.correo) {
        setError("El prospecto necesita un correo para agendar un Email.");
        return;
      }

      if (
        (tipoSeleccionado === "llamada" || tipoSeleccionado === "whatsapp") &&
        !prospecto.telefono &&
        !formDataExtra.telefono
      ) {
        setError("El prospecto necesita un teléfono para este tipo de seguimiento.");
        return;
      }

      if (tipoSeleccionado === "visita" && !prospecto.direccion && !formDataExtra.direccion) {
        setError("El prospecto necesita una dirección para agendar una visita.");
        return;
      }

      if (Object.keys(formDataExtra).length > 0) {
        const resActualizar = await fetch(
          `${import.meta.env.VITE_API_URL}/api/prospectos/${prospecto.id_prospecto}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formDataExtra),
          }
        );

        if (!resActualizar.ok) {
          throw new Error("Error actualizando prospecto con los nuevos datos");
        }
      }

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
          duracion_minutos: duracionMinutos,
          id_tipo: id_tipo?.value,
          motivo,
          nota,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al agendar seguimiento");

      alert(data.message || "Seguimiento agendado con éxito");
      navigate(-1);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    }
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "46px",
      borderRadius: "12px",
      borderColor: state.isFocused ? "#6c5ff0" : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(108, 95, 240, 0.12)" : "none",
      backgroundColor: "#f8fafc",
      "&:hover": {
        borderColor: "#cbd5e1",
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "12px",
      overflow: "hidden",
      border: "1px solid #e2e8f0",
      boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
      zIndex: 20,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#6c5ff0" : state.isFocused ? "#f5f3ff" : "#fff",
      color: state.isSelected ? "#fff" : "#334155",
      cursor: "pointer",
      fontSize: "13.5px",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#94a3b8",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#0f172a",
      fontWeight: 500,
    }),
  };

  return (
    <div className="ags-container">
      <div className="ags-header">
        <div>
          <h1 className="ags-title">Agendar seguimiento</h1>
          <p className="ags-subtitle">
            Programa una nueva actividad comercial para el prospecto seleccionado.
          </p>
        </div>

        <div className="ags-header-actions">
          <button className="ags-btn ags-btn-secondary" onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>

      {error && <div className="ags-alert ags-alert-error">{error}</div>}

      <div className="ags-card">
        <div className="ags-card-head">
          <div>
            <h3>Información del seguimiento</h3>
            <p>Completa los datos para registrar la cita o actividad.</p>
          </div>
        </div>

        {prospecto?.nombre && (
          <div className="ags-prospecto-box">
            <span className="ags-label-inline">Prospecto</span>
            <div className="ags-prospecto-name">{prospecto.nombre}</div>
          </div>
        )}

        <form onSubmit={agendar} className="ags-form">
          <div className="ags-form-grid">
            <div className="ags-field">
              <label>Fecha y hora</label>
              <input
                className="ags-input"
                type="datetime-local"
                value={fecha_programada}
                onChange={(e) => setFechaProgramada(e.target.value)}
                required
                max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                  .toISOString()
                  .slice(0, 16)}
              />
            </div>

            <div className="ags-field">
              <label>Duración estimada</label>
              <select
                className="ags-select"
                value={duracionMinutos}
                onChange={(e) => setDuracionMinutos(Number(e.target.value))}
              >
                {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((min) => (
                  <option key={min} value={min}>
                    {min} minutos
                  </option>
                ))}
              </select>
            </div>

            <div className="ags-field ags-field-full">
              <label>Tipo de seguimiento</label>
              <Select
                options={tiposSeguimiento}
                placeholder="Seleccionar tipo de seguimiento"
                onChange={(selected) => {
                  setIdTipo(selected);
                  setTipoSeleccionado(selected.label.toLowerCase());
                }}
                styles={selectStyles}
                className="ags-react-select"
              />
            </div>

            <div className="ags-field ags-field-full">
              <label>Motivo</label>
              <input
                className="ags-input"
                type="text"
                placeholder="Ingresa el motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
              />
            </div>

            <div className="ags-field ags-field-full">
              <label>Nota</label>
              <textarea
                className="ags-textarea"
                placeholder="Escribe una nota adicional"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
            </div>

            {tipoSeleccionado === "email" && (
              <div className="ags-field ags-field-full">
                <label>Correo del prospecto *</label>
                <input
                  className="ags-input"
                  type="email"
                  value={
                    formDataExtra.correo !== undefined
                      ? formDataExtra.correo
                      : prospecto.correo || ""
                  }
                  onChange={(e) =>
                    setFormDataExtra({ ...formDataExtra, correo: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {["llamada", "whatsapp"].includes(tipoSeleccionado) && (
              <div className="ags-field ags-field-full">
                <label>Teléfono del prospecto *</label>
                <input
                  className="ags-input"
                  type="text"
                  value={
                    formDataExtra.telefono !== undefined
                      ? formDataExtra.telefono
                      : prospecto.telefono || ""
                  }
                  onChange={(e) =>
                    setFormDataExtra({ ...formDataExtra, telefono: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {tipoSeleccionado === "visita" && (
              <div className="ags-field ags-field-full">
                <label>Dirección del prospecto *</label>
                <input
                  className="ags-input"
                  type="text"
                  value={
                    formDataExtra.direccion !== undefined
                      ? formDataExtra.direccion
                      : prospecto.direccion || ""
                  }
                  onChange={(e) =>
                    setFormDataExtra({ ...formDataExtra, direccion: e.target.value })
                  }
                  required
                />
              </div>
            )}
          </div>

          <div className="ags-actions">
            <button type="submit" className="ags-btn ags-btn-primary">
              Agendar seguimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgendarSeguimiento;
