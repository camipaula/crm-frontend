// CalendarioAdmin.jsx
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
  const [nuevoEstado, setNuevoEstado] = useState("interesado");
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);


  const colores = ["#1a73e8", "#34a853", "#fbbc05", "#ea4335", "#ff6d00", "#8e44ad", "#16a085"];

  useEffect(() => {
    cargarVendedoras();
    cargarAgenda();
    cargarTiposSeguimiento();
  }, []);

  const formatearFechaLocal = (fecha) => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    const hours = String(fecha.getHours()).padStart(2, "0");
    const minutes = String(fecha.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos?vendedora=${cedula_vendedora}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProspectos(data.map((p) => ({ value: p.id_prospecto, label: p.nombre })));
    } catch (err) {
      console.error("Error cargando prospectos:", err);
    }
  };

  const crearProspectoYVenta = async () => {
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
          cedula_vendedora: vendedoraNueva?.value,
        }),
      });
      const { prospecto } = await res1.json();

      const res2 = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_prospecto: prospecto.id_prospecto,
          objetivo: nuevoObjetivo,
        }),
      });
      const { venta } = await res2.json();

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

  const agendarSeguimiento = async () => {
    if (!vendedoraNueva || !ventaSeleccionada || !tipoSeleccionado) {
      setError("Faltan campos requeridos");
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
      cargarAgenda();
      limpiarCampos();
    } catch (err) {
      console.error("Error al agendar:", err);
      setError(err.message);
    }
  };
  const editarSeguimientoDesdeModal = async (detalle) => {
    try {
      const token = localStorage.getItem("token");

      const tipo = detalle.tipoSeleccionado || tiposSeguimiento.find(t => t.label === detalle.tipo);
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
      cargarAgenda();
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
      cargarAgenda();
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
    setMotivo("");
    setError("");
    setFechaSeleccionada("");
  };

  return (
    <div className="calendario-container">
      <h2>📅 Agenda de Vendedoras</h2>
      {vendedoraSeleccionada && (
        <p className="info">
          Agenda de: <strong>{vendedoraSeleccionada.label}</strong>
        </p>
      )}

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
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
        locale="es"
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", meridiem: "short" }}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
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
            vendedora: event.extendedProps.vendedora,
            fecha: event.extendedProps.fecha,
          });
        }}


        dateClick={({ date, view }) => {
          const isSoloFecha = view.type === "dayGridMonth";
          const fecha = isSoloFecha ? `${date.toISOString().slice(0, 10)}T09:00` : formatearFechaLocal(date);
          setFechaSeleccionada(fecha);
          setMostrarModalNuevo(true);
        }}
      />

      {modalDetalle && (
        <div className="modal">
          <div className="modal-content">
            <h3>📌 Detalles de la Cita</h3>
            <p><b>Prospecto:</b> {modalDetalle.prospecto}</p>
            <p><b>Vendedora:</b> {modalDetalle.vendedora}</p>
            <p><b>Objetivo:</b> {modalDetalle.objetivo}</p>

            {modoEdicion ? (
              <>
                <label><b>Tipo:</b></label>
                <Select
                  options={tiposSeguimiento}
                  defaultValue={tiposSeguimiento.find(t => t.label === modalDetalle.tipo)}
                  onChange={(opcion) =>
                    setModalDetalle({ ...modalDetalle, tipoSeleccionado: opcion })
                  }
                />

                <label><b>Fecha y Hora:</b></label>
                <input
                  type="datetime-local"
                  value={formatearFechaLocal(new Date(modalDetalle.fecha))}
                  onChange={(e) =>
                    setModalDetalle({ ...modalDetalle, fecha: e.target.value })
                  }
                />

                <label><b>Motivo:</b></label>
                <input
                  type="text"
                  value={modalDetalle.motivo}
                  onChange={(e) =>
                    setModalDetalle({ ...modalDetalle, motivo: e.target.value })
                  }
                />
              </>
            ) : (
              <>
                <p><b>Tipo:</b> {modalDetalle.tipo}</p>
                <p><b>Fecha y Hora:</b> {
  new Date(modalDetalle.fecha).toLocaleString("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  })
}</p>
                <p><b>Motivo:</b> {modalDetalle.motivo}</p>
              </>
            )}

            <div className="modal-actions">
              {modoEdicion ? (
                <>
                  <button onClick={() => editarSeguimientoDesdeModal(modalDetalle)}>💾 Guardar</button>
                  <button onClick={() => setModoEdicion(false)}>Cancelar</button>
                </>
              ) : (
                <button onClick={() => setModoEdicion(true)}>✏️ Editar</button>
              )}
              <button onClick={() => eliminarSeguimientoDesdeModal(modalDetalle.id)}>🗑️ Eliminar</button>
              <button onClick={() => { setModalDetalle(null); setModoEdicion(false); }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}


      {mostrarModalNuevo && (
        <div className="modal">
          <div className="modal-content">
            <h3>➕ Agendar Cita</h3>
            {error && <p className="error">{error}</p>}
            <p><b>Fecha:</b></p>
            <input type="datetime-local" value={fechaSeleccionada} onChange={(e) => setFechaSeleccionada(e.target.value)} />
            <Select options={vendedoras} placeholder="Seleccionar Vendedora" onChange={(vendedora) => {
              setVendedoraNueva(vendedora);
              cargarProspectos(vendedora.value);
            }} />
            <Select
              options={[...prospectos, { value: "nuevo", label: "➕ Crear nuevo prospecto" }]}
              placeholder="Seleccionar Prospecto"
              onChange={async (prospecto) => {
                if (prospecto.value === "nuevo") {
                  return setMostrarModalNuevoProspecto(true);
                }

                setProspectoSeleccionado(prospecto);

                const ventasCargadas = await cargarVentas(prospecto.value);

                if (ventasCargadas.length === 0) {
                  setMostrarModalNuevaVenta(true);
                }
              }}

              isDisabled={!vendedoraNueva}
            />
            <Select options={ventas} placeholder="Seleccionar Venta" onChange={setVentaSeleccionada} isDisabled={!prospectoSeleccionado} />
            <Select options={tiposSeguimiento} placeholder="Tipo de Seguimiento" onChange={setTipoSeleccionado} />
            <input type="text" placeholder="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            <button onClick={agendarSeguimiento}>Agendar</button>
            <button onClick={() => setMostrarModalNuevo(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {mostrarModalNuevoProspecto && (
        <div className="modal modal-small">
          <div className="modal-content">
            <h3>➕ Nuevo Prospecto</h3>
            <input type="text" placeholder="Nombre del Prospecto" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
            <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
            <option value="nuevo">Nuevo</option>
              <option value="contactar">Contactar</option>
              <option value="interesado">Interesado</option>
              <option value="cita">Cita</option>
              <option value="visita">Visita</option>
              <option value="en_prueba">En Prueba</option>

            </select>
            <input type="text" placeholder="Objetivo de la Prospección" value={nuevoObjetivo} onChange={(e) => setNuevoObjetivo(e.target.value)} />
            <button onClick={crearProspectoYVenta}>Crear y Usar</button>
            <button onClick={() => setMostrarModalNuevoProspecto(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {mostrarModalNuevaVenta && (
        <div className="modal modal-small">
          <div className="modal-content">
            <h3>➕ Nueva Prospección</h3>
            <input
              type="text"
              placeholder="Objetivo de la prospección"
              value={objetivoNuevaVenta}
              onChange={(e) => setObjetivoNuevaVenta(e.target.value)}
            />
            <button onClick={crearVentaParaProspecto}>Crear y Usar</button>
            <button onClick={() => setMostrarModalNuevaVenta(false)}>Cancelar</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CalendarioAdmin;
