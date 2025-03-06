import { useState, useEffect } from "react";
import { obtenerCedulaDesdeToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../styles/calendarioVendedora.css";

const CalendarioVendedora = () => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    cargarAgenda();
  }, []);

  const cargarAgenda = async () => {
    try {
      const token = localStorage.getItem("token");
      const cedula = obtenerCedulaDesdeToken();

      const res = await fetch(`http://localhost:5000/api/contactos/agenda?vendedora=${cedula}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al obtener la agenda");

      const data = await res.json();
      const eventosConvertidos = data.map((contacto) => ({
        id: contacto.id_contacto,
        title: `${contacto.tipo} - ${contacto.motivo}`,
        start: contacto.fecha_programada,
        end: contacto.fecha_programada,
        extendedProps: {
          prospecto: contacto.nombre_prospecto,
          hora: new Date(contacto.fecha_programada).toLocaleTimeString(),
          tipo: contacto.tipo,
          motivo: contacto.motivo,
        },
      }));

      setEventos(eventosConvertidos);
    } catch (err) {
      console.error("Error al cargar la agenda:", err);
    }
  };

  return (
    <div className="calendario-container">
      <h2>📅 Mi Agenda</h2>
      <button className="btn-volver" onClick={() => navigate(-1)}>← Volver</button>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={eventos}
        eventClick={(info) => {
          alert(`Prospecto: ${info.event.extendedProps.prospecto}\n Hora: ${info.event.extendedProps.hora}\n Tipo: ${info.event.extendedProps.tipo}\n Motivo: ${info.event.extendedProps.motivo}`);
        }}
        locale="es"
      />
    </div>
  );
};

export default CalendarioVendedora;
