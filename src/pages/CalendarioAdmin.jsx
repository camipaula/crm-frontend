import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Select from "react-select";
import "../styles/calendarioAdmin.css";

const CalendarioAdmin = () => {
  const navigate = useNavigate();

  const [eventos, setEventos] = useState([]);
  const [vendedoras, setVendedoras] = useState([]);
  const [vendedoraSeleccionada, setVendedoraSeleccionada] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [mapaColoresVendedoras, setMapaColoresVendedoras] = useState({});
  const colores = ["#1a73e8", "#34a853", "#fbbc05", "#ea4335", "#ff6d00", "#8e44ad", "#16a085"];

  useEffect(() => {
    cargarVendedoras();
    cargarAgenda();
  }, []);

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
        const vendedoraNombre = seguimiento.vendedora_seguimiento.nombre;

        if (!nuevosColores[vendedoraNombre]) {
          nuevosColores[vendedoraNombre] = colores[colorIndex % colores.length];
          colorIndex++;
        }

        return {
          id: seguimiento.id_seguimiento,
          title: seguimiento.motivo,
          start: seguimiento.fecha_programada,
          extendedProps: {
            tipo: seguimiento.tipo_seguimiento.descripcion,
            objetivo: seguimiento.venta.objetivo,
            prospecto: seguimiento.venta.prospecto.nombre,
            vendedora: vendedoraNombre,
            fecha: seguimiento.fecha_programada,
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

  return (
    <div className="calendario-container">
      <h2>📅 Agenda de Vendedoras</h2>
      <Select
        options={[{ value: "", label: "Todas las vendedoras" }, ...vendedoras]}
        placeholder="Filtrar por Vendedora"
        onChange={(vendedora) => {
          setVendedoraSeleccionada(vendedora);
          cargarAgenda(vendedora?.value || "");
        }}
        isClearable
      />
      <button className="btn-volver" onClick={() => navigate(-1)}>← Volver</button>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        locale="es"
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: "short",
        }}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        events={eventos}
        eventClick={({ event }) =>
          setModalDetalle({
            motivo: event.title,
            tipo: event.extendedProps.tipo,
            objetivo: event.extendedProps.objetivo,
            prospecto: event.extendedProps.prospecto,
            vendedora: event.extendedProps.vendedora,
            fecha: new Date(event.extendedProps.fecha).toLocaleString("es-EC"),
          })
        }
        height="auto"
      />

      {modalDetalle && (
        <div className="modal">
          <div className="modal-content">
            <h3>📌 Detalles de la Cita</h3>
            <p><b>Prospecto:</b> {modalDetalle.prospecto}</p>
            <p><b>Motivo:</b> {modalDetalle.motivo}</p>
            <p><b>Tipo:</b> {modalDetalle.tipo}</p>
            <p><b>Objetivo:</b> {modalDetalle.objetivo}</p>
            <p><b>Vendedora:</b> {modalDetalle.vendedora}</p>
            <p><b>Fecha y Hora:</b> {modalDetalle.fecha}</p>
            <button onClick={() => setModalDetalle(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioAdmin;
