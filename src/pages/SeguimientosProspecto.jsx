import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getRol } from "../utils/auth"; // IMPORTANTE

import "../styles/seguimientosVendedora.css";
import "../styles/seguimientosProspecto.css";
import React from "react";

const SeguimientosProspecto = () => {
  const { id_prospecto } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const historialSectionRef = useRef(null);
  const [prospecciones, setProspecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas"); // 🔹 Estado del filtro

  const [modalEditar, setModalEditar] = useState(false);
  const [idVentaSeleccionada, setIdVentaSeleccionada] = useState(null);
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");
  const [nuevoMontoProyectado, setNuevoMontoProyectado] = useState("");
  const [modalReabrir, setModalReabrir] = useState(false);
  const [notaReapertura, setNotaReapertura] = useState("");
  const [fechaReapertura, setFechaReapertura] = useState("");

  //modal nueva prospeccion
  const [mostrarModalAbrirVenta, setMostrarModalAbrirVenta] = useState(false);
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [nuevoIdCategoriaVenta, setNuevoIdCategoriaVenta] = useState(null);
  const [categoriasVenta, setCategoriasVenta] = useState([]);
  const [errorCrearVenta, setErrorCrearVenta] = useState("");

  // Historial (timeline / chat)
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
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fechaStr;
    }
  };

  const formatearMonto = (monto) => {
    return monto != null
      ? `$${parseFloat(monto).toLocaleString("es-EC", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
      : "No definido";
  };

  const abrirModalReabrir = (id_venta) => {
    setIdVentaSeleccionada(id_venta);
    setNotaReapertura("");

    // Setear la fecha actual a las 08:00
    const hoy = new Date();
    hoy.setHours(8, 0, 0, 0);
    const isoFecha = hoy.toISOString().slice(0, 16); // formato para datetime-local

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
    // Mostrar error solo si no fue redirección por 404
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
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
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
        body: JSON.stringify({
          objetivo: nuevoObjetivo,
          monto_proyectado: parseFloat(nuevoMontoProyectado)
        }),
      });

      if (!res.ok) throw new Error("Error actualizando objetivo y monto");
      alert("Actualización exitosa");
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nota: notaReapertura,
          fecha_programada: fechaReapertura,
        }),
      });

      if (!res.ok) throw new Error("No se pudo reabrir la venta");
      alert("Venta reabierta correctamente");
      setModalReabrir(false);
      buscarSeguimientos();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const eliminarProspeccion = async (id_venta) => {
    const confirmacion = window.confirm("¿Estás segura de que deseas eliminar esta prospección? Esta acción no se puede deshacer.");
    if (!confirmacion) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${id_venta}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("No se pudo eliminar la prospección");
      alert("Prospección eliminada correctamente");
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
      const body = {
        id_prospecto: Number(id_prospecto),
        objetivo: nuevoObjetivo.trim(),
        estado: "Captación/ensayo",
      };
      if (montoNum != null && !Number.isNaN(montoNum)) body.monto_proyectado = montoNum;
      if (nuevoIdCategoriaVenta != null) body.id_categoria_venta = nuevoIdCategoriaVenta;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || "Error creando nueva prospección");
      alert("Venta creada correctamente");
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
    <div className="seguimientos-container">

      <h1 className="title">Seguimientos del Prospecto</h1>
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>
      {!esSoloLectura && (
        <button className="btn-agregar" onClick={() => setMostrarModalAbrirVenta(true)}>
          ➕ Nueva Prospección
        </button>
      )}

      <div className="filtros-container">
        <label>Filtrar por estado de prospección:</label>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todas">Todas</option>
          <option value="abiertas">Abiertas</option>
          <option value="cerradas">Cerradas</option>
        </select>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      <table className="tabla-seguimientos-prospecto">
        <thead>
          <tr>
            <th>Objetivo</th>
            <th>Estado de la Prospección</th>
            <th>Monto Proyectado</th>

            <th>Monto de Cierre</th>
            <th>Última Fecha</th>
            <th>Último Tipo</th>
            <th>Último Resultado</th>
            <th>Última Nota</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {prospecciones.map((p) => {
            const ultimoSeguimiento = p.seguimientos?.[0] || {};
            const siguienteSeguimiento = p.seguimientos
              ?.filter((s) => s.estado === "pendiente")
              .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

            return (
              <React.Fragment key={p.id_venta}>

                <tr key={p.id_venta}>
                  <td>{p.objetivo.toUpperCase() || "SIN OBJETIVO"}</td>
                  <td>{p.abierta ? "ABIERTA" : "CERRADA"}</td>
                  <td>{formatearMonto(p.monto_proyectado)}</td>


                  <td>
                    {p.abierta
                      ? "—"
                      : typeof p.monto_cierre === "number"
                        ? formatearMonto(p.monto_cierre)
                        : "SIN  MONTO"}
                  </td>

                  <td>{ultimoSeguimiento.fecha_programada ? new Date(ultimoSeguimiento.fecha_programada).toLocaleDateString() : "No hay"}</td>
                  <td>{ultimoSeguimiento.tipo_seguimiento?.descripcion ? ultimoSeguimiento.tipo_seguimiento.descripcion.toUpperCase() : "No registrado"}</td>
                  <td>{ultimoSeguimiento.resultado ? ultimoSeguimiento.resultado.toUpperCase() : "Pendiente"}</td>
                  <td>{ultimoSeguimiento.nota ? ultimoSeguimiento.nota.toUpperCase() : "Sin nota"}</td>
                  <td>
                    <button
                      className="btn-ver-seguimientos"
                      onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}
                    >
                      📜 Ver Seguimientos
                    </button>
                    {!esSoloLectura && rol === "admin" && (
                      <button className="btn-mini" onClick={() => abrirModalEditar(p.id_venta, p.objetivo, p.monto_proyectado)}>✏️</button>
                    )}
                    {!esSoloLectura && rol === "admin" && !p.abierta && p.estado_venta?.nombre === "Competencia" && (
                      <button className="btn-mini" onClick={() => abrirModalReabrir(p.id_venta)}>REABIR</button>
                    )}

                    {!esSoloLectura && rol === "admin" && (
                      <button className="btn-mini rojo" onClick={() => eliminarProspeccion(p.id_venta)}>🗑️</button>
                    )}

                  </td>
                </tr>

                {/* Nueva fila con la siguiente fecha y motivo */}
                <tr className="fila-info-extra">
                  <td colSpan="7" style={{ fontStyle: "italic", color: "#555", backgroundColor: "#c9edec" }}>
                    <strong>Siguiente fecha programada:</strong>{" "}
                    {siguienteSeguimiento
                      ? formatearFechaVisual(siguienteSeguimiento.fecha_programada)

                      : "No se ha agendado un seguimiento."}
                    {siguienteSeguimiento && (
                      <>
                        {"  —  "}
                        <strong>Motivo:</strong> {siguienteSeguimiento.motivo || "Sin motivo"}
                      </>
                    )}
                  </td>
                </tr>
              </React.Fragment>

            );
          })}

        </tbody>
      </table>


      <div className="tarjetas-seguimientos-prospecto">
        {prospecciones.map((p) => {
          const s = p.seguimientos?.[0] || {};
          const siguienteSeguimiento = p.seguimientos
            ?.filter((s) => s.estado === "pendiente")
            .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

          return (
            <div className="card-seguimiento" key={p.id_venta}>
              <h3>🎯 Objetivo: {p.objetivo || "No definido"}</h3>
              <p>
                <strong>Monto Proyectado:</strong> {formatearMonto(p.monto_proyectado)}
              </p>


              <p><strong>Estado Prospección:</strong> {p.abierta ? "Abierta" : "Cerrada"}</p>
              {!p.abierta && (
                <p>
                  <strong>Monto Cierre:</strong>{" "}
                  {typeof p.monto_cierre === "number"
                    ? formatearMonto(p.monto_cierre)
                    : "Sin monto"}
                </p>

              )}

              <p><strong>Fecha:</strong> {s.fecha_programada ? new Date(s.fecha_programada).toLocaleDateString() : "Sin fecha"}</p>
              <p><strong>Tipo:</strong> {s.tipo_seguimiento?.descripcion || "No registrado"}</p>
              <p><strong>Resultado:</strong> {s.resultado || "Pendiente"}</p>
              <p><strong>Nota:</strong> {s.nota || "Sin nota"}</p>

              <div className="acciones">
                <button className="btn-ver-seguimientos" onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}>
                  📜 Ver
                </button>
                {!esSoloLectura && rol === "admin" && (
                  <button className="btn-mini" onClick={() => abrirModalEditar(p.id_venta, p.objetivo, p.monto_proyectado)}>✏️</button>
                )}
                {!esSoloLectura && rol === "admin" && !p.abierta && p.estado_venta?.nombre === "Competencia" && (
                  <button className="btn-mini azul" onClick={() => abrirModalReabrir(p.id_venta)}>🔁</button>
                )}
                {!esSoloLectura && rol === "admin" && (
                  <button className="btn-mini rojo" onClick={() => eliminarProspeccion(p.id_venta)}>🗑️</button>
                )}


                <p style={{ fontStyle: "italic", marginTop: "10px" }}>
                  <strong>Siguiente fecha programada:</strong>{" "}
                  {siguienteSeguimiento
                    ? formatearFechaVisual(siguienteSeguimiento.fecha_programada)
                    : "No se ha agendado un seguimiento."}
                  {siguienteSeguimiento && (
                    <>
                      {"  —  "}
                      <strong>Motivo:</strong> {siguienteSeguimiento.motivo || "Sin motivo"}
                    </>
                  )}
                </p>

              </div>
            </div>
          );
        })}
      </div>

      {/* 📜 Historial (timeline + chat) */}
      <section className="historial-section" ref={historialSectionRef} id="historial">
        <h2 className="historial-title">📜 Historial</h2>
        <p className="historial-desc">Timeline del prospecto: eventos del sistema y notas del equipo.</p>

        {errorHistorial && <p className="historial-error">{errorHistorial}</p>}
        {loadingHistorial ? (
          <p className="historial-loading">Cargando historial…</p>
        ) : (
          <>
            <div className="historial-timeline">
              {historial.length === 0 ? (
                <p className="historial-empty">Aún no hay actividad en el historial.</p>
              ) : (
                historial.map((item) => (
                  <div
                    key={item.id_historial}
                    className={`historial-item ${item.tipo === "nota" ? "historial-item--nota" : "historial-item--evento"}`}
                  >
                    <div className="historial-item-header">
                      <span className="historial-item-icon">
                        {item.tipo === "nota" ? "💬" : "🟦"}
                      </span>
                      <span className="historial-item-fecha">
                        {formatearFechaHistorial(item.created_at)}
                      </span>
                      {item.usuario?.nombre && (
                        <span className="historial-item-usuario">{item.usuario.nombre}</span>
                      )}
                    </div>
                    <div className="historial-item-mensaje">{item.mensaje}</div>
                  </div>
                ))
              )}
            </div>
            {!esSoloLectura && (
              <form className="historial-form" onSubmit={handleAgregarNota}>
                <textarea
                  className="historial-textarea"
                  placeholder="Escribe una nota para el equipo…"
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  rows={3}
                  disabled={enviandoNota}
                />
                <button
                  type="submit"
                  className="historial-btn-enviar"
                  disabled={enviandoNota || !nuevaNota.trim()}
                >
                  {enviandoNota ? "Enviando…" : "Agregar nota"}
                </button>
              </form>
            )}
          </>
        )}
      </section>

      {/* 🟩 Modal Editar Objetivo */}
      {modalEditar && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Editar Objetivo</h3>
            <textarea
              value={nuevoObjetivo}
              onChange={(e) => setNuevoObjetivo(e.target.value)}
            />
            <label>Monto Proyectado:</label>
            <input
              type="number"
              value={nuevoMontoProyectado}
              onChange={(e) => setNuevoMontoProyectado(e.target.value)}
              min="0"
              step="0.01"
            />
            <div className="modal-buttons">
              <button onClick={guardarObjetivo}>Guardar</button>
              <button onClick={() => setModalEditar(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}


      {modalReabrir && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Reabrir Venta</h3>
            <label>Fecha del nuevo seguimiento:</label>
            <input
              type="datetime-local"
              value={fechaReapertura}
              onChange={(e) => setFechaReapertura(e.target.value)}
              readOnly
            />
            <label>Nota o motivo:</label>
            <textarea
              value={notaReapertura}
              onChange={(e) => setNotaReapertura(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={confirmarReapertura}>Confirmar</button>
              <button onClick={() => setModalReabrir(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalAbrirVenta && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Nueva Prospección</h3>
            <label>Objetivo de la Prospección *</label>
            <textarea
              value={nuevoObjetivo}
              onChange={(e) => setNuevoObjetivo(e.target.value)}
              placeholder="Describe el objetivo..."
            />

            <label>Monto Proyectado *</label>
            <input
              type="number"
              value={nuevoMonto}
              onChange={(e) => setNuevoMonto(e.target.value)}
              placeholder="Ej: 5000"
            />

            <label>Categoría de venta</label>
            <select
              value={nuevoIdCategoriaVenta ?? ""}
              onChange={(e) => setNuevoIdCategoriaVenta(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Seleccione categoría de venta...</option>
              {categoriasVenta.map((c) => (
                <option key={c.id_categoria_venta} value={c.id_categoria_venta}>
                  {c.nombre}
                </option>
              ))}
            </select>

            {errorCrearVenta && <p className="error">{errorCrearVenta}</p>}

            <div className="modal-buttons">
              <button className="btn-confirmar" onClick={handleCrearVenta}>Crear</button>
              <button className="btn-cancelar" onClick={() => setMostrarModalAbrirVenta(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}



    </div>

  );



};


export default SeguimientosProspecto;
