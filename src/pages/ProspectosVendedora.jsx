import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { obtenerCedulaDesdeToken } from "../utils/auth";
import { debounce } from "lodash";
import "../styles/prospectosVendedora3.css";

const ProspectosVendedora = () => {
  const navigate = useNavigate();
  const [cedulaVendedora, setCedulaVendedora] = useState(null);
  const [prospectos, setProspectos] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [busquedaInput, setBusquedaInput] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaInicioDefecto, setFechaInicioDefecto] = useState("");
  const [fechaFinDefecto, setFechaFinDefecto] = useState("");

  const [sectorFiltro, setSectorFiltro] = useState(null);
  const [estados, setEstados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [ciudadFiltro, setCiudadFiltro] = useState(null);
  const [provinciaFiltro, setProvinciaFiltro] = useState(null);

  const [filtrosInicializados, setFiltrosInicializados] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [orden, setOrden] = useState("");

  const debouncedBuscar = useRef(
    debounce((valor) => {
      setPaginaActual(1);
      setBusquedaNombre(valor);
    }, 500)
  ).current;

  useEffect(() => {
    const cedula = obtenerCedulaDesdeToken();
    setCedulaVendedora(cedula);
    establecerFechasUltimos3Meses();

    const filtrosGuardados = localStorage.getItem("filtros_prospectos_vendedora");
    const filtrosParsed = filtrosGuardados ? JSON.parse(filtrosGuardados) : null;

    const cargarFiltros = async () => {
      await Promise.all([
        obtenerSectores(),
        obtenerEstados(),
        obtenerCategorias(),
        obtenerCiudades(),
        obtenerProvincias(),
      ]);

      if (filtrosParsed) {
        if (filtrosParsed.estadoFiltro) setEstadoFiltro(filtrosParsed.estadoFiltro);
        if (filtrosParsed.fechaInicio) setFechaInicio(filtrosParsed.fechaInicio);
        if (filtrosParsed.fechaFin) setFechaFin(filtrosParsed.fechaFin);
        if (filtrosParsed.sectorFiltro) setSectorFiltro(filtrosParsed.sectorFiltro);
        if (filtrosParsed.busquedaNombre) {
          setBusquedaNombre(filtrosParsed.busquedaNombre);
          setBusquedaInput(filtrosParsed.busquedaNombre);
        }
        if (filtrosParsed.ciudadFiltro) setCiudadFiltro(filtrosParsed.ciudadFiltro);
        if (filtrosParsed.provinciaFiltro) setProvinciaFiltro(filtrosParsed.provinciaFiltro);
        if (filtrosParsed.categoriaFiltro) setCategoriaFiltro(filtrosParsed.categoriaFiltro);
        if (filtrosParsed.orden) setOrden(filtrosParsed.orden);
      }

      setFiltrosInicializados(true);
    };

    cargarFiltros();
  }, []);

  useEffect(() => {
    if (!filtrosInicializados) return;

    const filtros = {
      estadoFiltro,
      fechaInicio,
      fechaFin,
      sectorFiltro,
      busquedaNombre,
      ciudadFiltro,
      provinciaFiltro,
      categoriaFiltro,
      orden,
    };

    localStorage.setItem("filtros_prospectos_vendedora", JSON.stringify(filtros));
  }, [
    estadoFiltro,
    fechaInicio,
    fechaFin,
    sectorFiltro,
    busquedaNombre,
    ciudadFiltro,
    provinciaFiltro,
    categoriaFiltro,
    orden,
    filtrosInicializados,
  ]);

  const obtenerCategorias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`);
      if (!res.ok) throw new Error("Error cargando categorías");
      const data = await res.json();
      setCategorias(data.map((c) => ({ value: c.id_categoria, label: c.nombre })));
    } catch (err) {
      console.error(err);
    }
  };

  const obtenerCiudades = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/ciudades`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCiudades(data.map((c) => ({ value: c, label: c })));
    } catch (err) {
      console.error(err);
    }
  };

  const obtenerProvincias = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/provincias`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProvincias(data.map((p) => ({ value: p, label: p })));
    } catch (err) {
      console.error(err);
    }
  };

  const obtenerEstados = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/estados`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("La respuesta no es una lista de estados");
      }

      const opciones = data.map((e) => ({
        value: e.id_estado,
        label: e.nombre.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      }));
      setEstados(opciones);
    } catch (err) {
      console.error("Error cargando estados:", err);
      setError("No se pudieron cargar los estados");
    }
  };

  const establecerFechasUltimos3Meses = () => {
    const hoy = new Date();
    const fin = hoy.toISOString().split("T")[0];

    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - 3);
    const inicioFormateado = inicio.toISOString().split("T")[0];

    setFechaInicio(inicioFormateado);
    setFechaFin(fin);
    setFechaInicioDefecto(inicioFormateado);
    setFechaFinDefecto(fin);
  };

  useEffect(() => {
    if (!filtrosInicializados || !cedulaVendedora || !fechaInicio || !fechaFin) return;
    buscarProspectos();
  }, [
    filtrosInicializados,
    cedulaVendedora,
    estadoFiltro,
    fechaInicio,
    fechaFin,
    sectorFiltro,
    categoriaFiltro,
    ciudadFiltro,
    provinciaFiltro,
    busquedaNombre,
    paginaActual,
    orden,
  ]);

  const obtenerSectores = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/sectores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error obteniendo sectores");
      const data = await res.json();
      setSectores(data.map((s) => ({ value: s, label: s })));
    } catch (err) {
      console.error("Error obteniendo sectores:", err);
    }
  };

  const buscarProspectos = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", paginaActual);
      params.append("limit", 10);
      params.append("cedula_vendedora", cedulaVendedora);

      if (estadoFiltro.length > 0) {
        estadoFiltro.forEach((estado) => params.append("estado", estado.value));
      }
      if (fechaInicio) params.append("fechaInicio", fechaInicio);
      if (fechaFin) params.append("fechaFin", fechaFin);
      if (sectorFiltro) params.append("sector", sectorFiltro.value);
      if (categoriaFiltro) params.append("id_categoria", categoriaFiltro.value);
      if (ciudadFiltro) params.append("ciudad", ciudadFiltro);
      if (provinciaFiltro) params.append("provincia", provinciaFiltro);
      if (orden) params.append("orden", orden);
      if (busquedaNombre.trim()) params.append("nombre", busquedaNombre.trim());

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error obteniendo prospectos");
      const data = await res.json();

      setProspectos(data.prospectos || []);
      setTotalPaginas(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem("token");

      let url = `${import.meta.env.VITE_API_URL}/api/prospectos/exportar?cedula_vendedora=${cedulaVendedora}`;

      if (estadoFiltro.length > 0) {
        estadoFiltro.forEach((estado) => {
          url += `&estado=${estado.value}`;
        });
      }
      if (categoriaFiltro) url += `&id_categoria=${categoriaFiltro.value}`;
      if (fechaInicio) url += `&fechaInicio=${fechaInicio}`;
      if (fechaFin) url += `&fechaFin=${fechaFin}`;
      if (sectorFiltro) url += `&sector=${sectorFiltro.value}`;
      if (ciudadFiltro) url += `&ciudad=${encodeURIComponent(ciudadFiltro)}`;
      if (provinciaFiltro) url += `&provincia=${encodeURIComponent(provinciaFiltro)}`;
      if (orden) url += `&orden=${orden}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        alert(data.message);
        return;
      }

      if (!res.ok) throw new Error("Error al exportar prospectos");

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "mis_prospectos.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al exportar:", error);
    }
  };

  const limpiarFiltros = () => {
    setEstadoFiltro([]);
    setSectorFiltro(null);
    setCategoriaFiltro(null);
    setCiudadFiltro(null);
    setProvinciaFiltro(null);
    establecerFechasUltimos3Meses();
    setPaginaActual(1);
    setBusquedaNombre("");
    setBusquedaInput("");
    setOrden("");
    localStorage.removeItem("filtros_prospectos_vendedora");
  };

  useEffect(() => {
    return () => {
      debouncedBuscar.cancel();
    };
  }, [debouncedBuscar]);

  const estadoCierre = estados.find((e) => e.label.toLowerCase() === "cierre de venta");

  const mostrarEstado = (venta) => {
    if (!venta) return "Sin estado";
    if (venta.id_estado === estadoCierre?.value && venta.monto_cierre) {
      return `Ganado ($${parseFloat(venta.monto_cierre).toFixed(2)})`;
    }
    return estados.find((e) => e.value === venta.id_estado)?.label || "Sin estado";
  };

  const hayFiltrosActivos = () => {
    return (
      estadoFiltro.length > 0 ||
      sectorFiltro ||
      categoriaFiltro ||
      ciudadFiltro ||
      provinciaFiltro ||
      busquedaNombre.trim() !== "" ||
      orden ||
      fechaInicio !== fechaInicioDefecto ||
      fechaFin !== fechaFinDefecto
    );
  };

  const rsStyles = {
    control: (b, s) => ({
      ...b,
      background: "#fff",
      borderColor: s.isFocused ? "#6c5ff0" : "#e2e8f0",
      boxShadow: s.isFocused ? "0 0 0 3px rgba(108,95,240,0.12)" : "none",
      borderRadius: "8px",
      minHeight: "38px",
      fontSize: "13px",
      "&:hover": { borderColor: "#c4b5fd" },
    }),
    menu: (b) => ({
      ...b,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
      zIndex: 999,
    }),
    option: (b, s) => ({
      ...b,
      background: s.isSelected ? "#6c5ff0" : s.isFocused ? "#f5f3ff" : "#fff",
      color: s.isSelected ? "#fff" : "#334155",
      fontSize: "13px",
    }),
    multiValue: (b) => ({
      ...b,
      background: "#ede9fe",
      borderRadius: "6px",
    }),
    multiValueLabel: (b) => ({
      ...b,
      color: "#5b21b6",
      fontSize: "12px",
      fontWeight: 600,
    }),
    multiValueRemove: (b) => ({
      ...b,
      color: "#7c3aed",
      "&:hover": { background: "#ddd6fe", color: "#4c1d95" },
    }),
    placeholder: (b) => ({
      ...b,
      color: "#94a3b8",
      fontSize: "13px",
    }),
    singleValue: (b) => ({
      ...b,
      color: "#334155",
      fontSize: "13px",
    }),
  };

  return (
    <div className="pv2-container">
      <div className="pv2-header">
        <div className="pv2-header-left">
          <div className="pv2-header-text">
            <h1 className="pv2-title">Mis Prospectos</h1>
            <p className="pv2-subtitle">
              Gestión y seguimiento de tus oportunidades comerciales
            </p>
          </div>
        </div>

        <div className="pv2-header-actions">
          <button className="pv2-btn-ghost" onClick={exportarExcel}>
            Exportar
          </button>
          <button
            className="pv2-btn-primary"
            onClick={() => navigate("/crear-prospecto")}
          >
            Nuevo Prospecto
          </button>
        </div>
      </div>

      {error && <div className="pv2-alert-error">{error}</div>}

      <div className="pv2-search-row">
        <div className="pv2-search-left">
          <div className="pv2-search-wrap">
            <svg
              className="pv2-search-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="pv2-input pv2-search-input"
              placeholder="Buscar prospecto..."
              value={busquedaInput}
              onChange={(e) => {
                setBusquedaInput(e.target.value);
                debouncedBuscar(e.target.value);
              }}
            />
          </div>

          <select
            className="pv2-select"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
          >
            <option value="">Fecha de creación</option>
            <option value="proximo_contacto">Próximo contacto</option>
          </select>
        </div>

        <button
          className={`pv2-btn-filter ${mostrarFiltros ? "active" : ""}`}
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
        >
          Filtros
          {hayFiltrosActivos() && <span className="pv2-filter-dot" />}
        </button>
      </div>

      {mostrarFiltros && (
        <div className="pv2-filters-panel">
          <div className="pv2-filters-grid">
            <div className="pv2-filter-item">
              <label>Estado(s)</label>
              <Select
                options={estados}
                isMulti
                styles={rsStyles}
                placeholder="Todos"
                value={estadoFiltro}
                onChange={(ops) => {
                  setEstadoFiltro(ops || []);
                  setPaginaActual(1);
                }}
              />
            </div>

            <div className="pv2-filter-item">
              <label>Categoría</label>
              <Select
                options={categorias}
                styles={rsStyles}
                placeholder="Todas"
                value={categoriaFiltro}
                onChange={(op) => {
                  setCategoriaFiltro(op);
                  setPaginaActual(1);
                }}
                isClearable
              />
            </div>

            <div className="pv2-filter-item">
              <label>Sector</label>
              <Select
                options={sectores}
                styles={rsStyles}
                placeholder="Todos"
                value={sectorFiltro}
                onChange={(op) => {
                  setSectorFiltro(op);
                  setPaginaActual(1);
                }}
                isClearable
              />
            </div>

            <div className="pv2-filter-item">
              <label>Ciudad</label>
              <Select
                options={ciudades}
                styles={rsStyles}
                placeholder="Todas"
                value={ciudades.find((c) => c.value === ciudadFiltro) || null}
                onChange={(op) => {
                  setCiudadFiltro(op ? op.value : null);
                  setPaginaActual(1);
                }}
                isClearable
              />
            </div>

            <div className="pv2-filter-item">
              <label>Provincia</label>
              <Select
                options={provincias}
                styles={rsStyles}
                placeholder="Todas"
                value={provincias.find((p) => p.value === provinciaFiltro) || null}
                onChange={(op) => {
                  setProvinciaFiltro(op ? op.value : null);
                  setPaginaActual(1);
                }}
                isClearable
              />
            </div>

            <div className="pv2-filter-item">
              <label>Desde</label>
              <input
                type="date"
                className="pv2-input"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setPaginaActual(1);
                }}
              />
            </div>

            <div className="pv2-filter-item">
              <label>Hasta</label>
              <input
                type="date"
                className="pv2-input"
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value);
                  setPaginaActual(1);
                }}
              />
            </div>
          </div>

          <div className="pv2-filters-footer">
            <button className="pv2-btn-ghost" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      <div className="pv2-card">
        <div className="pv2-pagination">
          <span className="pv2-pagination-info">
            Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
          </span>

          <div className="pv2-pagination-btns">
            <button
              className="pv2-page-btn"
              disabled={paginaActual <= 1}
              onClick={() => setPaginaActual((p) => p - 1)}
            >
              ‹
            </button>
            <button
              className="pv2-page-btn"
              disabled={paginaActual >= totalPaginas}
              onClick={() => setPaginaActual((p) => p + 1)}
            >
              ›
            </button>
          </div>
        </div>

        {loading ? (
          <div className="pv2-loading">
            <div className="pv2-spinner" />
            <span>Cargando prospectos...</span>
          </div>
        ) : (
          <>
            <div className="pv2-table-wrap">
              <table className="pv2-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Prospecto</th>
                    <th>Objetivo</th>
                    <th># Empleados</th>
                    <th>Estado</th>
                    <th>Próx. Contacto</th>
                    <th>Última Nota</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {prospectos.length === 0 && (
                    <tr>
                      <td colSpan="8" className="pv2-empty">
                        <div className="pv2-empty-inner">
                          <p>No se encontraron prospectos</p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {prospectos.flatMap((p, index) =>
                    p.ventas.length > 0
                      ? p.ventas.map((venta) => {
                          const ultimaNota =
                            venta.seguimientos
                              ?.sort(
                                (a, b) =>
                                  new Date(b.fecha_programada) -
                                  new Date(a.fecha_programada)
                              )[0]?.nota ?? "Sin nota";

                          const proximoContacto = venta.seguimientos
                            ?.filter((s) => s.estado === "pendiente")
                            .sort(
                              (a, b) =>
                                new Date(a.fecha_programada) -
                                new Date(b.fecha_programada)
                            )[0]?.fecha_programada;

                          const proximoContactoFormateado = proximoContacto
                            ? new Date(proximoContacto).toLocaleDateString("es-EC")
                            : null;

                          const estadoTexto = mostrarEstado(venta);
                          const esGanado = estadoTexto.toLowerCase().includes("ganado");

                          return (
                            <tr key={`${p.id_prospecto}-${venta.id_venta}`}>
                              <td className="pv2-td-num">
                                {(paginaActual - 1) * 10 + index + 1}
                              </td>
                              <td className="pv2-td-name">{p.nombre}</td>
                              <td>{venta.objetivo || <span className="pv2-muted">Sin objetivo</span>}</td>
                              <td>{p.empleados ?? "No registrado"}</td>
                              <td>
                                <span
                                  className={`pv2-badge ${
                                    esGanado ? "pv2-badge-green" : "pv2-badge-blue"
                                  }`}
                                >
                                  {estadoTexto}
                                </span>
                              </td>
                              <td>
                                {proximoContactoFormateado ? (
                                  <span className="pv2-date">{proximoContactoFormateado}</span>
                                ) : (
                                  <span className="pv2-muted">Sin programar</span>
                                )}
                              </td>
                              <td className="pv2-td-note">{ultimaNota}</td>
                              <td className="pv2-td-actions">
                                <button
                                  className="pv2-icon-btn pv2-icon-btn--view"
                                  onClick={() =>
                                    navigate(`/seguimientos-prospecto/${p.id_prospecto}`)
                                  }
                                  title="Ver seguimientos"
                                >
                                  Ver
                                </button>
                                <button
                                  className="pv2-icon-btn"
                                  onClick={() =>
                                    navigate(
                                      `/seguimientos-prospecto/${p.id_prospecto}#historial`
                                    )
                                  }
                                  title="Historial"
                                >
                                  Historial
                                </button>
                                <button
                                  className="pv2-icon-btn"
                                  onClick={() =>
                                    navigate(`/editar-prospecto/${p.id_prospecto}`)
                                  }
                                  title="Ver información"
                                >
                                  Editar
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      : [
                          <tr key={`solo-${p.id_prospecto}`}>
                            <td className="pv2-td-num">
                              {(paginaActual - 1) * 10 + index + 1}
                            </td>
                            <td className="pv2-td-name">{p.nombre}</td>
                            <td><span className="pv2-muted">Sin objetivo</span></td>
                            <td>{p.empleados ?? "No registrado"}</td>
                            <td>
                              <span className="pv2-badge pv2-badge-gray">Sin estado</span>
                            </td>
                            <td><span className="pv2-muted">Sin programar</span></td>
                            <td className="pv2-td-note">
                              <span className="pv2-muted">Sin nota</span>
                            </td>
                            <td className="pv2-td-actions">
                              <button
                                className="pv2-icon-btn pv2-icon-btn--add"
                                onClick={() => navigate(`/abrir-venta/${p.id_prospecto}`)}
                                title="Abrir prospección"
                              >
                                Abrir
                              </button>
                              <button
                                className="pv2-icon-btn"
                                onClick={() =>
                                  navigate(
                                    `/seguimientos-prospecto/${p.id_prospecto}#historial`
                                  )
                                }
                                title="Historial"
                              >
                                Historial
                              </button>
                              <button
                                className="pv2-icon-btn"
                                onClick={() =>
                                  navigate(`/editar-prospecto/${p.id_prospecto}`)
                                }
                                title="Ver información"
                              >
                                Editar
                              </button>
                            </td>
                          </tr>,
                        ]
                  )}
                </tbody>
              </table>
            </div>

            <div className="pv2-mobile-view">
              {prospectos.length === 0 && (
                <div className="pv2-empty">
                  <p>No se encontraron prospectos.</p>
                </div>
              )}

              {prospectos.flatMap((p) => {
                if (!p.ventas || p.ventas.length === 0) {
                  return (
                    <div className="pv2-mc" key={`solo-${p.id_prospecto}`}>
                      <div className="pv2-mc-head">
                        <span className="pv2-mc-name">{p.nombre}</span>
                        <span className="pv2-badge pv2-badge-gray">Sin estado</span>
                      </div>
                      <p className="pv2-mc-meta">Empleados: {p.empleados ?? "No registrado"}</p>
                      <div className="pv2-mc-actions">
                        <button
                          className="pv2-btn-ghost pv2-btn-sm"
                          onClick={() => navigate(`/abrir-venta/${p.id_prospecto}`)}
                        >
                          Abrir
                        </button>
                        <button
                          className="pv2-btn-ghost pv2-btn-sm"
                          onClick={() =>
                            navigate(`/seguimientos-prospecto/${p.id_prospecto}#historial`)
                          }
                        >
                          Historial
                        </button>
                        <button
                          className="pv2-btn-ghost pv2-btn-sm"
                          onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  );
                }

                return p.ventas.map((venta) => {
                  const proximoContacto = venta.seguimientos
                    ?.filter((s) => s.estado === "pendiente")
                    .sort(
                      (a, b) =>
                        new Date(a.fecha_programada) - new Date(b.fecha_programada)
                    )[0]?.fecha_programada;

                  const proximoContactoFormateado = proximoContacto
                    ? new Date(proximoContacto).toLocaleDateString("es-EC")
                    : "Sin programar";

                  const estadoTexto = mostrarEstado(venta);
                  const esGanado = estadoTexto.toLowerCase().includes("ganado");

                  return (
                    <div className="pv2-mc" key={`v-${p.id_prospecto}-${venta.id_venta}`}>
                      <div className="pv2-mc-head">
                        <span className="pv2-mc-name">{p.nombre}</span>
                        <span
                          className={`pv2-badge ${
                            esGanado ? "pv2-badge-green" : "pv2-badge-blue"
                          }`}
                        >
                          {estadoTexto}
                        </span>
                      </div>
                      <p className="pv2-mc-meta">Objetivo: {venta.objetivo || "—"}</p>
                      <p className="pv2-mc-meta">Empleados: {p.empleados ?? "No registrado"}</p>
                      <p className="pv2-mc-meta">Próximo: {proximoContactoFormateado}</p>
                      <div className="pv2-mc-actions">
                        <button
                          className="pv2-btn-ghost pv2-btn-sm"
                          onClick={() => navigate(`/seguimientos-prospecto/${p.id_prospecto}`)}
                        >
                          Ver
                        </button>
                        <button
                          className="pv2-btn-ghost pv2-btn-sm"
                          onClick={() =>
                            navigate(`/seguimientos-prospecto/${p.id_prospecto}#historial`)
                          }
                        >
                          Historial
                        </button>
                        <button
                          className="pv2-btn-ghost pv2-btn-sm"
                          onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProspectosVendedora;