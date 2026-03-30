import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Select from "react-select";
import { getRol } from "../utils/auth";
import "../styles/calendarioAdmin.css";

const CalendarioAdmin = () => {
  const navigate = useNavigate();

  const [eventos, setEventos] = useState([]);
  const [vendedoras, setVendedoras] = useState([]);
  const [vendedoraSeleccionada, setVendedoraSeleccionada] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [mapaColoresVendedoras, setMapaColoresVendedoras] = useState({});
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [vendedoraNueva, setVendedoraNueva] = useState(null);
  const [prospectos, setProspectos] = useState([]);
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [tiposSeguimiento, setTiposSeguimiento] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  const [mostrarModalNuevoProspecto, setMostrarModalNuevoProspecto] = useState(false);
  const [mostrarModalNuevaVenta, setMostrarModalNuevaVenta] = useState(false);
  const [objetivoNuevaVenta, setObjetivoNuevaVenta] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEstado] = useState("Captación/ensayo");
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);

  const [tipoSeleccionadoTexto, setTipoSeleccionadoTexto] = useState("");
  const [prospectoDatos, setProspectoDatos] = useState({});
  const [formDataExtra, setFormDataExtra] = useState({});

  const rol = getRol();
  const esSoloLectura = rol === "lectura";

  const colores = ["#6c5ff0", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

  useEffect(() => {
    cargarVendedoras();
    cargarAgenda();
    cargarTiposSeguimiento();
  }, []);

  useEffect(() => {
    if (vendedoraNueva) {
      cargarProspectos(vendedoraNueva.value);
    }
  }, [vendedoraNueva]);

  const cargarVendedoras = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setVendedoras(data.map((v) => ({ value: v.cedula_ruc, label: v.nombre })));
    } catch (err) {
      console.error("Error cargando vendedoras:", err);
    }
  };

  const cargarProspectos = async (cedula_vendedora) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prospectos?cedula_vendedora=${cedula_vendedora}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!Array.isArray(data.prospectos)) {
        console.error("Formato inesperado al cargar prospectos:", data);
        return;
      }

      setProspectos(data.prospectos.map((p) => ({ value: p.id_prospecto, label: p.nombre })));
    } catch (err) {
      console.error("Error cargando prospectos:", err);
    }
  };

  const crearProspectoYVenta = async () => {
    if (!nuevoNombre.trim()) {
      alert("Por favor, ingresa un nombre para el prospecto.");
      return;
    }
    if (!nuevoObjetivo.trim()) {
      alert("Por favor, ingresa un objetivo para la prospección.");
      return;
    }
    if (!vendedoraNueva?.value) {
      alert("Selecciona una vendedora para asignar el prospecto.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res1 = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nuevoNombre,
          estado: nuevoEstado,
          cedula_vendedora: vendedoraNueva.value,
          objetivo: nuevoObjetivo,
        }),
      });

      const { prospecto, venta } = await res1.json();

      await cargarProspectos(vendedoraNueva.value);
      setProspectoSeleccionado({ value: prospecto.id_prospecto, label: prospecto.nombre });
      setVentaSeleccionada({ value: venta.id_venta, label: nuevoObjetivo });
      setMostrarModalNuevoProspecto(false);
      setNuevoNombre("");
      setNuevoObjetivo("");
    } catch (err) {
      console.error("Error al crear prospecto y venta:", err);
    }
  };

  const cargarVentas = async (id_prospecto) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/prospecto/${id_prospecto}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const ventasMapeadas = data.map((v) => ({ value: v.id_venta, label: v.objetivo }));
      setVentas(ventasMapeadas);
      return ventasMapeadas;
    } catch (err) {
      console.error("Error cargando ventas:", err);
      return [];
    }
  };

  const cargarTiposSeguimiento = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/tipos-seguimiento`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTiposSeguimiento(data.map((t) => ({ value: t.id_tipo, label: t.descripcion })));
    } catch (err) {
      console.error("Error cargando tipos de seguimiento:", err);
    }
  };

  const cargarAgenda = async (cedula_vendedora = "") => {
    try {
      const token = localStorage.getItem("token");
      let url = `${import.meta.env.VITE_API_URL}/api/seguimientos/agenda-general`;
      if (cedula_vendedora) url += `?cedula_vendedora=${cedula_vendedora}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();

      const nuevosColores = { ...mapaColoresVendedoras };
      let colorIndex = Object.keys(nuevosColores).length;

      const eventosConvertidos = data.map((seguimiento) => {
        const vendedoraNombre = seguimiento.venta?.prospecto?.vendedora_prospecto?.nombre || "No asignada";
        if (!nuevosColores[vendedoraNombre]) {
          nuevosColores[vendedoraNombre] = colores[colorIndex % colores.length];
          colorIndex++;
        }

        return {
          id: seguimiento.id_seguimiento,
          title: seguimiento.motivo,
          start: new Date(seguimiento.fecha_programada.replace("Z", "")),
          end: new Date(
            new Date(seguimiento.fecha_programada).getTime() +
              (seguimiento.duracion_minutos || 30) * 60000
          ),
          extendedProps: {
            tipo: seguimiento.tipo_seguimiento.descripcion,
            objetivo: seguimiento.venta.objetivo,
            prospecto: seguimiento.venta.prospecto.nombre,
            vendedora: vendedoraNombre,
            fecha: seguimiento.fecha_programada,
            duracion_minutos: seguimiento.duracion_minutos || 30,
          },
          color: nuevosColores[vendedoraNombre],
          textColor: "#fff",
        };
      });

      setMapaColoresVendedoras(nuevosColores);
      setEventos(eventosConvertidos);
    } catch (err) {
      console.error("Error al cargar la agenda:", err);
    }
  };

  const formatearParaDatetimeLocal = (fechaStr) => {
    const fecha = new Date(typeof fechaStr === "string" ? fechaStr.replace("Z", "") : fechaStr);
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    return `${año}-${mes}-${dia}T${horas}:${minutos}`;
  };

  const formatearFechaVisual = (fechaStr) => {
    const fecha = new Date(fechaStr.replace("Z", ""));
    return fecha.toLocaleString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const agendarSeguimiento = async () => {
    if (!vendedoraNueva || !ventaSeleccionada || !tipoSeleccionado) {
      setError("Faltan campos requeridos");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (tipoSeleccionadoTexto === "email" && !prospectoDatos.correo && !formDataExtra.correo) {
        alert("El prospecto necesita un correo para agendar un Email.");
        return;
      }

      if (
        ["llamada", "whatsapp"].includes(tipoSeleccionadoTexto) &&
        !prospectoDatos.telefono &&
        !formDataExtra.telefono
      ) {
        alert("El prospecto necesita un teléfono para este tipo de seguimiento.");
        return;
      }

      if (
        tipoSeleccionadoTexto === "visita" &&
        !prospectoDatos.direccion &&
        !formDataExtra.direccion
      ) {
        alert("El prospecto necesita una dirección para agendar una visita.");
        return;
      }

      if (Object.keys(formDataExtra).length > 0 && prospectoSeleccionado) {
        const resActualizar = await fetch(
          `${import.meta.env.VITE_API_URL}/api/prospectos/${prospectoSeleccionado.value}`,
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
          alert("Error actualizando datos del prospecto");
          return;
        }
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_venta: ventaSeleccionada.value,
          cedula_vendedora: vendedoraNueva.value,
          fecha_programada: fechaSeleccionada,
          id_tipo: tipoSeleccionado.value,
          motivo,
          nota: "",
        }),
      });

      if (!res.ok) throw new Error("Error al agendar seguimiento");

      alert("Seguimiento agendado correctamente");
      setMostrarModalNuevo(false);
      cargarAgenda(vendedoraSeleccionada?.value || "");
      limpiarCampos();
    } catch (err) {
      console.error("Error al agendar:", err);
      setError(err.message);
    }
  };

  const editarSeguimientoDesdeModal = async (detalle) => {
    try {
      const token = localStorage.getItem("token");
      const tipo = detalle.tipoSeleccionado || tiposSeguimiento.find((t) => t.label === detalle.tipo);
      const id_tipo = tipo?.value;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/${detalle.id}/editar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fecha_programada: detalle.fecha,
          id_tipo,
          motivo: detalle.motivo,
        }),
      });

      if (!res.ok) throw new Error("No se pudo editar el seguimiento");

      alert("Seguimiento actualizado correctamente");
      setModalDetalle(null);
      cargarAgenda(vendedoraSeleccionada?.value || "");
    } catch (err) {
      console.error("Error al editar seguimiento:", err);
      alert("Ocurrió un error al editar el seguimiento");
    }
  };

  const eliminarSeguimientoDesdeModal = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("No se pudo eliminar el seguimiento");

      alert("Seguimiento eliminado correctamente");
      setModalDetalle(null);
      cargarAgenda(vendedoraSeleccionada?.value || "");
    } catch (err) {
      console.error("Error al eliminar seguimiento:", err);
      alert("Ocurrió un error al eliminar el seguimiento");
    }
  };

  const crearVentaParaProspecto = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_prospecto: prospectoSeleccionado.value,
          objetivo: objetivoNuevaVenta,
          estado: "Captación/ensayo",
        }),
      });

      const { venta } = await res.json();

      setVentas([{ value: venta.id_venta, label: venta.objetivo }]);
      setVentaSeleccionada({ value: venta.id_venta, label: venta.objetivo });
      setMostrarModalNuevaVenta(false);
      setObjetivoNuevaVenta("");
    } catch (err) {
      console.error("Error creando venta:", err);
    }
  };

  const limpiarCampos = () => {
    setVendedoraNueva(null);
    setProspectos([]);
    setProspectoSeleccionado(null);
    setVentas([]);
    setVentaSeleccionada(null);
    setTipoSeleccionado(null);
    setTipoSeleccionadoTexto("");
    setMotivo("");
    setError("");
    setFechaSeleccionada("");
    setProspectoDatos({});
    setFormDataExtra({});
  };

  const rsStyles = {
    control: (base, state) => ({
      ...base,
      background: "#fff",
      borderColor: state.isFocused ? "#6c5ff0" : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(108,95,240,0.12)" : "none",
      borderRadius: "10px",
      minHeight: "42px",
      fontSize: "13px",
      "&:hover": {
        borderColor: "#c4b5fd",
      },
    }),
    menu: (base) => ({
      ...base,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)",
      overflow: "hidden",
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected ? "#6c5ff0" : state.isFocused ? "#f5f3ff" : "#fff",
      color: state.isSelected ? "#fff" : "#334155",
      fontSize: "13px",
      cursor: "pointer",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#94a3b8",
      fontSize: "13px",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#334155",
      fontSize: "13px",
    }),
  };

  return (
    <div className="ca-container">
      <div className="ca-header">
        <div className="ca-header-left">
          <div className="ca-header-text">
            <h1 className="ca-title">Calendario Administrativo</h1>
            <p className="ca-subtitle">
              Agenda de seguimientos y control de citas comerciales
            </p>
          </div>
        </div>

        <div className="ca-header-actions">
          <button className="ca-btn-ghost" onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>

      <div className="ca-toolbar">
        <div className="ca-toolbar-left">
          <div className="ca-filter-block">
            <label className="ca-label">Filtrar por vendedora</label>
            <Select
              options={[{ value: "", label: "Todas las vendedoras" }, ...vendedoras]}
              placeholder="Seleccionar vendedora"
              value={vendedoraSeleccionada}
              onChange={(vendedora) => {
                setVendedoraSeleccionada(vendedora);
                cargarAgenda(vendedora?.value || "");
              }}
              isClearable
              styles={rsStyles}
            />
          </div>

          {vendedoraSeleccionada && (
            <div className="ca-active-filter">
              Agenda de: <strong>{vendedoraSeleccionada.label}</strong>
            </div>
          )}
        </div>
      </div>

      {Object.keys(mapaColoresVendedoras).length > 0 && (
        <div className="ca-legend-card">
          <div className="ca-legend-title">Vendedoras</div>
          <div className="ca-legend-list">
            {Object.entries(mapaColoresVendedoras).map(([nombre, color]) => (
              <div key={nombre} className="ca-legend-item">
                <span className="ca-legend-dot" style={{ backgroundColor: color }} />
                <span>{nombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ca-card">
        <div className="ca-calendar-wrap">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            locale="es"
            slotLabelFormat={{ hour: "2-digit", minute: "2-digit", meridiem: "short" }}
            slotMinTime="08:00:00"
            slotMaxTime="19:00:00"
            height="auto"
            events={eventos}
            eventClick={({ event }) => {
              setModoEdicion(false);
              setModalDetalle({
                id: event.id,
                motivo: event.title,
                tipo: event.extendedProps.tipo,
                objetivo: event.extendedProps.objetivo,
                prospecto: event.extendedProps.prospecto,
                vendedora: event.extendedProps.vendedora,
                fecha: event.extendedProps.fecha,
                duracion_minutos: event.extendedProps.duracion_minutos || 30,
              });
            }}
            dateClick={({ date, view }) => {
              const isSoloFecha = view.type === "dayGridMonth";
              const fecha = isSoloFecha
                ? `${date.toISOString().slice(0, 10)}T09:00`
                : formatearParaDatetimeLocal(date);

              setFechaSeleccionada(fecha);
              setVendedoraNueva(vendedoraSeleccionada);

              if (vendedoraSeleccionada) {
                cargarProspectos(vendedoraSeleccionada.value);
              }

              setMostrarModalNuevo(true);
            }}
            eventContent={({ event, view }) => {
              const prospecto = event.extendedProps.prospecto || "";
              const tipo = event.extendedProps.tipo || "";
              const duracion = event.extendedProps.duracion_minutos || 30;

              if (view.type === "dayGridMonth") {
                return (
                  <div className="ca-event ca-event-month" title={`${prospecto} - ${tipo} (${duracion} min)`}>
                    <span className="ca-event-title">{prospecto}</span>
                    <span className="ca-event-meta">{tipo}</span>
                  </div>
                );
              }

              return (
                <div className="ca-event">
                  <span className="ca-event-title">{prospecto}</span>
                  <span className="ca-event-meta">
                    {tipo} ({duracion} min)
                  </span>
                </div>
              );
            }}
          />
        </div>
      </div>

      {modalDetalle && (
        <div className="ca-modal-overlay">
          <div className="ca-modal">
            <div className="ca-modal-header">
              <div>
                <h3 className="ca-modal-title">Detalle de la cita</h3>
                <p className="ca-modal-subtitle">Información del seguimiento agendado</p>
              </div>
              <button
                className="ca-icon-close"
                onClick={() => {
                  setModalDetalle(null);
                  setModoEdicion(false);
                }}
              >
                ×
              </button>
            </div>

            <div className="ca-modal-body">
              <div className="ca-detail-grid">
                <div className="ca-detail-item">
                  <span className="ca-detail-label">Prospecto</span>
                  <span className="ca-detail-value">{modalDetalle.prospecto}</span>
                </div>

                <div className="ca-detail-item">
                  <span className="ca-detail-label">Vendedora</span>
                  <span className="ca-detail-value">{modalDetalle.vendedora}</span>
                </div>

                <div className="ca-detail-item">
                  <span className="ca-detail-label">Objetivo</span>
                  <span className="ca-detail-value">{modalDetalle.objetivo}</span>
                </div>

                <div className="ca-detail-item">
                  <span className="ca-detail-label">Duración</span>
                  <span className="ca-detail-value">{modalDetalle.duracion_minutos} minutos</span>
                </div>
              </div>

              {modoEdicion ? (
                <div className="ca-form-grid">
                  <div className="ca-field">
                    <label className="ca-label">Tipo</label>
                    <Select
                      options={tiposSeguimiento}
                      value={modalDetalle.tipoSeleccionado || tiposSeguimiento.find((t) => t.label === modalDetalle.tipo)}
                      onChange={(opcion) =>
                        setModalDetalle({ ...modalDetalle, tipoSeleccionado: opcion })
                      }
                      styles={rsStyles}
                    />
                  </div>

                  <div className="ca-field">
                    <label className="ca-label">Fecha y hora</label>
                    <input
                      className="ca-input"
                      type="datetime-local"
                      value={formatearParaDatetimeLocal(modalDetalle.fecha)}
                      onChange={(e) =>
                        setModalDetalle({ ...modalDetalle, fecha: e.target.value })
                      }
                    />
                  </div>

                  <div className="ca-field ca-field-full">
                    <label className="ca-label">Motivo</label>
                    <input
                      className="ca-input"
                      type="text"
                      value={modalDetalle.motivo}
                      onChange={(e) =>
                        setModalDetalle({ ...modalDetalle, motivo: e.target.value })
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="ca-detail-grid ca-detail-grid-secondary">
                  <div className="ca-detail-item">
                    <span className="ca-detail-label">Tipo</span>
                    <span className="ca-detail-value">{modalDetalle.tipo}</span>
                  </div>

                  <div className="ca-detail-item">
                    <span className="ca-detail-label">Fecha y hora</span>
                    <span className="ca-detail-value">{formatearFechaVisual(modalDetalle.fecha)}</span>
                  </div>

                  <div className="ca-detail-item ca-detail-item-full">
                    <span className="ca-detail-label">Motivo</span>
                    <span className="ca-detail-value">{modalDetalle.motivo}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="ca-modal-actions">
              {!esSoloLectura && (
                <>
                  <button
                    className="ca-btn-primary"
                    onClick={() => navigate(`/registrar-resultado/${modalDetalle.id}`)}
                  >
                    Registrar resultado
                  </button>

                  {modoEdicion ? (
                    <>
                      <button
                        className="ca-btn-success"
                        onClick={() => editarSeguimientoDesdeModal(modalDetalle)}
                      >
                        Guardar
                      </button>
                      <button
                        className="ca-btn-ghost"
                        onClick={() => setModoEdicion(false)}
                      >
                        Cancelar edición
                      </button>
                    </>
                  ) : (
                    <button
                      className="ca-btn-ghost"
                      onClick={() => setModoEdicion(true)}
                    >
                      Editar
                    </button>
                  )}

                  <button
                    className="ca-btn-danger"
                    onClick={() => eliminarSeguimientoDesdeModal(modalDetalle.id)}
                  >
                    Eliminar
                  </button>
                </>
              )}

              <button
                className="ca-btn-ghost"
                onClick={() => {
                  setModalDetalle(null);
                  setModoEdicion(false);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalNuevo && (
        <div className="ca-modal-overlay">
          <div className="ca-modal">
            <div className="ca-modal-header">
              <div>
                <h3 className="ca-modal-title">Agendar cita</h3>
                <p className="ca-modal-subtitle">Programa un nuevo seguimiento</p>
              </div>
              <button
                className="ca-icon-close"
                onClick={() => setMostrarModalNuevo(false)}
              >
                ×
              </button>
            </div>

            <div className="ca-modal-body">
              {error && <div className="ca-alert-error">{error}</div>}

              <div className="ca-form-grid">
                <div className="ca-field">
                  <label className="ca-label">Fecha</label>
                  <input
                    className="ca-input"
                    type="datetime-local"
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                  />
                </div>

                <div className="ca-field">
                  <label className="ca-label">Vendedora</label>
                  <Select
                    options={vendedoras}
                    placeholder="Seleccionar vendedora"
                    value={vendedoraNueva}
                    onChange={(vendedora) => {
                      setVendedoraNueva(vendedora);
                      cargarProspectos(vendedora.value);
                    }}
                    styles={rsStyles}
                  />
                </div>

                <div className="ca-field">
                  <label className="ca-label">Prospecto</label>
                  <Select
                    options={[...prospectos, { value: "nuevo", label: "➕ Crear nuevo prospecto" }]}
                    placeholder="Seleccionar prospecto"
                    value={prospectoSeleccionado}
                    onChange={async (prospecto) => {
                      if (prospecto.value === "nuevo") {
                        return setMostrarModalNuevoProspecto(true);
                      }

                      setProspectoSeleccionado(prospecto);

                      const token = localStorage.getItem("token");
                      const res = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/prospectos/${prospecto.value}`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      );
                      const data = await res.json();
                      setProspectoDatos(data);

                      const ventasCargadas = await cargarVentas(prospecto.value);
                      if (ventasCargadas.length === 0) {
                        setMostrarModalNuevaVenta(true);
                      }
                    }}
                    isDisabled={!vendedoraNueva}
                    styles={rsStyles}
                  />
                </div>

                <div className="ca-field">
                  <label className="ca-label">Venta</label>
                  <Select
                    options={ventas}
                    placeholder="Seleccionar venta"
                    value={ventaSeleccionada}
                    onChange={setVentaSeleccionada}
                    isDisabled={!prospectoSeleccionado}
                    styles={rsStyles}
                  />
                </div>

                <div className="ca-field">
                  <label className="ca-label">Tipo de seguimiento</label>
                  <Select
                    options={tiposSeguimiento}
                    placeholder="Tipo de seguimiento"
                    value={tipoSeleccionado}
                    onChange={(tipo) => {
                      setTipoSeleccionado(tipo);
                      setTipoSeleccionadoTexto(tipo?.label.toLowerCase());
                    }}
                    styles={rsStyles}
                  />
                </div>

                <div className="ca-field ca-field-full">
                  <label className="ca-label">Motivo</label>
                  <input
                    className="ca-input"
                    type="text"
                    placeholder="Motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </div>

                {tipoSeleccionadoTexto === "email" && !prospectoDatos.correo && (
                  <div className="ca-field ca-field-full">
                    <label className="ca-label">Correo del prospecto *</label>
                    <input
                      className="ca-input"
                      type="email"
                      value={formDataExtra.correo || ""}
                      onChange={(e) =>
                        setFormDataExtra({ ...formDataExtra, correo: e.target.value })
                      }
                      required
                    />
                  </div>
                )}

                {["llamada", "whatsapp"].includes(tipoSeleccionadoTexto) &&
                  !prospectoDatos.telefono && (
                    <div className="ca-field ca-field-full">
                      <label className="ca-label">Teléfono del prospecto *</label>
                      <input
                        className="ca-input"
                        type="text"
                        value={formDataExtra.telefono || ""}
                        onChange={(e) =>
                          setFormDataExtra({ ...formDataExtra, telefono: e.target.value })
                        }
                        required
                      />
                    </div>
                  )}

                {tipoSeleccionadoTexto === "visita" && !prospectoDatos.direccion && (
                  <div className="ca-field ca-field-full">
                    <label className="ca-label">Dirección del prospecto *</label>
                    <input
                      className="ca-input"
                      type="text"
                      value={formDataExtra.direccion || ""}
                      onChange={(e) =>
                        setFormDataExtra({ ...formDataExtra, direccion: e.target.value })
                      }
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="ca-modal-actions">
              <button className="ca-btn-primary" onClick={agendarSeguimiento}>
                Agendar
              </button>
              <button className="ca-btn-ghost" onClick={() => setMostrarModalNuevo(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalNuevoProspecto && (
        <div className="ca-modal-overlay">
          <div className="ca-modal ca-modal-sm">
            <div className="ca-modal-header">
              <div>
                <h3 className="ca-modal-title">Nuevo prospecto</h3>
                <p className="ca-modal-subtitle">Crea un prospecto rápido para usarlo aquí</p>
              </div>
              <button
                className="ca-icon-close"
                onClick={() => setMostrarModalNuevoProspecto(false)}
              >
                ×
              </button>
            </div>

            <div className="ca-modal-body">
              <div className="ca-form-grid">
                <div className="ca-field ca-field-full">
                  <label className="ca-label">Nombre del prospecto</label>
                  <input
                    className="ca-input"
                    type="text"
                    placeholder="Nombre del prospecto"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                  />
                </div>

                <div className="ca-field ca-field-full">
                  <label className="ca-label">Estado</label>
                  <div className="ca-static-value">Captación/ensayo</div>
                </div>

                <div className="ca-field ca-field-full">
                  <label className="ca-label">Objetivo de la prospección</label>
                  <input
                    className="ca-input"
                    type="text"
                    placeholder="Objetivo de la prospección"
                    value={nuevoObjetivo}
                    onChange={(e) => setNuevoObjetivo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="ca-modal-actions">
              <button className="ca-btn-primary" onClick={crearProspectoYVenta}>
                Crear y usar
              </button>
              <button
                className="ca-btn-ghost"
                onClick={() => setMostrarModalNuevoProspecto(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalNuevaVenta && (
        <div className="ca-modal-overlay">
          <div className="ca-modal ca-modal-sm">
            <div className="ca-modal-header">
              <div>
                <h3 className="ca-modal-title">Nueva prospección</h3>
                <p className="ca-modal-subtitle">Crea una venta para el prospecto seleccionado</p>
              </div>
              <button
                className="ca-icon-close"
                onClick={() => setMostrarModalNuevaVenta(false)}
              >
                ×
              </button>
            </div>

            <div className="ca-modal-body">
              <div className="ca-form-grid">
                <div className="ca-field ca-field-full">
                  <label className="ca-label">Objetivo de la prospección</label>
                  <input
                    className="ca-input"
                    type="text"
                    placeholder="Objetivo de la prospección"
                    value={objetivoNuevaVenta}
                    onChange={(e) => setObjetivoNuevaVenta(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="ca-modal-actions">
              <button className="ca-btn-primary" onClick={crearVentaParaProspecto}>
                Crear y usar
              </button>
              <button
                className="ca-btn-ghost"
                onClick={() => setMostrarModalNuevaVenta(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioAdmin;