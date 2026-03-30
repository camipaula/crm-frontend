import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRol } from "../utils/auth";
import "../styles/verSeguimientos.css"; // <-- Asegúrate que coincida el nombre de tu archivo

const VerSeguimientos = () => {
  const { id_venta } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [seguimientos, setSeguimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const rol = getRol();
  const esSoloLectura = rol === "lectura";

  useEffect(() => {
    obtenerSeguimientos();
  }, []);

  const obtenerSeguimientos = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${id_venta}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error obteniendo los seguimientos");
      const data = await res.json();

      // Ordenamos los seguimientos de la más nueva a la más antigua 📅
      const seguimientosOrdenados = (data.seguimientos || []).sort(
        (a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada)
      );

      setVenta(data);
      setSeguimientos(seguimientosOrdenados);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vs-container">
      {/* Header */}
      <div className="vs-header">
        <button className="vs-btn-outline" onClick={() => navigate(-1)}>
          ⬅️ Volver
        </button>
        <div className="vs-header-text">
          <h1 className="vs-title">Seguimientos e Interacciones</h1>
          <p className="vs-subtitle">Historial detallado de la oportunidad comercial</p>
        </div>
      </div>

      {loading && (
        <div className="vs-loading">
          <div className="vs-spinner"></div>
          Cargando datos de la prospección...
        </div>
      )}
      
      {error && <div className="vs-alert-error">{error}</div>}

      {venta && !loading && (
        <>
          {/* Tarjeta de Información General */}
          <div className="vs-info-card">
            <div className="vs-info-header">
              <h2>{venta.prospecto?.nombre?.toUpperCase() || "SIN PROSPECTO"}</h2>
              <span className={`vs-badge ${venta.abierta ? "vs-badge-blue" : "vs-badge-gray"}`}>
                {venta.abierta ? "PROSPECCIÓN ABIERTA" : "PROSPECCIÓN CERRADA"}
              </span>
            </div>

            <div className="vs-info-grid">
              <div className="vs-info-item">
                <span className="vs-info-label">Vendedora Asignada</span>
                <span className="vs-info-value">
                  {venta.prospecto?.vendedora_prospecto
                    ? `${venta.prospecto.vendedora_prospecto.nombre.toUpperCase()}${venta.prospecto.vendedora_prospecto.estado === 0 ? " (INACTIVA)" : ""}`
                    : "Sin asignar"}
                </span>
              </div>

              <div className="vs-info-item">
                <span className="vs-info-label">Contacto</span>
                <span className="vs-info-value">{venta.prospecto?.nombre_contacto?.toUpperCase() || "No registrado"}</span>
              </div>

              <div className="vs-info-item">
                <span className="vs-info-label">Correo Electrónico</span>
                <span className="vs-info-value" style={{ textTransform: 'lowercase' }}>{venta.prospecto?.correo || "No registrado"}</span>
              </div>

              <div className="vs-info-item">
                <span className="vs-info-label">Monto Proyectado</span>
                <span className="vs-info-value vs-money">
                  {venta.monto_proyectado != null
                    ? `$${parseFloat(venta.monto_proyectado).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "No definido"}
                </span>
              </div>

              {!venta.abierta && (
                <div className="vs-info-item">
                  <span className="vs-info-label">Monto de Cierre Final</span>
                  <span className="vs-info-value vs-money-green">
                    {typeof venta.monto_cierre === "number"
                      ? `$${parseFloat(venta.monto_cierre).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "Sin monto"}
                  </span>
                </div>
              )}

              <div className="vs-info-item">
                <span className="vs-info-label">Fecha de Creación</span>
                <span className="vs-info-value">
                  {venta.prospecto?.created_at
                    ? new Date(venta.prospecto.created_at).toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "numeric" })
                    : "Sin fecha"}
                </span>
              </div>

              <div className="vs-info-item vs-full-width">
                <span className="vs-info-label">Objetivo Comercial</span>
                <span className="vs-info-value">{venta.objetivo || "Sin objetivo definido"}</span>
              </div>
            </div>
          </div>

          {/* Sección de Seguimientos */}
          <div className="vs-seguimientos-section">
            <div className="vs-section-header">
              <h3>Historial de Interacciones</h3>
              
              {!esSoloLectura && venta.abierta && (
                <button className="vs-btn-primary" onClick={() => navigate(`/agendar-seguimiento/${id_venta}`)}>
                  ➕ Agendar Seguimiento
                </button>
              )}
            </div>

            {seguimientos.length === 0 ? (
              <div className="vs-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>No hay seguimientos registrados para esta prospección.</p>
                {!esSoloLectura && venta.abierta && (
                  <button className="vs-btn-primary" onClick={() => navigate(`/agendar-seguimiento/${id_venta}`)}>
                    ➕ Agendar Primer Seguimiento
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* VISTA ESCRITORIO (Tabla) */}
                <div className="vs-table-wrapper">
                  <table className="vs-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Motivo</th>
                        <th>Nota / Detalles</th>
                        <th>Resultado</th>
                        <th className="vs-text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seguimientos.map((s) => (
                        <tr key={s.id_seguimiento}>
                          <td className="vs-td-bold">
                            {new Date(s.fecha_programada).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td>
                            <span className="vs-badge vs-badge-gray">
                              {s.tipo_seguimiento?.descripcion?.toUpperCase() || "SIN TIPO"}
                            </span>
                          </td>
                          <td>
                            <span className={`vs-badge ${s.estado === "pendiente" ? "vs-badge-amber" : "vs-badge-green"}`}>
                              {s.estado.toUpperCase()}
                            </span>
                          </td>
                          <td className="vs-td-muted">{s.motivo?.toUpperCase() || "—"}</td>
                          <td className="vs-td-note">{s.nota || "—"}</td>
                          <td className={s.resultado ? "vs-td-bold" : "vs-td-muted"}>
                            {s.resultado?.toUpperCase() || "PENDIENTE"}
                          </td>
                          <td className="vs-td-actions">
                            {!s.resultado && !esSoloLectura && (
                              <button className="vs-action-btn" onClick={() => navigate(`/registrar-resultado/${s.id_seguimiento}`)}>
                                ✍️ Resultado
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* VISTA MÓVIL (Tarjetas) */}
                <div className="vs-mobile-view">
                  {seguimientos.map((s) => (
                    <div className="vs-mobile-card" key={s.id_seguimiento}>
                      <div className="vs-mc-header">
                        <span className="vs-mc-date">
                          📅 {new Date(s.fecha_programada).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span className={`vs-badge ${s.estado === "pendiente" ? "vs-badge-amber" : "vs-badge-green"}`}>
                          {s.estado.toUpperCase()}
                        </span>
                      </div>
                      
                      <p><strong>Tipo:</strong> {s.tipo_seguimiento?.descripcion || "Sin tipo"}</p>
                      <p><strong>Motivo:</strong> {s.motivo || "—"}</p>
                      <p><strong>Nota:</strong> <span className="vs-td-muted">{s.nota || "—"}</span></p>
                      <p><strong>Resultado:</strong> {s.resultado || "Pendiente"}</p>

                      {!s.resultado && !esSoloLectura && (
                        <div className="vs-mc-actions">
                          <button className="vs-action-btn-full" onClick={() => navigate(`/registrar-resultado/${s.id_seguimiento}`)}>
                            ✍️ Registrar Resultado
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VerSeguimientos;