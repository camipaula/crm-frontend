import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/registrarResultado.css";

const RegistrarResultado = () => {
  const { id_seguimiento } = useParams();
  const navigate = useNavigate();

  const [seguimiento, setSeguimiento] = useState(null);
  const [resultado, setResultado] = useState("");
  const [nota, setNota] = useState("");
  const [estadoProspecto, setEstadoProspecto] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [estados, setEstados] = useState([]);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [fechaSiguiente, setFechaSiguiente] = useState("");
  const [tipoSiguiente, setTipoSiguiente] = useState(null);
  const [motivoSiguiente, setMotivoSiguiente] = useState("");
  const [notaSiguiente, setNotaSiguiente] = useState("");
  const [tiposSeguimiento, setTiposSeguimiento] = useState([]);

  const [prospecto, setProspecto] = useState({});
  const [formDataExtra, setFormDataExtra] = useState({});
  const [tipoSiguienteTexto, setTipoSiguienteTexto] = useState("");
  const [duracionMinutos, setDuracionMinutos] = useState(30);

  // NUEVOS ESTADOS PARA DECLINACIÓN
  const [motivoDeclinacion, setMotivoDeclinacion] = useState("");
  const [observacionDeclinacion, setObservacionDeclinacion] = useState("");

  useEffect(() => {
    obtenerSeguimiento();
    obtenerTipos();
    obtenerEstados();
  }, []);

  const obtenerEstados = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/estados`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEstados(data);
    } catch (error) { console.error(error); }
  };

  const obtenerSeguimiento = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/${id_seguimiento}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error cargando seguimiento");
      const data = await res.json();
      setSeguimiento(data);
      if (data.venta?.prospecto) {
        setProspecto(data.venta.prospecto);
        setEstadoProspecto(data.venta.estado_venta?.id_estado || "");
      }
      setResultado(data.resultado || "");
      setNota(data.nota || "");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const obtenerTipos = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/tipos-seguimiento`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTiposSeguimiento(data.map(t => ({ value: t.id_tipo, label: t.descripcion })));
    } catch (e) { console.error(e); }
  };

  const guardarResultado = async () => {
    const estadoSeleccionado = estados.find(e => e.id_estado == estadoProspecto);
    const nombreEstado = estadoSeleccionado?.nombre;

    if (!nombreEstado) return alert("Selecciona un estado válido.");

    // AGREGAMOS "Prospección declinada" COMO ESTADO FINAL
    const estadosFinales = ["Cierre de venta", "Competencia", "Prospección declinada"];
    if (!estadosFinales.includes(nombreEstado)) {
      setMostrarModal(true);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const body = { resultado, nota, estado: nombreEstado };

      if (nombreEstado === "Cierre de venta") {
        const monto = prompt("Ingresa el monto final de cierre:");
        const montoNumerico = parseFloat(monto);
        if (!monto || isNaN(montoNumerico) || montoNumerico <= 0) return alert("Monto no válido.");
        body.monto_cierre = montoNumerico;
      } 
      // NUEVA VALIDACIÓN PARA DECLINADA
      else if (nombreEstado === "Prospección declinada") {
        if (!motivoDeclinacion || !observacionDeclinacion.trim()) {
          return alert("⚠️ El motivo y la observación son obligatorios para declinar la prospección.");
        }
        body.motivo_declinacion = motivoDeclinacion;
        body.observacion_declinacion = observacionDeclinacion;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/${id_seguimiento}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error("Error guardando resultado");
      alert("✅ Resultado guardado correctamente");
      navigate(-1);
    } catch (err) { setError(err.message); }
  };

  const agendarDesdeModal = async () => {
    if (!fechaSiguiente || !tipoSiguiente || !motivoSiguiente.trim()) return alert("Completa los campos obligatorios.");
    try {
      const token = localStorage.getItem("token");
      if (Object.keys(formDataExtra).length > 0) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/${prospecto.id_prospecto}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(formDataExtra),
        });
      }

      const resSeg = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id_venta: seguimiento.venta.id_venta,
          cedula_vendedora: seguimiento.venta.prospecto.cedula_vendedora,
          fecha_programada: fechaSiguiente,
          id_tipo: tipoSiguiente,
          motivo: motivoSiguiente,
          nota: notaSiguiente,
          duracion_minutos: duracionMinutos
        }),
      });
      const resData = await resSeg.json();
      if (!resSeg.ok) throw new Error(resData.message || "Error al agendar");

      const estadoSeleccionado = estados.find(e => e.id_estado == estadoProspecto);
      await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/${id_seguimiento}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resultado, nota, estado: estadoSeleccionado?.nombre }),
      });

      alert("✅ Resultado guardado y siguiente seguimiento agendado.");
      navigate(-1);
    } catch (err) { setError(err.message); }
  };

  if (loading) return <div className="rr-loading">Cargando datos del seguimiento...</div>;

  return (
    <div className="rr-container">
      <div className="rr-header">
        <button className="rr-btn-back" onClick={() => navigate(-1)}>⬅ Volver</button>
        <h1 className="rr-title">
          {seguimiento.estado === "pendiente" ? "Registrar Resultado" : "Editar Resultado"}
        </h1>
      </div>

      <div className="rr-grid">
        {/* Lado Izquierdo: Info de referencia */}
        <div className="rr-info-card">
          <div className="rr-info-header">📌 Detalles de la Tarea</div>
          <div className="rr-info-body">
            <div className="rr-info-item">
              <label>Prospecto</label>
              <span>{seguimiento.venta.prospecto.nombre.toUpperCase()}</span>
            </div>
            <div className="rr-info-item">
              <label>Objetivo de Venta</label>
              <span>{seguimiento.venta.objetivo.toUpperCase()}</span>
            </div>
            <div className="rr-info-item">
              <label>Tipo de Tarea</label>
              <span className="rr-tag">{seguimiento.tipo_seguimiento.descripcion.toUpperCase()}</span>
            </div>
            <div className="rr-info-item">
              <label>Fecha Programada</label>
              <span>{new Date(seguimiento.fecha_programada).toLocaleDateString()}</span>
            </div>
            <div className="rr-info-item">
              <label>Motivo Original</label>
              <p>{seguimiento.motivo.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Formulario de Acción */}
        <div className="rr-form-card">
          <div className="rr-form-group">
            <label>¿Cuál fue el resultado de la interacción? <span className="rr-req">*</span></label>
            <textarea
              className="rr-textarea"
              placeholder="Describe qué sucedió en la llamada, visita o reunión..."
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              rows="4"
            />
          </div>

          <div className="rr-form-group">
            <label>Notas adicionales (Internas)</label>
            <textarea
              className="rr-textarea"
              placeholder="Notas extras que no caben en el resultado..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows="2"
            />
          </div>

          <div className="rr-form-group">
            <label>Nuevo Estado del Prospecto <span className="rr-req">*</span></label>
            <select className="rr-select" value={estadoProspecto} onChange={(e) => setEstadoProspecto(e.target.value)}>
              <option value="">-- Seleccionar estado --</option>
              {estados
                .filter((estado) => estado.nombre.toLowerCase() !== "reabierto")
                .map((estado) => (
                  <option key={estado.id_estado} value={estado.id_estado}>
                    {estado.nombre.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
            </select>
            <p className="rr-hint">Si el estado no es final (Vendido/Perdido), se te pedirá agendar la siguiente acción.</p>
          </div>

          {/* ----- NUEVO BLOQUE CONDICIONAL PARA DECLINACIÓN ----- */}
          {estados.find(e => e.id_estado == estadoProspecto)?.nombre === "Prospección declinada" && (
            <div className="rr-form-group" style={{ backgroundColor: '#fff5f5', padding: '15px', borderRadius: '8px', border: '1px solid #feb2b2', marginBottom: '15px' }}>
              
              <label style={{ color: '#c53030', fontWeight: 'bold' }}>Motivo de declinación <span className="rr-req">*</span></label>
              <select 
                className="rr-select" 
                value={motivoDeclinacion} 
                onChange={(e) => setMotivoDeclinacion(e.target.value)}
                style={{ marginBottom: '15px', borderColor: '#feb2b2' }}
              >
                <option value="">-- Seleccionar motivo --</option>
                <option value="Precio alto">Precio alto</option>
                <option value="Licitación no ganada">Licitación no ganada</option>
                <option value="Sin decisión (lead frio)">Sin decisión (lead frío)</option>
                <option value="Lead no calificado">Lead no calificado</option>
              </select>

              <label style={{ color: '#c53030', fontWeight: 'bold' }}>Observación obligatoria <span className="rr-req">*</span></label>
              <textarea
                className="rr-textarea"
                placeholder="Detalla un poco más por qué se perdió este lead..."
                value={observacionDeclinacion}
                onChange={(e) => setObservacionDeclinacion(e.target.value)}
                rows="3"
                style={{ borderColor: '#feb2b2' }}
              />
            </div>
          )}

<button className="rr-btn-save" onClick={guardarResultado}>
            {seguimiento.estado === "pendiente" ? "💾 Guardar y Continuar" : "💾 Actualizar Registro"}
          </button>
        </div>
      </div>

      {/* Modal Agendar Siguiente */}
      {mostrarModal && (
        <div className="rr-modal-overlay">
          <div className="rr-modal-content">
            <div className="rr-modal-header">
              <h3>📅 Agendar Siguiente Seguimiento</h3>
              <p>Como la prospección sigue abierta, define cuándo volverás a contactar.</p>
            </div>

            {error && <p className="rr-alert-error">{error}</p>}

            <div className="rr-modal-grid">
              <div className="rr-form-group">
                <label>Fecha y Hora <span className="rr-req">*</span></label>
                <input type="datetime-local" className="rr-input" value={fechaSiguiente} onChange={(e) => setFechaSiguiente(e.target.value)} />
              </div>

              <div className="rr-form-group">
                <label>Tipo de Acción <span className="rr-req">*</span></label>
                <select className="rr-select" value={tipoSiguiente || ""} onChange={(e) => {
                  const id = parseInt(e.target.value);
                  setTipoSiguiente(id);
                  const text = tiposSeguimiento.find(t => t.value === id)?.label.toLowerCase();
                  setTipoSiguienteTexto(text);
                }}>
                  <option value="">Seleccionar...</option>
                  {tiposSeguimiento.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="rr-form-group">
                <label>Duración estimada</label>
                <select className="rr-select" value={duracionMinutos} onChange={(e) => setDuracionMinutos(Number(e.target.value))}>
                  {[5, 15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} minutos</option>)}
                </select>
              </div>

              <div className="rr-form-group rr-full-width">
                <label>Motivo de la siguiente acción <span className="rr-req">*</span></label>
                <input type="text" className="rr-input" placeholder="Ej: Enviar propuesta final" value={motivoSiguiente} onChange={(e) => setMotivoSiguiente(e.target.value)} />
              </div>

              <div className="rr-form-group rr-full-width">
                <label>Nota / Instrucción</label>
                <textarea className="rr-textarea" placeholder="Detalles para tu futuro 'yo'..." value={notaSiguiente} onChange={(e) => setNotaSiguiente(e.target.value)} rows="2" />
              </div>

              {/* Campos dinámicos de contacto */}
              {tipoSiguienteTexto === "email" && !prospecto.correo && (
                <div className="rr-form-group rr-full-width rr-contact-needed">
                  <label>📧 Correo del Prospecto (Falta)</label>
                  <input type="email" className="rr-input" value={formDataExtra.correo || ""} onChange={e => setFormDataExtra({ ...formDataExtra, correo: e.target.value })} />
                </div>
              )}
              {["llamada", "whatsapp"].includes(tipoSiguienteTexto) && !prospecto.telefono && (
                <div className="rr-form-group rr-full-width rr-contact-needed">
                  <label>📱 Teléfono del Prospecto (Falta)</label>
                  <input type="text" className="rr-input" value={formDataExtra.telefono || ""} onChange={e => setFormDataExtra({ ...formDataExtra, telefono: e.target.value })} />
                </div>
              )}
              {tipoSiguienteTexto === "visita" && !prospecto.direccion && (
                <div className="rr-form-group rr-full-width rr-contact-needed">
                  <label>📍 Dirección del Prospecto (Falta)</label>
                  <input type="text" className="rr-input" value={formDataExtra.direccion || ""} onChange={e => setFormDataExtra({ ...formDataExtra, direccion: e.target.value })} />
                </div>
              )}
            </div>

            <div className="rr-modal-actions">
              <button className="rr-btn-ghost" onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button className="rr-btn-primary" onClick={agendarDesdeModal}>Finalizar y Agendar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarResultado;