import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getRol } from "../utils/auth";
import React from "react";

// Asegúrate de que el nombre del archivo CSS sea exactamente este
import "../styles/seguimientosProspecto.css";

const SeguimientosProspecto = () => {
  const { id_prospecto } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const historialSectionRef = useRef(null);

  const [prospecciones, setProspecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  // Modales
  const [modalEditar, setModalEditar] = useState(false);
  const [idVentaSeleccionada, setIdVentaSeleccionada] = useState(null);
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");
  const [nuevoMontoProyectado, setNuevoMontoProyectado] = useState("");

  const [modalReabrir, setModalReabrir] = useState(false);
  const [notaReapertura, setNotaReapertura] = useState("");
  const [fechaReapertura, setFechaReapertura] = useState("");

  // Modal Nueva Prospección
  const [mostrarModalAbrirVenta, setMostrarModalAbrirVenta] = useState(false);
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [nuevoIdCategoriaVenta, setNuevoIdCategoriaVenta] = useState(null);
  const [categoriasVenta, setCategoriasVenta] = useState([]);
  const [errorCrearVenta, setErrorCrearVenta] = useState("");

  // Historial
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");
  const [nuevaNota, setNuevaNota] = useState("");
  const [enviandoNota, setEnviandoNota] = useState(false);

  const rol = getRol();
  const esSoloLectura = rol === "lectura";

  useEffect(() => {
    buscarSeguimientos();
  }, [filtroEstado]);

  const fetchHistorial = async () => {
    if (!id_prospecto) return;
    setLoadingHistorial(true);
    setErrorHistorial("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prospectos/${id_prospecto}/historial`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Error al cargar historial");
      const data = await res.json();
      setHistorial(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorHistorial(err.message);
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [id_prospecto]);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
    const token = localStorage.getItem("token");
    fetch(`${baseUrl}/api/categorias-venta`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((raw) => {
        const list = Array.isArray(raw)
          ? raw
          : raw && Array.isArray(raw.data)
            ? raw.data
            : raw && Array.isArray(raw.categorias)
              ? raw.categorias
              : [];
        const normalizadas = list.map((c) => ({
          id_categoria_venta: c.id_categoria_venta ?? c.id,
          nombre: c.nombre ?? c.name ?? String(c.id_categoria_venta ?? c.id ?? ""),
        }));
        setCategoriasVenta(normalizadas);
      })
      .catch(() => setCategoriasVenta([]));
  }, []);

  useEffect(() => {
    if (location.hash === "#historial" && historialSectionRef.current) {
      const t = setTimeout(() => {
        historialSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
      return () => clearTimeout(t);
    }
  }, [id_prospecto, location.hash]);

  const handleAgregarNota = async (e) => {
    e.preventDefault();
    const texto = nuevaNota.trim();
    if (!texto || enviandoNota) return;
    setEnviandoNota(true);
    setErrorHistorial("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prospectos/${id_prospecto}/historial`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mensaje: texto }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Error al agregar nota");
      setNuevaNota("");
      fetchHistorial();
    } catch (err) {
      setErrorHistorial(err.message);
    } finally {
      setEnviandoNota(false);
    }
  };

  const formatearFechaHistorial = (fechaStr) => {
    if (!fechaStr) return "";
    try {
      return new Date(fechaStr).toLocaleString("es-ES", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return fechaStr; }
  };

  const formatearMonto = (monto) => {
    return monto != null
      ? `$${parseFloat(monto).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "No definido";
  };

  const abrirModalReabrir = (id_venta) => {
    setIdVentaSeleccionada(id_venta);
    setNotaReapertura("");
    const hoy = new Date();
    hoy.setHours(8, 0, 0, 0);
    const isoFecha = hoy.toISOString().slice(0, 16);
    setFechaReapertura(isoFecha);
    setModalReabrir(true);
  };

  const buscarSeguimientos = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      let url = `${import.meta.env.VITE_API_URL}/api/ventas/prospecto/${id_prospecto}`;
      if (filtroEstado !== "todas") url += `?estado_prospeccion=${filtroEstado}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (res.status === 404) {
        navigate(-1);
        return;
      }

      if (!res.ok) throw new Error("Error obteniendo seguimientos del prospecto");

      const data = await res.json();
      setProspecciones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalEditar = (id_venta, objetivoActual, montoProyectadoActual) => {
    setIdVentaSeleccionada(id_venta);
    setNuevoObjetivo(objetivoActual);
    setNuevoMontoProyectado(montoProyectadoActual ?? "");
    setModalEditar(true);
  };

  const formatearFechaVisual = (fechaStr) => {
    const fecha = new Date(fechaStr.replace("Z", ""));
    return fecha.toLocaleString("es-EC", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const guardarObjetivo = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${idVentaSeleccionada}/objetivo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          objetivo: nuevoObjetivo,
          monto_proyectado: parseFloat(nuevoMontoProyectado)
        }),
      });

      if (!res.ok) throw new Error("Error actualizando objetivo y monto");
      setModalEditar(false);
      buscarSeguimientos();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const confirmarReapertura = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${idVentaSeleccionada}/reabrir`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nota: notaReapertura, fecha_programada: fechaReapertura }),
      });

      if (!res.ok) throw new Error("No se pudo reabrir la venta");
      setModalReabrir(false);
      buscarSeguimientos();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const eliminarProspeccion = async (id_venta) => {
    const confirmacion = window.confirm("¿Estás segura de que deseas eliminar esta prospección?");
    if (!confirmacion) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${id_venta}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("No se pudo eliminar la prospección");
      buscarSeguimientos();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleCrearVenta = async () => {
    setErrorCrearVenta("");
    if (!nuevoObjetivo?.trim()) {
      setErrorCrearVenta("Ingresa el objetivo de la prospección.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const montoNum = nuevoMonto === "" || nuevoMonto == null ? null : parseFloat(nuevoMonto);
      const body = { id_prospecto: Number(id_prospecto), objetivo: nuevoObjetivo.trim(), estado: "Captación/ensayo" };
      if (montoNum != null && !Number.isNaN(montoNum)) body.monto_proyectado = montoNum;
      if (nuevoIdCategoriaVenta != null) body.id_categoria_venta = nuevoIdCategoriaVenta;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || "Error creando nueva prospección");
      
      setMostrarModalAbrirVenta(false);
      setNuevoObjetivo("");
      setNuevoMonto("");
      setNuevoIdCategoriaVenta(null);
      buscarSeguimientos();
    } catch (err) {
      setErrorCrearVenta(err.message);
    }
  };

  return (
    <div className="sp-container">
      {/* HEADER */}
      <div className="sp-header">
        <div className="sp-header-left">
          <button className="sp-btn-outline" onClick={() => navigate(-1)}>⬅️ Volver</button>
          <div className="sp-header-texts">
            <h1 className="sp-title">Seguimientos del Prospecto</h1>
            <p className="sp-subtitle">Gestión de prospecciones y registro de interacciones</p>
          </div>
        </div>
        <div className="sp-header-right">
          {!esSoloLectura && (
            <button className="sp-btn-primary" onClick={() => setMostrarModalAbrirVenta(true)}>
              <span className="sp-emoji">➕</span> Nueva Prospección
            </button>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="sp-filter-bar">
        <label className="sp-filter-label">Filtrar por estado:</label>
        <select className="sp-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todas">Todas</option>
          <option value="abiertas">Abiertas</option>
          <option value="cerradas">Cerradas</option>
        </select>
      </div>

      {loading && <div className="sp-loading-state">Cargando prospecciones...</div>}
      {error && <div className="sp-alert-error">{error}</div>}

      {/* TABLA PRINCIPAL (Escritorio) */}
      <div className="sp-table-wrapper">
        <table className="sp-table">
          <thead>
            <tr>
              <th>Objetivo</th>
              <th>Estado</th>
              <th>Monto Proyectado</th>
              <th>Monto Cierre</th>
              <th>Última Fecha</th>
              <th>Último Tipo</th>
              <th>Último Resultado</th>
              <th>Última Nota</th>
              <th className="sp-text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {prospecciones.length === 0 && !loading && (
              <tr><td colSpan="9" className="sp-empty-state">No se encontraron prospecciones.</td></tr>
            )}
            {prospecciones.map((p) => {
              const ultimoSeguimiento = p.seguimientos?.[0] || {};
              const siguienteSeguimiento = p.seguimientos
                ?.filter((s) => s.estado === "pendiente")
                .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

              return (
                <React.Fragment key={p.id_venta}>
                  <tr>
                    <td className="sp-font-bold">{p.objetivo?.toUpperCase() || "SIN OBJETIVO"}</td>
                    <td>
                      <span className={`sp-status-badge ${p.abierta ? "blue" : "gray"}`}>
                        {p.abierta ? "ABIERTA" : "CERRADA"}
                      </span>
                    </td>
                    <td>{formatearMonto(p.monto_proyectado)}</td>
                    <td>
                      {p.abierta ? "—" : typeof p.monto_cierre === "number" ? <span className="sp-money-green">{formatearMonto(p.monto_cierre)}</span> : "SIN MONTO"}
                    </td>
                    <td>{ultimoSeguimiento.fecha_programada ? new Date(ultimoSeguimiento.fecha_programada).toLocaleDateString("es-EC") : "No hay"}</td>
                    <td>{ultimoSeguimiento.tipo_seguimiento?.descripcion ? ultimoSeguimiento.tipo_seguimiento.descripcion.toUpperCase() : "NO REGISTRADO"}</td>
                    <td className={ultimoSeguimiento.resultado ? "sp-font-bold" : "sp-text-muted"}>
                      {ultimoSeguimiento.resultado?.toUpperCase() || "PENDIENTE"}
                    </td>
                    <td className="sp-note-cell">{ultimoSeguimiento.nota?.toUpperCase() || "SIN NOTA"}</td>
                    <td>
                      <div className="sp-actions-cell">
                        <button className="sp-action-btn" onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)} title="Ver Seguimientos">📜</button>
                        {!esSoloLectura && rol === "admin" && (
                          <button className="sp-action-btn" onClick={() => abrirModalEditar(p.id_venta, p.objetivo, p.monto_proyectado)} title="Editar">✏️</button>
                        )}
                        {!esSoloLectura && rol === "admin" && !p.abierta && p.estado_venta?.nombre === "Competencia" && (
                          <button className="sp-action-btn" onClick={() => abrirModalReabrir(p.id_venta)} title="Reabrir">🔁</button>
                        )}
                        {!esSoloLectura && rol === "admin" && (
                          <button className="sp-action-btn danger" onClick={() => eliminarProspeccion(p.id_venta)} title="Eliminar">🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* Fila de info extra (Próximo contacto) */}
                  <tr className="sp-extra-row">
                    <td colSpan="9">
                      <div className="sp-next-contact-box">
                        <strong>Próximo contacto:</strong>{" "}
                        {siguienteSeguimiento ? formatearFechaVisual(siguienteSeguimiento.fecha_programada) : "No agendado"}
                        {siguienteSeguimiento && (
                          <> <span className="sp-divider">|</span> <strong>Motivo:</strong> {siguienteSeguimiento.motivo || "Sin motivo"} </>
                        )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TARJETAS MÓVIL */}
      <div className="sp-mobile-cards">
        {prospecciones.length === 0 && !loading && <div className="sp-empty-state">No se encontraron prospecciones.</div>}
        {prospecciones.map((p) => {
          const s = p.seguimientos?.[0] || {};
          const siguienteSeguimiento = p.seguimientos?.filter((seg) => seg.estado === "pendiente").sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

          return (
            <div className="sp-mobile-card" key={p.id_venta}>
              <div className="sp-mc-header">
                <h3>{p.objetivo || "SIN OBJETIVO"}</h3>
                <span className={`sp-status-badge ${p.abierta ? "blue" : "gray"}`}>{p.abierta ? "ABIERTA" : "CERRADA"}</span>
              </div>
              
              <div className="sp-mc-body">
                <p><strong>Monto Proyectado:</strong> {formatearMonto(p.monto_proyectado)}</p>
                {!p.abierta && <p><strong>Monto Cierre:</strong> {typeof p.monto_cierre === "number" ? <span className="sp-money-green">{formatearMonto(p.monto_cierre)}</span> : "Sin monto"}</p>}
                <p><strong>Última Fecha:</strong> {s.fecha_programada ? new Date(s.fecha_programada).toLocaleDateString("es-EC") : "Sin fecha"}</p>
                <p><strong>Tipo:</strong> {s.tipo_seguimiento?.descripcion || "No registrado"}</p>
                <p><strong>Resultado:</strong> {s.resultado || "Pendiente"}</p>
                <p><strong>Nota:</strong> <span className="sp-text-muted">{s.nota || "Sin nota"}</span></p>
              </div>

              <div className="sp-next-contact-box" style={{ marginTop: "12px" }}>
                <strong>Próximo:</strong> {siguienteSeguimiento ? formatearFechaVisual(siguienteSeguimiento.fecha_programada) : "No agendado"}
              </div>

              <div className="sp-mc-actions">
                <button className="sp-btn-outline" onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}>📜 Ver</button>
                {!esSoloLectura && rol === "admin" && <button className="sp-btn-outline" onClick={() => abrirModalEditar(p.id_venta, p.objetivo, p.monto_proyectado)}>✏️</button>}
                {!esSoloLectura && rol === "admin" && !p.abierta && p.estado_venta?.nombre === "Competencia" && <button className="sp-btn-outline" onClick={() => abrirModalReabrir(p.id_venta)}>🔁</button>}
                {!esSoloLectura && rol === "admin" && <button className="sp-btn-outline danger" onClick={() => eliminarProspeccion(p.id_venta)}>🗑️</button>}
              </div>
            </div>
          );
        })}
      </div>

      {/* 📜 HISTORIAL (Timeline) */}
      <div className="sp-historial-section" ref={historialSectionRef} id="historial">
        <div className="sp-historial-header">
          <h2>Historial del Prospecto</h2>
          <p>Línea de tiempo de eventos y notas del equipo</p>
        </div>

        {errorHistorial && <div className="sp-alert-error">{errorHistorial}</div>}
        
        {loadingHistorial ? (
          <div className="sp-loading-state">Cargando historial...</div>
        ) : (
          <div className="sp-timeline-container">
            <div className="sp-timeline">
              {historial.length === 0 ? (
                <div className="sp-empty-state">No hay actividad registrada en el historial.</div>
              ) : (
                historial.map((item) => (
                  <div key={item.id_historial} className={`sp-timeline-item ${item.tipo === "nota" ? "note" : "event"}`}>
                    <div className="sp-timeline-icon">{item.tipo === "nota" ? "💬" : "🔹"}</div>
                    <div className="sp-timeline-content">
                      <div className="sp-timeline-meta">
                        <span className="sp-timeline-date">{formatearFechaHistorial(item.created_at)}</span>
                        {item.usuario?.nombre && <span className="sp-timeline-user">• {item.usuario.nombre}</span>}
                      </div>
                      <div className="sp-timeline-message">{item.mensaje}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {!esSoloLectura && (
              <form className="sp-chat-form" onSubmit={handleAgregarNota}>
                <textarea
                  className="sp-textarea"
                  placeholder="Escribe una nota para el equipo..."
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  rows={2}
                  disabled={enviandoNota}
                />
                <button type="submit" className="sp-btn-primary" disabled={enviandoNota || !nuevaNota.trim()}>
                  {enviandoNota ? "Enviando..." : "Enviar Nota"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* MODALES */}
      
      {/* 1. Modal Editar */}
      {modalEditar && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-content">
            <h3>Editar Objetivo</h3>
            <div className="sp-form-group">
              <label>Objetivo</label>
              <textarea className="sp-textarea" value={nuevoObjetivo} onChange={(e) => setNuevoObjetivo(e.target.value)} />
            </div>
            <div className="sp-form-group">
              <label>Monto Proyectado ($)</label>
              <input className="sp-input" type="number" value={nuevoMontoProyectado} onChange={(e) => setNuevoMontoProyectado(e.target.value)} min="0" step="0.01" />
            </div>
            <div className="sp-modal-actions">
              <button className="sp-btn-outline" onClick={() => setModalEditar(false)}>Cancelar</button>
              <button className="sp-btn-primary" onClick={guardarObjetivo}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Reabrir */}
      {modalReabrir && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-content">
            <h3>Reabrir Venta</h3>
            <div className="sp-form-group">
              <label>Fecha del nuevo seguimiento</label>
              <input className="sp-input" type="datetime-local" value={fechaReapertura} onChange={(e) => setFechaReapertura(e.target.value)} />
            </div>
            <div className="sp-form-group">
              <label>Nota o motivo</label>
              <textarea className="sp-textarea" value={notaReapertura} onChange={(e) => setNotaReapertura(e.target.value)} />
            </div>
            <div className="sp-modal-actions">
              <button className="sp-btn-outline" onClick={() => setModalReabrir(false)}>Cancelar</button>
              <button className="sp-btn-primary" onClick={confirmarReapertura}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Nueva Prospección */}
      {mostrarModalAbrirVenta && (
        <div className="sp-modal-overlay">
          <div className="sp-modal-content">
            <h3>Nueva Prospección</h3>
            <div className="sp-form-group">
              <label>Objetivo de la Prospección *</label>
              <textarea className="sp-textarea" value={nuevoObjetivo} onChange={(e) => setNuevoObjetivo(e.target.value)} placeholder="Describe el objetivo..." />
            </div>
            <div className="sp-form-group">
              <label>Monto Proyectado *</label>
              <input className="sp-input" type="number" value={nuevoMonto} onChange={(e) => setNuevoMonto(e.target.value)} placeholder="Ej: 5000" />
            </div>
            <div className="sp-form-group">
              <label>Categoría de venta</label>
              <select className="sp-select" value={nuevoIdCategoriaVenta ?? ""} onChange={(e) => setNuevoIdCategoriaVenta(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Seleccione categoría...</option>
                {categoriasVenta.map((c) => (
                  <option key={c.id_categoria_venta} value={c.id_categoria_venta}>{c.nombre}</option>
                ))}
              </select>
            </div>
            {errorCrearVenta && <div className="sp-alert-error">{errorCrearVenta}</div>}
            <div className="sp-modal-actions">
              <button className="sp-btn-outline" onClick={() => setMostrarModalAbrirVenta(false)}>Cancelar</button>
              <button className="sp-btn-primary" onClick={handleCrearVenta}>Crear</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SeguimientosProspecto;