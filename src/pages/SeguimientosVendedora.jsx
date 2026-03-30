import { useState, useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import { useNavigate } from "react-router-dom";
import { obtenerCedulaDesdeToken } from "../utils/auth";
import "../styles/seguimientosVendedora.css"; // 🔹 Asegúrate de que el nombre del CSS sea este
import React from "react";

const SeguimientosVendedora = () => {
  const navigate = useNavigate();
  const [prospecciones, setProspecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  const [modalEditar, setModalEditar] = useState(false);
  const [idVentaSeleccionada, setIdVentaSeleccionada] = useState(null);
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");

  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [filtrosInicializados, setFiltrosInicializados] = useState(false);

  const [filtroSeguimiento, setFiltroSeguimiento] = useState("todos");

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [limitePorPagina] = useState(10);
  const [busquedaInput, setBusquedaInput] = useState("");

  useEffect(() => {
    const filtrosGuardados = localStorage.getItem("filtros_seguimientos_vendedora");
    if (filtrosGuardados) {
      try {
        const filtros = JSON.parse(filtrosGuardados);
        if (filtros.filtroEstado) setFiltroEstado(filtros.filtroEstado);
        if (filtros.busquedaNombre) {
          setBusquedaNombre(filtros.busquedaNombre);
          setBusquedaInput(filtros.busquedaNombre);
        }
        if (filtros.filtroSeguimiento) setFiltroSeguimiento(filtros.filtroSeguimiento);
      } catch (e) {
        console.error("Error al leer filtros guardados:", e);
      }
    }
    setFiltrosInicializados(true);
    buscarSeguimientos();
  }, []);

  useEffect(() => {
    if (!filtrosInicializados) return;
    const filtros = {
      filtroEstado,
      busquedaNombre,
      filtroSeguimiento,
    };
    localStorage.setItem("filtros_seguimientos_vendedora", JSON.stringify(filtros));
    buscarSeguimientos(1, busquedaNombre); // Reinicia página al cambiar filtros
  }, [filtroEstado, busquedaNombre, filtroSeguimiento, filtrosInicializados]);

  const capitalizar = (texto) => {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };

  const formatearFechaVisual = (fechaStr) => {
    const fecha = new Date(fechaStr.replace("Z", ""));
    return fecha.toLocaleString("es-EC", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const buscarSeguimientos = async (pagina = paginaActual, nombre = busquedaNombre) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const cedulaVendedora = obtenerCedulaDesdeToken();

      let url = `${import.meta.env.VITE_API_URL}/api/ventas/prospecciones?cedula_vendedora=${cedulaVendedora}&page=${pagina}&limit=${limitePorPagina}`;
      if (filtroEstado !== "todas") url += `&estado_prospeccion=${filtroEstado}`;
      if (filtroSeguimiento && filtroSeguimiento !== "todos") url += `&seguimiento=${filtroSeguimiento}`;
      if (nombre.trim()) url += `&nombre=${encodeURIComponent(nombre.trim())}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Error obteniendo prospecciones");

      const data = await res.json();
      setProspecciones(data.prospecciones);
      setPaginaActual(data.page);
      setTotalPaginas(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      const cedulaVendedora = obtenerCedulaDesdeToken();
      let url = `${import.meta.env.VITE_API_URL}/api/seguimientos/exportar?cedula_vendedora=${cedulaVendedora}`;

      if (filtroEstado !== "todas") url += `&estado_prospeccion=${filtroEstado}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        alert(data.message);
        return;
      }

      if (!res.ok) throw new Error("Error al exportar seguimientos");

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "seguimientos.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al exportar:", error);
    }
  };

  const abrirModalEditar = (id_venta, objetivoActual) => {
    setIdVentaSeleccionada(id_venta);
    setNuevoObjetivo(objetivoActual);
    setModalEditar(true);
  };

  const guardarObjetivo = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${idVentaSeleccionada}/objetivo`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ objetivo: nuevoObjetivo }),
      });

      if (!res.ok) throw new Error("Error actualizando objetivo");
      setModalEditar(false);
      buscarSeguimientos(); // Recargar
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const clasificarSeguimiento = (venta) => {
    const seguimientos = venta.seguimientos || [];
    if (seguimientos.length === 0) return "sin_seguimiento";

    const pendientes = seguimientos
      .filter(s => s.estado === "pendiente")
      .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada));

    if (pendientes.length > 0) {
      const siguientePendiente = pendientes[0];
      const fechaProgramada = new Date(siguientePendiente.fecha_programada);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaProgramada.setHours(0, 0, 0, 0);
      const diffDias = (fechaProgramada - hoy) / (1000 * 60 * 60 * 24);

      if (diffDias < 0) return "vencido";
      if (diffDias === 0) return "hoy";
      if (diffDias <= 7) return "proximo";
      return "futuro";
    }

    const realizados = seguimientos
      .filter(s => s.estado === "realizado")
      .sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada));

    if (realizados.length > 0) return "realizado";
    return "sin_seguimiento";
  };

  const etiquetaSeguimiento = (venta) => {
    const estado = clasificarSeguimiento(venta);
    if (estado === "vencido") return <span className="sv-status-tag red">🔴 Vencido</span>;
    if (estado === "hoy") return <span className="sv-status-tag orange">🟠 Hoy</span>;
    if (estado === "proximo") return <span className="sv-status-tag yellow">🟡 Próximo</span>;
    if (estado === "futuro") return <span className="sv-status-tag blue">🔵 Futuro</span>;
    if (estado === "realizado") return <span className="sv-status-tag green">✅ Realizado</span>;
    return <span className="sv-status-tag gray">⚪ Sin seguimiento</span>;
  };

  const formatearMonto = (monto) => {
    return monto != null
      ? `$${parseFloat(monto).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "No definido";
  };

  const prospeccionesFiltradas = prospecciones.filter((p) =>
    p.prospecto?.nombre?.toLowerCase().includes(busquedaNombre.toLowerCase())
  );

  const debouncedBuscar = useRef(
    debounce((valor) => {
      setPaginaActual(1);
      setBusquedaNombre(valor);
    }, 500)
  ).current;

  useEffect(() => {
    return () => {
      debouncedBuscar.cancel();
    };
  }, []);

  return (
    <div className="sv-container">
      {/* ── HEADER ── */}
      <div className="sv-header">
        <div className="sv-header-titles">
          <button className="sv-btn-outline" onClick={() => navigate(-1)}>⬅️ Volver</button>
          <h1>Seguimiento de Prospectos</h1>
        </div>
        <div className="sv-header-actions">
          <button className="sv-btn-outline" onClick={exportarExcel}>
            <span className="sv-emoji">📥</span> Exportar a Excel
          </button>
        </div>
      </div>

      {error && <div className="sv-alert-error">{error}</div>}

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="sv-search-bar">
        <div className="sv-search-inputs">
          <input
            type="text"
            className="sv-input sv-search-input"
            placeholder="Buscar por nombre de prospecto..."
            value={busquedaInput}
            onChange={(e) => {
              setBusquedaInput(e.target.value);
              debouncedBuscar(e.target.value);
            }}
          />
          <select className="sv-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todas">Todos los estados</option>
            <option value="abiertas">Solo Abiertas</option>
            <option value="cerradas">Solo Cerradas</option>
          </select>
          <select className="sv-select" value={filtroSeguimiento} onChange={(e) => setFiltroSeguimiento(e.target.value)}>
            <option value="todos">Todos los seguimientos</option>
            <option value="vencido">Vencidos</option>
            <option value="hoy">Hoy</option>
            <option value="proximo">Próximos (7 días)</option>
            <option value="futuro">Futuros</option>
            <option value="realizado">Realizados</option>
          </select>
        </div>
      </div>

      {/* ── PAGINACIÓN ── */}
      <div className="sv-card">
        <div className="sv-pagination">
          <button className="sv-btn-outline" disabled={paginaActual <= 1} onClick={() => buscarSeguimientos(paginaActual - 1, busquedaNombre)}>
            ⬅️ Anterior
          </button>
          <span>Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong></span>
          <button className="sv-btn-outline" disabled={paginaActual >= totalPaginas} onClick={() => buscarSeguimientos(paginaActual + 1, busquedaNombre)}>
            Siguiente ➡️
          </button>
        </div>

        {loading ? (
          <div className="sv-loading-state">Cargando prospecciones...</div>
        ) : (
          <>
            {/* ── TABLA ESCRITORIO ── */}
            <div className="sv-table-wrapper">
              <table className="sv-table">
                <thead>
                  <tr>
                    <th>Prospecto</th>
                    <th>Objetivo</th>
                    <th>Estado de la Prospección</th>
                    <th>Última Fecha</th>
                    <th>Último Tipo</th>
                    <th>Último Resultado</th>
                    <th>Última Nota</th>
                    <th>Seguimiento</th>
                    <th className="sv-text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {prospeccionesFiltradas.length === 0 && (
                    <tr><td colSpan="9" className="sv-empty-state">No se encontraron prospectos con estos filtros.</td></tr>
                  )}
                  {prospeccionesFiltradas.map((p) => {
                    const tieneSeguimientos = p.seguimientos && p.seguimientos.length > 0;
                    const ultimoSeguimiento = tieneSeguimientos ? p.seguimientos[0] : null;
                    const siguienteSeguimiento = p.seguimientos
                      ?.filter((s) => s.estado === "pendiente")
                      .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

                    const esGanado = p.estado_venta?.nombre === "Cierre de venta" && p.monto_cierre;
                    const estadoVentaTexto = esGanado ? `Ganado ($${p.monto_cierre.toFixed(2)})` : capitalizar(p.estado_venta?.nombre) || "NO DEFINIDO";

                    return (
                      <React.Fragment key={p.id_venta}>
                        <tr>
                          <td className="sv-font-bold">{p.prospecto?.nombre ? p.prospecto.nombre.toUpperCase() : "SIN PROSPECTO"}</td>
                          <td>{p.objetivo ? capitalizar(p.objetivo.toUpperCase()) : "SIN OBJETIVO"}</td>
                          <td>
                            <span className={`sv-badge ${esGanado ? "green" : "blue"}`}>
                              {estadoVentaTexto}
                            </span>
                          </td>
                          <td>{ultimoSeguimiento?.fecha_programada ? new Date(ultimoSeguimiento.fecha_programada).toLocaleDateString() : "—"}</td>
                          <td>{ultimoSeguimiento?.tipo_seguimiento?.descripcion ? ultimoSeguimiento.tipo_seguimiento.descripcion.toUpperCase() : "—"}</td>
                          <td className={ultimoSeguimiento?.resultado ? "sv-font-bold" : "sv-text-muted"}>{ultimoSeguimiento?.resultado || "PENDIENTE"}</td>
                          <td className="sv-note-cell">{ultimoSeguimiento?.nota ? ultimoSeguimiento.nota.toUpperCase() : "—"}</td>
                          <td>{etiquetaSeguimiento(p)}</td>
                          <td>
                            <div className="sv-actions-cell">
                              {!tieneSeguimientos ? (
                                <button className="sv-btn-table-action" onClick={() => navigate(`/agendar-seguimiento/${p.id_venta}`)}>
                                  <span className="sv-emoji">📅</span> Agendar
                                </button>
                              ) : (
                                <button className="sv-btn-table-action" onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}>
                                  <span className="sv-emoji">📜</span> Ver
                                </button>
                              )}
                              {p.prospecto?.id_prospecto && (
                                <button className="sv-icon-btn" onClick={() => navigate(`/seguimientos-prospecto/${p.prospecto.id_prospecto}#historial`)} title="Historial general">
                                  ⏱️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Fila de info extra */}
                        <tr className="sv-extra-row">
                          <td colSpan="9">
                            <div className="sv-next-contact-box">
                              <strong>Siguiente programado:</strong>{" "}
                              {siguienteSeguimiento ? formatearFechaVisual(siguienteSeguimiento.fecha_programada) : "No agendado"}
                              {siguienteSeguimiento && (
                                <> <span className="sv-divider">|</span> <strong>Motivo:</strong> {siguienteSeguimiento.motivo || "Sin motivo"} </>
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

            {/* ── VISTA MÓVIL (Tarjetas) ── */}
            <div className="sv-mobile-view">
              {prospeccionesFiltradas.length === 0 && <div className="sv-empty-state">No se encontraron prospectos con estos filtros.</div>}
              {prospeccionesFiltradas.map((p) => {
                const tieneSeguimientos = p.seguimientos?.length > 0;
                const ultimoSeguimiento = tieneSeguimientos ? p.seguimientos[0] : null;
                const siguienteSeguimiento = p.seguimientos?.filter((s) => s.estado === "pendiente").sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];
                const esGanado = p.estado_venta?.nombre === "Cierre de venta" && p.monto_cierre;
                const estadoVentaTexto = esGanado ? `Ganado ($${p.monto_cierre.toFixed(2)})` : capitalizar(p.estado_venta?.nombre) || "No definido";

                return (
                  <div key={p.id_venta} className="sv-mobile-card">
                    <div className="sv-mc-header">
                      <h3 className="sv-mc-title">{p.prospecto?.nombre || "Sin Prospecto"}</h3>
                      {etiquetaSeguimiento(p)}
                    </div>
                    
                    <p><strong>Objetivo:</strong> {p.objetivo || "Sin objetivo"}</p>
                    <p><strong>Estado Prospección:</strong> <span className={`sv-badge ${esGanado ? "green" : "blue"}`}>{estadoVentaTexto}</span></p>
                    
                    <div className="sv-divider-line"></div>

                    <p><strong>Última Fecha:</strong> {ultimoSeguimiento?.fecha_programada ? new Date(ultimoSeguimiento.fecha_programada).toLocaleDateString() : "No hay"}</p>
                    <p><strong>Último Tipo:</strong> {ultimoSeguimiento?.tipo_seguimiento?.descripcion || "No registrado"}</p>
                    <p><strong>Último Resultado:</strong> {ultimoSeguimiento?.resultado || "Pendiente"}</p>
                    <p><strong>Última Nota:</strong> <span className="sv-text-muted">{ultimoSeguimiento?.nota || "Sin nota"}</span></p>

                    <div className="sv-next-contact-box" style={{ marginTop: "12px", width: "100%", boxSizing: "border-box" }}>
                      <strong>Siguiente programado:</strong><br/>
                      {siguienteSeguimiento ? formatearFechaVisual(siguienteSeguimiento.fecha_programada) : "No agendado"}
                      {siguienteSeguimiento && <><br/><strong>Motivo:</strong> {siguienteSeguimiento.motivo || "Sin motivo"}</>}
                    </div>

                    <div className="sv-mc-actions">
                      {!tieneSeguimientos ? (
                        <button className="sv-btn-outline" onClick={() => navigate(`/agendar-seguimiento/${p.id_venta}`)}>📅 Agendar Primer</button>
                      ) : (
                        <button className="sv-btn-outline" onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}>📜 Ver Seg.</button>
                      )}
                      {p.prospecto?.id_prospecto && (
                        <button className="sv-btn-outline" onClick={() => navigate(`/seguimientos-prospecto/${p.prospecto.id_prospecto}#historial`)}>⏱️ Historial</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 🟩 Modal Editar Objetivo */}
      {modalEditar && (
        <div className="sv-modal-overlay">
          <div className="sv-modal-content">
            <h3>Editar Objetivo</h3>
            <div className="sv-form-group">
              <label>Nuevo Objetivo</label>
              <textarea className="sv-textarea" value={nuevoObjetivo} onChange={(e) => setNuevoObjetivo(e.target.value)} />
            </div>
            <div className="sv-modal-actions">
              <button className="sv-btn-outline" onClick={() => setModalEditar(false)}>Cancelar</button>
              <button className="sv-btn-primary" onClick={guardarObjetivo}>Guardar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SeguimientosVendedora;