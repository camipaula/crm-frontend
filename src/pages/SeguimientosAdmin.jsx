import { useState, useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import "../styles/seguimientosAdmin.css";
import React from "react";
import { getRol } from "../utils/auth";

const SeguimientosAdmin = () => {
  const navigate = useNavigate();
  const [vendedoras, setVendedoras] = useState([]);
  const [vendedoraSeleccionada, setVendedoraSeleccionada] = useState(null);
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
  const [modalReabrir, setModalReabrir] = useState(false);
  const [notaReapertura, setNotaReapertura] = useState("");
  const [fechaReapertura, setFechaReapertura] = useState("");

  const rol = getRol();
  const esSoloLectura = rol === "lectura";

  useEffect(() => {
    const filtrosGuardados = localStorage.getItem("filtros_seguimientos_admin");
    let filtros = { filtroEstado: "todas", vendedoraSeleccionada: null };

    if (filtrosGuardados) {
      try {
        filtros = JSON.parse(filtrosGuardados);
        setFiltroEstado(filtros.filtroEstado || "todas");
        setBusquedaNombre(filtros.busquedaNombre || "");
        setFiltroSeguimiento(filtros.filtroSeguimiento || "todos");
        setFiltrosInicializados(true);
      } catch (e) {
        console.error("Error al leer filtros guardados", e);
      }
    }

    obtenerVendedoras().then((opciones) => {
      setVendedoras(opciones);
      const nombre = filtros.busquedaNombre || "";
      const seguimiento = filtros.filtroSeguimiento || "todos";
      const estado = filtros.filtroEstado || "todas";

      if (filtros.vendedoraSeleccionada) {
        const seleccion = opciones.find(
          (v) => v.value === filtros.vendedoraSeleccionada.value
        );
        if (seleccion) {
          setVendedoraSeleccionada(seleccion);
          buscarSeguimientos(seleccion.value, estado, 1, seguimiento, nombre);
          return;
        }
      }

      buscarSeguimientos("", estado, 1, seguimiento, nombre);
    });
  }, []);

  useEffect(() => {
    if (!filtrosInicializados) return;

    const filtrosActualizados = {
      vendedoraSeleccionada,
      filtroEstado,
      busquedaNombre,
      filtroSeguimiento,
    };
    localStorage.setItem(
      "filtros_seguimientos_admin",
      JSON.stringify(filtrosActualizados)
    );
  }, [
    vendedoraSeleccionada,
    filtroEstado,
    busquedaNombre,
    filtroSeguimiento,
    filtrosInicializados,
  ]);

  const abrirModalReabrir = (id_venta) => {
    setIdVentaSeleccionada(id_venta);
    setNotaReapertura("");
    const ahora = new Date();
    ahora.setHours(8, 0, 0, 0);
    const isoFecha = ahora.toISOString().slice(0, 16);
    setFechaReapertura(isoFecha);
    setModalReabrir(true);
  };

  const confirmarReapertura = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ventas/${idVentaSeleccionada}/reabrir`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nota: notaReapertura,
            fecha_programada: fechaReapertura,
          }),
        }
      );

      if (!res.ok) throw new Error("No se pudo reabrir la venta");
      alert("Venta reabierta correctamente");
      setModalReabrir(false);
      buscarSeguimientos(vendedoraSeleccionada?.value || "");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const capitalizar = (texto) => {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };

  const obtenerVendedoras = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Error obteniendo vendedoras");
      const data = await res.json();
      const opciones = [
        { value: "", label: "Todas las vendedoras" },
        ...data.map((v) => ({ value: v.cedula_ruc, label: v.nombre })),
      ];
      setVendedoras(opciones);
      return opciones;
    } catch (err) {
      setError(err.message);
      return [];
    }
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

  const buscarSeguimientos = async (
    cedula_ruc = "",
    estado = filtroEstado,
    pagina = 1,
    seguimientoFiltro = filtroSeguimiento,
    nombre = busquedaNombre
  ) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      let url = `${import.meta.env.VITE_API_URL}/api/ventas/prospecciones?page=${pagina}&limit=${limitePorPagina}`;
      if (cedula_ruc) url += `&cedula_vendedora=${cedula_ruc}`;
      if (estado !== "todas") url += `&estado_prospeccion=${estado}`;
      if (seguimientoFiltro && seguimientoFiltro !== "todos") {
        url += `&seguimiento=${seguimientoFiltro}`;
      }
      if (nombre.trim()) url += `&nombre=${encodeURIComponent(nombre.trim())}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

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

  const handleVendedoraChange = (selectedOption) => {
    setVendedoraSeleccionada(selectedOption);
    const filtrosActualizados = {
      vendedoraSeleccionada: selectedOption,
      filtroEstado,
    };
    localStorage.setItem(
      "filtros_seguimientos_admin",
      JSON.stringify(filtrosActualizados)
    );
    buscarSeguimientos(
      selectedOption?.value || "",
      filtroEstado,
      1,
      filtroSeguimiento
    );
  };

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = `${import.meta.env.VITE_API_URL}/api/seguimientos/exportar?`;

      if (vendedoraSeleccionada && vendedoraSeleccionada.value) {
        url += `cedula_vendedora=${vendedoraSeleccionada.value}&`;
      }
      if (filtroEstado !== "todas") {
        url += `estado_prospeccion=${filtroEstado}&`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get("content-type");

      if (contentType?.includes("application/json")) {
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
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ventas/${idVentaSeleccionada}/objetivo`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ objetivo: nuevoObjetivo }),
        }
      );

      if (!res.ok) throw new Error("Error actualizando objetivo");
      alert("Objetivo actualizado correctamente");
      setModalEditar(false);
      buscarSeguimientos(vendedoraSeleccionada?.value || "");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const clasificarSeguimiento = (venta) => {
    const seguimientos = venta.seguimientos || [];
    if (seguimientos.length === 0) return "sin_seguimiento";

    const pendientes = seguimientos
      .filter((s) => s.estado === "pendiente")
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
      .filter((s) => s.estado === "realizado")
      .sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada));

    if (realizados.length > 0) {
      return "realizado";
    }

    return "sin_seguimiento";
  };

  const etiquetaSeguimiento = (venta) => {
    const clasificacion = clasificarSeguimiento(venta);

    switch (clasificacion) {
      case "vencido":
        return "🔴 Vencido";
      case "hoy":
        return "🟠 Hoy";
      case "proximo":
        return "🟡 Próximo";
      case "futuro":
        return "🟢 Futuro";
      case "realizado":
        return "✅ Realizado";
      case "sin_seguimiento":
      default:
        return "⚪ Sin seguimiento";
    }
  };

  const debouncedBuscar = useRef(
    debounce((nuevoNombre, filtrosActuales) => {
      setPaginaActual(1);
      buscarSeguimientos(
        filtrosActuales.vendedora,
        filtrosActuales.estado,
        1,
        filtrosActuales.seguimiento,
        nuevoNombre
      );
    }, 500)
  ).current;

  useEffect(() => {
    return () => {
      debouncedBuscar.cancel();
    };
  }, [debouncedBuscar]);

  const limpiarFiltros = () => {
    setVendedoraSeleccionada(null);
    setFiltroEstado("todas");
    setFiltroSeguimiento("todos");
    setBusquedaNombre("");
    localStorage.removeItem("filtros_seguimientos_admin");
    buscarSeguimientos("", "todas");
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "44px",
      borderRadius: "12px",
      borderColor: state.isFocused ? "#6c5ff0" : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(108, 95, 240, 0.12)" : "none",
      backgroundColor: "#f8fafc",
      "&:hover": {
        borderColor: "#cbd5e1",
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "12px",
      overflow: "hidden",
      border: "1px solid #e2e8f0",
      boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
      zIndex: 20,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#6c5ff0" : state.isFocused ? "#f5f3ff" : "#fff",
      color: state.isSelected ? "#fff" : "#334155",
      cursor: "pointer",
      fontSize: "13.5px",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#94a3b8",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#0f172a",
      fontWeight: 500,
    }),
  };

  return (
    <div className="seg-container">
      <div className="seg-header">
        <div>
          <h1 className="seg-title">Seguimientos de prospecciones</h1>
          <p className="seg-subtitle">
            Visualiza, filtra y administra el historial de seguimiento comercial.
          </p>
        </div>

        <div className="seg-header-actions">
          <button className="seg-btn seg-btn-secondary" onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <button className="seg-btn seg-btn-primary" onClick={exportarExcel}>
            Exportar a Excel
          </button>
        </div>
      </div>

      <div className="seg-card seg-filters-card">
        <div className="seg-card-head">
          <div>
            <h3>Filtros</h3>
            <p>Refina la búsqueda por vendedora, estado, seguimiento o nombre.</p>
          </div>
        </div>

        <div className="seg-filters-grid">
          <div className="seg-field">
            <label>Vendedora</label>
            <Select
              options={vendedoras}
              placeholder="Seleccionar vendedora"
              onChange={handleVendedoraChange}
              isClearable
              value={vendedoraSeleccionada}
              styles={selectStyles}
            />
          </div>

          <div className="seg-field">
            <label>Nombre del prospecto</label>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busquedaNombre}
              onChange={(e) => {
                const nuevoValor = e.target.value;
                setBusquedaNombre(nuevoValor);

                const filtrosActuales = {
                  vendedora: vendedoraSeleccionada?.value || "",
                  estado: filtroEstado,
                  seguimiento: filtroSeguimiento,
                };

                debouncedBuscar(nuevoValor, filtrosActuales);
              }}
              className="seg-input"
            />
          </div>

          <div className="seg-field">
            <label>Estado de prospección</label>
            <select
              className="seg-select"
              value={filtroEstado}
              onChange={(e) => {
                const nuevoEstado = e.target.value;
                setFiltroEstado(nuevoEstado);
                const filtrosActualizados = {
                  vendedoraSeleccionada,
                  filtroEstado: nuevoEstado,
                };
                localStorage.setItem(
                  "filtros_seguimientos_admin",
                  JSON.stringify(filtrosActualizados)
                );
                buscarSeguimientos(vendedoraSeleccionada?.value || "", nuevoEstado);
              }}
            >
              <option value="todas">Todas</option>
              <option value="abiertas">Abiertas</option>
              <option value="cerradas">Cerradas</option>
            </select>
          </div>

          <div className="seg-field">
            <label>Estado del seguimiento</label>
            <select
              className="seg-select"
              value={filtroSeguimiento}
              onChange={(e) => {
                const nuevoSeguimiento = e.target.value;
                setFiltroSeguimiento(nuevoSeguimiento);

                const filtrosActualizados = {
                  vendedoraSeleccionada,
                  filtroEstado,
                  busquedaNombre,
                  filtroSeguimiento: nuevoSeguimiento,
                };
                localStorage.setItem(
                  "filtros_seguimientos_admin",
                  JSON.stringify(filtrosActualizados)
                );

                buscarSeguimientos(
                  vendedoraSeleccionada?.value || "",
                  filtroEstado,
                  1,
                  nuevoSeguimiento
                );
              }}
            >
              <option value="todos">Todos</option>
              <option value="sin_seguimiento">Sin seguimiento</option>
              <option value="hoy">Hoy</option>
              <option value="vencido">Vencidos</option>
              <option value="proximo">Próximos</option>
              <option value="futuro">Futuros</option>
              <option value="realizado">Realizados</option>
            </select>
          </div>

          <div className="seg-field seg-field-actions">
            <label>&nbsp;</label>
            <button className="seg-btn seg-btn-secondary" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="seg-status seg-loading">Cargando...</div>}
      {error && <div className="seg-status seg-error">{error}</div>}

      <div className="seg-card">
        <div className="seg-card-head seg-card-head-inline">
          <div>
            <h3>Listado de seguimientos</h3>
            <p>Consulta el detalle de cada prospección y su siguiente acción.</p>
          </div>

          <div className="seg-pagination">
            {paginaActual > 1 && (
              <button
                className="seg-btn seg-btn-secondary seg-btn-sm"
                onClick={() =>
                  buscarSeguimientos(
                    vendedoraSeleccionada?.value || "",
                    filtroEstado,
                    paginaActual - 1,
                    filtroSeguimiento
                  )
                }
              >
                ← Anterior
              </button>
            )}

            <span className="seg-pagination-info">
              Página {paginaActual} de {totalPaginas}
            </span>

            {paginaActual < totalPaginas && (
              <button
                className="seg-btn seg-btn-secondary seg-btn-sm"
                onClick={() =>
                  buscarSeguimientos(
                    vendedoraSeleccionada?.value || "",
                    filtroEstado,
                    paginaActual + 1,
                    filtroSeguimiento
                  )
                }
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>

        <div className="seg-table-wrap">
          <table className="seg-table">
            <thead>
              <tr>
                <th>Prospecto</th>
                <th>Vendedora</th>
                <th>Objetivo</th>
                <th>Estado del prospecto</th>
                <th>Última fecha</th>
                <th>Último tipo</th>
                <th>Último resultado</th>
                <th>Última nota</th>
                <th>Acción</th>
                <th>Estado último seguimiento</th>
              </tr>
            </thead>
            <tbody>
              {!loading && prospecciones.length === 0 && (
                <tr>
                  <td colSpan="10" className="seg-empty-row">
                    No hay seguimientos para mostrar.
                  </td>
                </tr>
              )}

              {prospecciones.map((p) => {
                const tieneSeguimientos = p.seguimientos && p.seguimientos.length > 0;
                const ultimoSeguimiento = tieneSeguimientos ? p.seguimientos[0] : null;
                const siguienteSeguimiento = p.seguimientos
                  ?.filter((s) => s.estado === "pendiente")
                  .sort(
                    (a, b) =>
                      new Date(a.fecha_programada) - new Date(b.fecha_programada)
                  )[0];

                return (
                  <React.Fragment key={p.id_venta}>
                    <tr>
                      <td>
                        {p.prospecto?.nombre
                          ? p.prospecto.nombre.toUpperCase()
                          : "SIN PROSPECTO"}
                      </td>
                      <td>
                        {p.prospecto?.vendedora_prospecto
                          ? `${
                              p.prospecto?.vendedora_prospecto?.nombre
                                ? p.prospecto.vendedora_prospecto.nombre.toUpperCase()
                                : "Sin asignar"
                            }${
                              p.prospecto.vendedora_prospecto.estado === 0
                                ? " (INACTIVA)"
                                : ""
                            }`
                          : "Sin asignar"}
                      </td>
                      <td>
                        {p.objetivo
                          ? capitalizar(p.objetivo.toUpperCase())
                          : "SIN OBJETIVO"}
                      </td>
                      <td>
                        {p.estado_venta?.nombre === "Cierre de venta"
                          ? `Cierre de venta ($${p.monto_cierre?.toFixed(2) || "0.00"})`
                          : capitalizar(p.estado_venta?.nombre) || "No definido"}
                      </td>
                      <td>
                        {ultimoSeguimiento?.fecha_programada
                          ? new Date(
                              ultimoSeguimiento.fecha_programada
                            ).toLocaleDateString()
                          : "No hay"}
                      </td>
                      <td>
                        {ultimoSeguimiento?.tipo_seguimiento?.descripcion
                          ? ultimoSeguimiento.tipo_seguimiento.descripcion.toUpperCase()
                          : "NO REGISTRADO"}
                      </td>
                      <td>{ultimoSeguimiento?.resultado || "PENDIENTE"}</td>
                      <td>{ultimoSeguimiento?.nota || "SIN NOTA"}</td>
                      <td>
                        <div className="seg-actions">
                          {!tieneSeguimientos ? (
                            <button
                              className="seg-btn seg-btn-primary seg-btn-sm"
                              onClick={() =>
                                navigate(`/agendar-seguimiento/${p.id_venta}`)
                              }
                            >
                              Agendar primer seguimiento
                            </button>
                          ) : (
                            <button
                              className="seg-btn seg-btn-secondary seg-btn-sm"
                              onClick={() =>
                                navigate(`/seguimientos-prospeccion/${p.id_venta}`)
                              }
                            >
                              Ver seguimientos
                            </button>
                          )}

                          {p.prospecto?.id_prospecto && (
                            <button
                              className="seg-btn seg-btn-secondary seg-btn-sm"
                              onClick={() =>
                                navigate(
                                  `/seguimientos-prospecto/${p.prospecto.id_prospecto}#historial`
                                )
                              }
                              title="Ver historial del prospecto"
                            >
                              Historial
                            </button>
                          )}

                          {!esSoloLectura && (
                            <button
                              className="seg-btn-icon"
                              onClick={() => abrirModalEditar(p.id_venta, p.objetivo)}
                              title="Editar objetivo"
                            >
                              ✏️
                            </button>
                          )}

                          {!esSoloLectura &&
                            !p.abierta &&
                            p.estado_venta?.nombre === "Competencia" && (
                              <button
                                className="seg-btn seg-btn-danger seg-btn-sm"
                                onClick={() => abrirModalReabrir(p.id_venta)}
                              >
                                Reabrir
                              </button>
                            )}
                        </div>
                      </td>
                      <td>
                        <span className="seg-badge">{etiquetaSeguimiento(p)}</span>
                      </td>
                    </tr>

                    <tr className="seg-extra-row">
                      <td colSpan="10">
                        <div className="seg-next-info">
                          <strong>Siguiente fecha programada:</strong>{" "}
                          {siguienteSeguimiento
                            ? formatearFechaVisual(siguienteSeguimiento.fecha_programada)
                            : "No se ha agendado un seguimiento."}
                          {siguienteSeguimiento && (
                            <>
                              {" — "}
                              <strong>Motivo:</strong>{" "}
                              {siguienteSeguimiento.motivo || "Sin motivo"}
                            </>
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
      </div>

      <div className="seg-cards">
        {prospecciones.map((p) => {
          const tieneSeguimientos = p.seguimientos && p.seguimientos.length > 0;
          const ultimo = tieneSeguimientos ? p.seguimientos[0] : null;
          const siguienteSeguimiento = p.seguimientos
            ?.filter((s) => s.estado === "pendiente")
            .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

          return (
            <div className="seg-mobile-card" key={p.id_venta}>
              <div className="seg-mobile-card-head">
                <h3>{p.prospecto?.nombre || "Sin Prospecto"}</h3>
                <span className="seg-badge">{etiquetaSeguimiento(p)}</span>
              </div>

              <div className="seg-mobile-grid">
                <p>
                  <strong>Vendedora:</strong>{" "}
                  {p.prospecto?.vendedora_prospecto
                    ? `${p.prospecto.vendedora_prospecto.nombre}${
                        p.prospecto.vendedora_prospecto.estado === 0
                          ? " (INACTIVA)"
                          : ""
                      }`
                    : "Sin asignar"}
                </p>
                <p>
                  <strong>Objetivo:</strong> {p.objetivo || "No definido"}
                </p>
                <p>
                  <strong>Estado del Prospecto:</strong>{" "}
                  {capitalizar(p.estado_venta?.nombre) || "No definido"}
                </p>
                <p>
                  <strong>Última Fecha:</strong>{" "}
                  {ultimo?.fecha_programada
                    ? new Date(ultimo.fecha_programada).toLocaleDateString()
                    : "No hay"}
                </p>
                <p>
                  <strong>Tipo:</strong>{" "}
                  {ultimo?.tipo_seguimiento?.descripcion || "No registrado"}
                </p>
                <p>
                  <strong>Resultado:</strong> {ultimo?.resultado || "Pendiente"}
                </p>
                <p>
                  <strong>Nota:</strong> {ultimo?.nota || "Sin nota"}
                </p>
              </div>

              <div className="seg-next-info seg-next-info-mobile">
                <strong>Siguiente fecha programada:</strong>{" "}
                {siguienteSeguimiento
                  ? formatearFechaVisual(siguienteSeguimiento.fecha_programada)
                  : "No se ha agendado un seguimiento."}
                {siguienteSeguimiento && (
                  <>
                    {" — "}
                    <strong>Motivo:</strong>{" "}
                    {siguienteSeguimiento.motivo || "Sin motivo"}
                  </>
                )}
              </div>

              <div className="seg-actions seg-actions-mobile">
                {!tieneSeguimientos ? (
                  <button
                    className="seg-btn seg-btn-primary seg-btn-sm"
                    onClick={() => navigate(`/agendar-seguimiento/${p.id_venta}`)}
                  >
                    Agendar
                  </button>
                ) : (
                  <button
                    className="seg-btn seg-btn-secondary seg-btn-sm"
                    onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}
                  >
                    Ver
                  </button>
                )}

                {p.prospecto?.id_prospecto && (
                  <button
                    className="seg-btn seg-btn-secondary seg-btn-sm"
                    onClick={() =>
                      navigate(`/seguimientos-prospecto/${p.prospecto.id_prospecto}#historial`)
                    }
                    title="Ver historial del prospecto"
                  >
                    Historial
                  </button>
                )}

                {!esSoloLectura && (
                  <button
                    className="seg-btn-icon"
                    onClick={() => abrirModalEditar(p.id_venta, p.objetivo)}
                  >
                    ✏️
                  </button>
                )}

                {!esSoloLectura &&
                  !p.abierta &&
                  p.estado_venta?.nombre === "Competencia" && (
                    <button
                      className="seg-btn seg-btn-danger seg-btn-sm"
                      onClick={() => abrirModalReabrir(p.id_venta)}
                    >
                      Reabrir
                    </button>
                  )}
              </div>
            </div>
          );
        })}

        {!loading && prospecciones.length === 0 && (
          <p className="seg-empty-mobile">No hay seguimientos para mostrar.</p>
        )}
      </div>

      {modalEditar && (
        <div className="seg-modal-overlay">
          <div className="seg-modal">
            <div className="seg-modal-head">
              <h3>Editar objetivo</h3>
            </div>
            <textarea
              className="seg-textarea"
              value={nuevoObjetivo}
              onChange={(e) => setNuevoObjetivo(e.target.value)}
            />
            <div className="seg-modal-actions">
              <button className="seg-btn seg-btn-primary" onClick={guardarObjetivo}>
                Guardar
              </button>
              <button
                className="seg-btn seg-btn-secondary"
                onClick={() => setModalEditar(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalReabrir && (
        <div className="seg-modal-overlay">
          <div className="seg-modal">
            <div className="seg-modal-head">
              <h3>Reabrir venta</h3>
            </div>

            <div className="seg-field">
              <label>Fecha del nuevo seguimiento</label>
              <input
                className="seg-input"
                type="datetime-local"
                value={fechaReapertura}
                onChange={(e) => setFechaReapertura(e.target.value)}
                readOnly
              />
            </div>

            <div className="seg-field">
              <label>Nota o motivo</label>
              <textarea
                className="seg-textarea"
                value={notaReapertura}
                onChange={(e) => setNotaReapertura(e.target.value)}
              />
            </div>

            <div className="seg-modal-actions">
              <button
                className="seg-btn seg-btn-danger"
                onClick={confirmarReapertura}
              >
                Confirmar
              </button>
              <button
                className="seg-btn seg-btn-secondary"
                onClick={() => setModalReabrir(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeguimientosAdmin;