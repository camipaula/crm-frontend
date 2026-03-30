import { useState, useEffect } from "react";
import { obtenerCedulaDesdeToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Select from "react-select";
import "../styles/calendarioVendedora.css";

const CalendarioVendedora = () => {
  const navigate = useNavigate();
  const cedula = obtenerCedulaDesdeToken();

  const [eventos, setEventos] = useState([]);
  const [prospectos, setProspectos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [tiposSeguimiento, setTiposSeguimiento] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState(null);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [fechaSeguimiento, setFechaSeguimiento] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [mapaColoresProspectos, setMapaColoresProspectos] = useState({});
  const [modoEdicion, setModoEdicion] = useState(false);

  const [mostrarModalNuevoProspecto, setMostrarModalNuevoProspecto] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEstado] = useState("Captación/ensayo");
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");

  const [mostrarModalNuevaVenta, setMostrarModalNuevaVenta] = useState(false);
  const [objetivoNuevaVenta, setObjetivoNuevaVenta] = useState("");

  const colores = ["#6c5ff0", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

  useEffect(() => {
    cargarAgenda();
    cargarProspectos();
    cargarTiposSeguimiento();
  }, []);

  const formatearParaDatetimeLocal = (fechaStr) => {
    const fecha = new Date(
      typeof fechaStr === "string" ? fechaStr.replace("Z", "") : fechaStr
    );
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

  const cargarAgenda = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/seguimientos/agenda/${cedula}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      const nuevosColores = { ...mapaColoresProspectos };
      let colorIndex = Object.keys(nuevosColores).length;

      const eventosConvertidos = data.map((seguimiento) => {
        const prospectoNombre = seguimiento.venta.prospecto.nombre;

        if (!nuevosColores[prospectoNombre]) {
          nuevosColores[prospectoNombre] = colores[colorIndex % colores.length];
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
            prospecto: prospectoNombre,
            fecha: seguimiento.fecha_programada,
            duracion_minutos: seguimiento.duracion_minutos || 30,
          },
          color: nuevosColores[prospectoNombre],
          textColor: "#fff",
        };
      });

      setMapaColoresProspectos(nuevosColores);
      setEventos(eventosConvertidos);
    } catch (err) {
      console.error("Error al cargar la agenda:", err);
    }
  };

  const cargarProspectos = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prospectos/vendedora/${cedula}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setProspectos(data.map((p) => ({ value: p.id_prospecto, label: p.nombre })));
    } catch (err) {
      console.error("Error cargando prospectos:", err);
    }
  };

  const cargarVentas = async (id_prospecto) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ventas/prospecto/${id_prospecto}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      const ventasMapeadas = data.map((v) => ({ value: v.id_venta, label: v.objetivo }));
      setVentas(ventasMapeadas);

      if (ventasMapeadas.length === 0) {
        setMostrarModalNuevaVenta(true);
      }

      return ventasMapeadas;
    } catch (err) {
      console.error("Error cargando ventas:", err);
      return [];
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
      const nuevaVenta = { value: venta.id_venta, label: venta.objetivo };
      setVentas([nuevaVenta]);
      setVentaSeleccionada(nuevaVenta);
      setMostrarModalNuevaVenta(false);
      setObjetivoNuevaVenta("");
    } catch (err) {
      console.error("Error creando venta:", err);
    }
  };

  const cargarTiposSeguimiento = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/seguimientos/tipos-seguimiento`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setTiposSeguimiento(data.map((t) => ({ value: t.id_tipo, label: t.descripcion })));
    } catch (err) {
      console.error("Error cargando tipos de seguimiento:", err);
    }
  };

  const crearProspectoYVenta = async () => {
    if (!nuevoObjetivo.trim()) {
      alert("Por favor, ingresa un objetivo para la prospección.");
      return;
    }
    if (!nuevoNombre.trim()) {
      alert("Por favor, ingresa un nombre de prospecto.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nuevoNombre,
          estado: nuevoEstado,
          cedula_vendedora: cedula,
          objetivo: nuevoObjetivo,
        }),
      });

      const { prospecto, venta } = await res.json();

      await cargarProspectos();
      setProspectoSeleccionado({ value: prospecto.id_prospecto, label: prospecto.nombre });
      setVentaSeleccionada({ value: venta.id_venta, label: venta.objetivo });
      setMostrarModalNuevoProspecto(false);
      setNuevoNombre("");
      setNuevoObjetivo("");
    } catch (err) {
      console.error("Error al crear prospecto y venta:", err);
    }
  };

  const agendarSeguimiento = async () => {
    if (!ventaSeleccionada || !tipoSeleccionado) {
      setError("Selecciona venta y tipo de seguimiento");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_venta: ventaSeleccionada.value,
          cedula_vendedora: cedula,
          fecha_programada: fechaSeguimiento,
          id_tipo: tipoSeleccionado.value,
          motivo,
          nota: "",
        }),
      });

      if (!res.ok) throw new Error("Error al agendar seguimiento");

      alert("Seguimiento agendado exitosamente");
      setMostrarModal(false);
      setProspectoSeleccionado(null);
      setVentaSeleccionada(null);
      setTipoSeleccionado(null);
      setFechaSeguimiento("");
      setMotivo("");
      setVentas([]);
      cargarAgenda();
    } catch (err) {
      console.error("Error al agendar:", err);
      setError(err.message);
    }
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
    <div className="cvd-container">
      <div className="cvd-header">
        <div className="cvd-header-left">
          <div className="cvd-header-text">
            <h1 className="cvd-title">Mi Agenda</h1>
            <p className="cvd-subtitle">
              Organiza y visualiza tus seguimientos comerciales
            </p>
          </div>
        </div>

        <div className="cvd-header-actions">
          <button className="cvd-btn-ghost" onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <button className="cvd-btn-primary" onClick={() => setMostrarModal(true)}>
            + Agendar cita
          </button>
        </div>
      </div>

      {Object.keys(mapaColoresProspectos).length > 0 && (
        <div className="cvd-legend-card">
          <div className="cvd-legend-title">Prospectos</div>
          <div className="cvd-legend-list">
            {Object.entries(mapaColoresProspectos).map(([nombre, color]) => (
              <div key={nombre} className="cvd-legend-item">
                <span className="cvd-legend-dot" style={{ backgroundColor: color }} />
                <span>{nombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="cvd-card">
        <div className="cvd-calendar-wrap">
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
            events={eventos}
            height="auto"
            eventClick={({ event }) => {
              setModoEdicion(false);
              setModalDetalle({
                id: event.id,
                motivo: event.title,
                tipo: event.extendedProps.tipo,
                objetivo: event.extendedProps.objetivo,
                prospecto: event.extendedProps.prospecto,
                fecha: event.extendedProps.fecha,
                duracion_minutos: event.extendedProps.duracion_minutos || 30,
              });
            }}
            dateClick={({ date, view }) => {
              const isSoloFecha = view.type === "dayGridMonth";
              const fecha = isSoloFecha
                ? `${date.toISOString().slice(0, 10)}T09:00`
                : formatearParaDatetimeLocal(date);

              setFechaSeguimiento(fecha);
              setMostrarModal(true);
            }}
            eventContent={({ event, view }) => {
              const prospecto = event.extendedProps.prospecto || "";
              const tipo = event.extendedProps.tipo || "";
              const duracion = event.extendedProps.duracion_minutos || 30;

              if (view.type === "dayGridMonth") {
                return (
                  <div className="cvd-event cvd-event-month" title={`${prospecto} - ${tipo} (${duracion} min)`}>
                    <span className="cvd-event-title">{prospecto}</span>
                    <span className="cvd-event-meta">{tipo}</span>
                  </div>
                );
              }

              return (
                <div className="cvd-event">
                  <span className="cvd-event-title">{prospecto}</span>
                  <span className="cvd-event-meta">
                    {tipo} ({duracion} min)
                  </span>
                </div>
              );
            }}
          />
        </div>
      </div>

      {mostrarModal && (
        <div className="cvd-modal-overlay">
          <div className="cvd-modal">
            <div className="cvd-modal-header">
              <div>
                <h3 className="cvd-modal-title">Agendar nueva cita</h3>
                <p className="cvd-modal-subtitle">Programa un nuevo seguimiento</p>
              </div>
              <button className="cvd-icon-close" onClick={() => setMostrarModal(false)}>
                ×
              </button>
            </div>

            <div className="cvd-modal-body">
              {error && <div className="cvd-alert-error">{error}</div>}

              <div className="cvd-form-grid">
                <div className="cvd-field cvd-field-full">
                  <label className="cvd-label">Prospecto</label>
                  <Select
                    options={[...prospectos, { value: "nuevo", label: "➕ Crear nuevo prospecto" }]}
                    placeholder="Seleccionar prospecto"
                    value={prospectoSeleccionado}
                    onChange={async (prospecto) => {
                      if (prospecto.value === "nuevo") return setMostrarModalNuevoProspecto(true);
                      setProspectoSeleccionado(prospecto);
                      const ventasCargadas = await cargarVentas(prospecto.value);
                      if (ventasCargadas.length === 0) {
                        setMostrarModalNuevaVenta(true);
                      }
                    }}
                    styles={rsStyles}
                  />
                </div>

                <div className="cvd-field cvd-field-full">
                  <label className="cvd-label">Venta</label>
                  <Select
                    options={ventas}
                    placeholder="Seleccionar venta"
                    value={ventaSeleccionada}
                    onChange={setVentaSeleccionada}
                    isDisabled={!ventas.length}
                    styles={rsStyles}
                  />
                </div>

                <div className="cvd-field cvd-field-full">
                  <label className="cvd-label">Tipo de seguimiento</label>
                  <Select
                    options={tiposSeguimiento}
                    placeholder="Seleccionar tipo de seguimiento"
                    value={tipoSeleccionado}
                    onChange={setTipoSeleccionado}
                    styles={rsStyles}
                  />
                </div>

                <div className="cvd-field">
                  <label className="cvd-label">Fecha y hora</label>
                  <input
                    className="cvd-input"
                    type="datetime-local"
                    value={fechaSeguimiento}
                    onChange={(e) => setFechaSeguimiento(e.target.value)}
                  />
                </div>

                <div className="cvd-field">
                  <label className="cvd-label">Motivo</label>
                  <input
                    className="cvd-input"
                    type="text"
                    placeholder="Motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="cvd-modal-actions">
              <button className="cvd-btn-primary" onClick={agendarSeguimiento}>
                Agendar
              </button>
              <button className="cvd-btn-ghost" onClick={() => setMostrarModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalNuevoProspecto && (
        <div className="cvd-modal-overlay">
          <div className="cvd-modal cvd-modal-sm">
            <div className="cvd-modal-header">
              <div>
                <h3 className="cvd-modal-title">Nuevo prospecto</h3>
                <p className="cvd-modal-subtitle">Crea un prospecto rápido</p>
              </div>
              <button
                className="cvd-icon-close"
                onClick={() => setMostrarModalNuevoProspecto(false)}
              >
                ×
              </button>
            </div>

            <div className="cvd-modal-body">
              <div className="cvd-form-grid">
                <div className="cvd-field cvd-field-full">
                  <label className="cvd-label">Nombre del prospecto</label>
                  <input
                    className="cvd-input"
                    type="text"
                    placeholder="Nombre del Prospecto"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                  />
                </div>

                <div className="cvd-field cvd-field-full">
                  <label className="cvd-label">Estado</label>
                  <div className="cvd-static-value">Captación/ensayo</div>
                </div>

                <div className="cvd-field cvd-field-full">
                  <label className="cvd-label">Objetivo de la prospección</label>
                  <input
                    className="cvd-input"
                    type="text"
                    placeholder="Objetivo de la Prospección"
                    value={nuevoObjetivo}
                    onChange={(e) => setNuevoObjetivo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="cvd-modal-actions">
              <button className="cvd-btn-primary" onClick={crearProspectoYVenta}>
                Crear y usar
              </button>
              <button
                className="cvd-btn-ghost"
                onClick={() => setMostrarModalNuevoProspecto(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalNuevaVenta && (
        <div className="cvd-modal-overlay">
          <div className="cvd-modal cvd-modal-sm">
            <div className="cvd-modal-header">
              <div>
                <h3 className="cvd-modal-title">Nueva prospección</h3>
                <p className="cvd-modal-subtitle">Crea una venta para el prospecto</p>
              </div>
              <button
                className="cvd-icon-close"
                onClick={() => setMostrarModalNuevaVenta(false)}
              >
                ×
              </button>
            </div>

            <div className="cvd-modal-body">
              <div className="cvd-form-grid">
                <div className="cvd-field cvd-field-full">
                  <label className="cvd-label">Objetivo de la prospección</label>
                  <input
                    className="cvd-input"
                    type="text"
                    placeholder="Objetivo de la prospección"
                    value={objetivoNuevaVenta}
                    onChange={(e) => setObjetivoNuevaVenta(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="cvd-modal-actions">
              <button className="cvd-btn-primary" onClick={crearVentaParaProspecto}>
                Crear y usar
              </button>
              <button
                className="cvd-btn-ghost"
                onClick={() => setMostrarModalNuevaVenta(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalDetalle && (
        <div className="cvd-modal-overlay">
          <div className="cvd-modal">
            <div className="cvd-modal-header">
              <div>
                <h3 className="cvd-modal-title">Detalle de la cita</h3>
                <p className="cvd-modal-subtitle">Información del seguimiento agendado</p>
              </div>
              <button
                className="cvd-icon-close"
                onClick={() => {
                  setModalDetalle(null);
                  setModoEdicion(false);
                }}
              >
                ×
              </button>
            </div>

            <div className="cvd-modal-body">
              <div className="cvd-detail-grid">
                <div className="cvd-detail-item">
                  <span className="cvd-detail-label">Prospecto</span>
                  <span className="cvd-detail-value">{modalDetalle.prospecto}</span>
                </div>

                <div className="cvd-detail-item">
                  <span className="cvd-detail-label">Objetivo</span>
                  <span className="cvd-detail-value">{modalDetalle.objetivo}</span>
                </div>

                <div className="cvd-detail-item">
                  <span className="cvd-detail-label">Duración</span>
                  <span className="cvd-detail-value">
                    {modalDetalle.duracion_minutos || 30} minutos
                  </span>
                </div>

                <div className="cvd-detail-item">
                  <span className="cvd-detail-label">Tipo</span>
                  <span className="cvd-detail-value">{modalDetalle.tipo}</span>
                </div>

                <div className="cvd-detail-item">
                  <span className="cvd-detail-label">Fecha y hora</span>
                  <span className="cvd-detail-value">
                    {formatearFechaVisual(modalDetalle.fecha)}
                  </span>
                </div>

                <div className="cvd-detail-item cvd-detail-item-full">
                  <span className="cvd-detail-label">Motivo</span>
                  <span className="cvd-detail-value">{modalDetalle.motivo}</span>
                </div>
              </div>

              <div className="cvd-info-box">
                ⚠️ Solo la administradora puede editar o eliminar una cita. Solicítalo directamente.
              </div>
            </div>

            <div className="cvd-modal-actions">
              <button
                onClick={() => navigate(`/registrar-resultado/${modalDetalle.id}`)}
                className="cvd-btn-primary"
              >
                Registrar resultado
              </button>

              <button
                className="cvd-btn-disabled"
                disabled
              >
                Editar
              </button>

              <button
                className="cvd-btn-disabled"
                disabled
              >
                Eliminar
              </button>

              <button
                className="cvd-btn-ghost"
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
    </div>
  );
};

export default CalendarioVendedora;
