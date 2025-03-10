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

  const colores = ["#1a73e8", "#34a853", "#fbbc05", "#ea4335", "#ff6d00", "#8e44ad", "#16a085"];

  useEffect(() => {
    cargarAgenda();
    cargarProspectos();
    cargarTiposSeguimiento();
  }, []);

  const cargarAgenda = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/agenda/${cedula}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
          start: seguimiento.fecha_programada,
          extendedProps: {
            tipo: seguimiento.tipo_seguimiento.descripcion,
            objetivo: seguimiento.venta.objetivo,
            prospecto: prospectoNombre,
            fecha: seguimiento.fecha_programada,
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos?vendedora=${cedula}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProspectos(data.map((p) => ({ value: p.id_prospecto, label: p.nombre })));
    } catch (err) {
      console.error("Error cargando prospectos:", err);
    }
  };

  const cargarVentas = async (id_prospecto) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/prospecto/${id_prospecto}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setVentas(data.map((v) => ({ value: v.id_venta, label: v.objetivo })));
    } catch (err) {
      console.error("Error cargando ventas:", err);
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
      cargarAgenda();
    } catch (err) {
      console.error("Error al agendar:", err);
      setError(err.message);
    }
  };

  return (
    <div className="calendario-container">
      <h2>📅 Mi Agenda</h2>
      <button className="btn-volver" onClick={() => navigate(-1)}>← Volver</button>
      <button className="btn-agendar" onClick={() => setMostrarModal(true)}>➕ Agendar Cita</button>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        locale="es"
        events={eventos}
        eventClick={({ event }) =>
          setModalDetalle({
            motivo: event.title,
            tipo: event.extendedProps.tipo,
            objetivo: event.extendedProps.objetivo,
            prospecto: event.extendedProps.prospecto,
            fecha: new Date(event.extendedProps.fecha).toLocaleString("es-EC"),
          })
        }
        height="auto"
      />

      {mostrarModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>➕ Nueva Cita</h3>
            {error && <p className="error">{error}</p>}
            <Select
              options={prospectos}
              placeholder="Seleccionar Prospecto"
              onChange={(prospecto) => {
                setProspectoSeleccionado(prospecto);
                cargarVentas(prospecto.value);
              }}
            />
            <Select
              options={ventas}
              placeholder="Seleccionar Venta"
              onChange={setVentaSeleccionada}
              isDisabled={!ventas.length}
            />
            <Select
              options={tiposSeguimiento}
              placeholder="Seleccionar Tipo de Seguimiento"
              onChange={setTipoSeleccionado}
            />
            <input
              type="datetime-local"
              value={fechaSeguimiento}
              onChange={(e) => setFechaSeguimiento(e.target.value)}
            />
            <input
              type="text"
              placeholder="Motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <button onClick={agendarSeguimiento}>Agendar</button>
            <button onClick={() => setMostrarModal(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {modalDetalle && (
        <div className="modal">
          <div className="modal-content">
            <h3>📌 Detalles de la Cita</h3>
            <p><b>Prospecto:</b> {modalDetalle.prospecto}</p>
            <p><b>Motivo:</b> {modalDetalle.motivo}</p>
            <p><b>Tipo:</b> {modalDetalle.tipo}</p>
            <p><b>Objetivo:</b> {modalDetalle.objetivo}</p>
            <p><b>Fecha y Hora:</b> {modalDetalle.fecha}</p>
            <button onClick={() => setModalDetalle(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioVendedora;
