  import { useState, useEffect, useRef } from "react";
  import Select from "react-select";
  import { useNavigate } from "react-router-dom";
  import { debounce } from "lodash";
  import { getRol } from "../utils/auth";
  import "../styles/prospectosAdmin1.css";

  const ProspectosAdmin = () => {
    const navigate = useNavigate();
    const rol = getRol();
    const esSoloLectura = rol === "lectura";

    const [prospectos, setProspectos] = useState([]);
    const [vendedoras, setVendedoras] = useState([]);
    const [sectores, setSectores] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [estados, setEstados] = useState([]);
    const [ciudades, setCiudades] = useState([]);
    const [provincias, setProvincias] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [cedulaVendedora, setCedulaVendedora] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState([]);
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [fechaInicioDefecto, setFechaInicioDefecto] = useState("");
    const [fechaFinDefecto, setFechaFinDefecto] = useState("");
    const [sectorFiltro, setSectorFiltro] = useState(null);
    const [categoriaFiltro, setCategoriaFiltro] = useState(null);
    const [ciudadFiltro, setCiudadFiltro] = useState("");
    const [provinciaFiltro, setProvinciaFiltro] = useState("");

    const [busquedaNombre, setBusquedaNombre] = useState("");
    const [busquedaInput, setBusquedaInput] = useState("");
    const [orden, setOrden] = useState("");

    const [filtrosInicializados, setFiltrosInicializados] = useState(false);
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const debouncedBuscar = useRef(
      debounce((valor) => { setPaginaActual(1); setBusquedaNombre(valor); }, 500)
    ).current;

    const hayFiltrosActivos = () =>
      cedulaVendedora || estadoFiltro.length > 0 || sectorFiltro || categoriaFiltro ||
      ciudadFiltro || provinciaFiltro || busquedaNombre.trim() !== "" || orden ||
      fechaInicio !== fechaInicioDefecto || fechaFin !== fechaFinDefecto;

    useEffect(() => {
      obtenerVendedoras(); obtenerSectores(); obtenerCategorias();
      obtenerEstados(); obtenerCiudades(); obtenerProvincias();
      establecerFechasUltimos3Meses();
    }, []);

    useEffect(() => {
      const filtrosGuardados = localStorage.getItem("filtros_prospectos_admin");
      if (filtrosGuardados) {
        try {
          const f = JSON.parse(filtrosGuardados);
          if (f.cedulaVendedora) setCedulaVendedora(f.cedulaVendedora);
          if (f.fechaInicio) setFechaInicio(f.fechaInicio);
          if (f.fechaFin) setFechaFin(f.fechaFin);
          if (f.orden) setOrden(f.orden);
          if (f.ciudadFiltro) setCiudadFiltro(f.ciudadFiltro);
          if (f.provinciaFiltro) setProvinciaFiltro(f.provinciaFiltro);
          if (f.busquedaNombre) { setBusquedaNombre(f.busquedaNombre); setBusquedaInput(f.busquedaNombre); }
          setEstadoFiltro(f.estadoFiltro || []);
          setCategoriaFiltro(f.categoriaFiltro || null);
          setSectorFiltro(f.sectorFiltro || null);
        } catch (e) { console.error("Error parsear filtros:", e); }
      }
      setFiltrosInicializados(true);
    }, []);

    const obtenerDatosGenericos = async (endpoint, setter, formateador) => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        setter(formateador ? formateador(data) : data);
      } catch (err) { console.error(`Error cargando ${endpoint}:`, err); }
    };

    const obtenerCiudades   = () => obtenerDatosGenericos("/api/prospectos/ciudades",   setCiudades,   (d) => d.map(c => ({ value: c, label: c })));
    const obtenerProvincias = () => obtenerDatosGenericos("/api/prospectos/provincias", setProvincias, (d) => d.map(p => ({ value: p, label: p })));
    const obtenerSectores   = () => obtenerDatosGenericos("/api/prospectos/sectores",   setSectores,   (d) => d.map(s => ({ value: s, label: s })));
    const obtenerVendedoras = () => obtenerDatosGenericos("/api/usuarios/vendedoras",   setVendedoras);

    const obtenerEstados = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/estados`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        if (Array.isArray(data))
          setEstados(data.map(e => ({ value: e.id_estado, label: e.nombre.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) })));
      } catch (err) { console.error("Error cargando estados:", err); }
    };

    const obtenerCategorias = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`);
        const data = await res.json();
        const opciones = data.map(c => ({ value: c.id_categoria, label: c.nombre }));
        opciones.unshift({ value: "sin_categoria", label: "Sin Categoría" });
        setCategorias(opciones);
      } catch (err) { console.error("Error cargando categorías:", err); }
    };

    const establecerFechasUltimos3Meses = () => {
      const hoy = new Date();
      const fin = hoy.toISOString().split("T")[0];
      const inicio = new Date();
      inicio.setMonth(inicio.getMonth() - 3);
      const inicioFormateado = inicio.toISOString().split("T")[0];
      setFechaInicio(inicioFormateado); setFechaFin(fin);
      setFechaInicioDefecto(inicioFormateado); setFechaFinDefecto(fin);
    };

    useEffect(() => {
      if (filtrosInicializados && fechaInicio && fechaFin) buscarProspectos();
    }, [cedulaVendedora, estadoFiltro, fechaInicio, fechaFin, sectorFiltro, categoriaFiltro,
        ciudadFiltro, provinciaFiltro, filtrosInicializados, paginaActual, busquedaNombre, orden]);

    useEffect(() => {
      if (!filtrosInicializados) return;
      const filtros = { cedulaVendedora, estadoFiltro, fechaInicio, fechaFin, sectorFiltro, categoriaFiltro, ciudadFiltro, provinciaFiltro, busquedaNombre, orden };
      localStorage.setItem("filtros_prospectos_admin", JSON.stringify(filtros));
    }, [cedulaVendedora, estadoFiltro, fechaInicio, fechaFin, sectorFiltro, categoriaFiltro, ciudadFiltro, provinciaFiltro, busquedaNombre, orden, filtrosInicializados]);

    const buscarProspectos = async () => {
      try {
        setLoading(true); setError("");
        const params = new URLSearchParams();
        params.append("page", paginaActual); params.append("limit", 10);
        if (cedulaVendedora) params.append("cedula_vendedora", cedulaVendedora);
        if (estadoFiltro.length > 0) estadoFiltro.forEach(e => params.append("estado", e.value));
        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);
        if (sectorFiltro) params.append("sector", sectorFiltro.value);
        if (categoriaFiltro) {
          if (categoriaFiltro.value === "sin_categoria") params.append("sin_categoria", "true");
          else params.append("id_categoria", categoriaFiltro.value);
        }
        if (ciudadFiltro) params.append("ciudad", ciudadFiltro);
        if (provinciaFiltro) params.append("provincia", provinciaFiltro);
        if (busquedaNombre.trim()) params.append("nombre", busquedaNombre);
        if (orden) params.append("orden", orden);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos?${params}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.ok) throw new Error("Error obteniendo prospectos");
        const data = await res.json();
        setProspectos(data.prospectos || []);
        setTotalPaginas(data.totalPages || 1);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };

    const eliminarProspecto = async (id) => {
      const razon = prompt("¿Por qué deseas eliminar este prospecto?");
      if (!razon || razon.trim().length < 3) return alert("Debes ingresar una razón válida.");
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/${id}/eliminar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ razon }),
        });
        if (!res.ok) { const d = await res.json(); return alert(d.message || "Error eliminando"); }
        setProspectos(prev => prev.filter(p => p.id_prospecto !== id));
        alert("✅ Prospecto eliminado correctamente.");
      } catch (err) { setError(err.message); }
    };

    const exportarExcel = async () => {
      try {
        let url = `${import.meta.env.VITE_API_URL}/api/prospectos/exportar?`;
        if (cedulaVendedora) url += `cedula_vendedora=${cedulaVendedora}&`;
        if (estadoFiltro.length > 0) estadoFiltro.forEach(e => url += `estado=${e.value}&`);
        if (categoriaFiltro) url += `id_categoria=${categoriaFiltro.value}&`;
        if (fechaInicio) url += `fechaInicio=${fechaInicio}&`;
        if (fechaFin) url += `fechaFin=${fechaFin}&`;
        if (sectorFiltro) url += `sector=${sectorFiltro.value}&`;
        if (ciudadFiltro) url += `ciudad=${encodeURIComponent(ciudadFiltro)}&`;
        if (provinciaFiltro) url += `provincia=${encodeURIComponent(provinciaFiltro)}&`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
        if (res.headers.get("content-type")?.includes("application/json")) {
          const d = await res.json(); return alert(d.message);
        }
        if (!res.ok) throw new Error("Error al exportar");
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = "prospectos.xlsx";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      } catch (err) { console.error("Error exportar:", err); }
    };

    const limpiarFiltros = () => {
      setCedulaVendedora(""); setEstadoFiltro([]); setSectorFiltro(null); setCategoriaFiltro(null);
      setCiudadFiltro(""); setProvinciaFiltro(""); setBusquedaNombre(""); setBusquedaInput("");
      establecerFechasUltimos3Meses(); setPaginaActual(1);
      localStorage.removeItem("filtros_prospectos_admin");
    };

    useEffect(() => { return () => debouncedBuscar.cancel(); }, []);

    /* ─── react-select estilos adaptados al tema claro ─── */
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
      menu: (b) => ({ ...b, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 999 }),
      option: (b, s) => ({ ...b, background: s.isSelected ? "#6c5ff0" : s.isFocused ? "#f5f3ff" : "#fff", color: s.isSelected ? "#fff" : "#334155", fontSize: "13px" }),
      multiValue: (b) => ({ ...b, background: "#ede9fe", borderRadius: "6px" }),
      multiValueLabel: (b) => ({ ...b, color: "#5b21b6", fontSize: "12px", fontWeight: 600 }),
      multiValueRemove: (b) => ({ ...b, color: "#7c3aed", "&:hover": { background: "#ddd6fe", color: "#4c1d95" } }),
      placeholder: (b) => ({ ...b, color: "#94a3b8", fontSize: "13px" }),
      singleValue: (b) => ({ ...b, color: "#334155", fontSize: "13px" }),
    };

    return (
      <div className="pa-container">

        {/* ── Header ── */}
        <div className="pa-header">
          <div className="pa-header-left">
            <div className="pa-header-text">
              <h1 className="pa-title">Prospectos</h1>
              <p className="pa-subtitle">Gestión y seguimiento de oportunidades comerciales</p>
            </div>
          </div>
          <div className="pa-header-actions">
            <button className="pa-btn-ghost" onClick={exportarExcel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar
            </button>
            {!esSoloLectura && (
              <button className="pa-btn-primary" onClick={() => navigate("/crear-prospecto")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nuevo Prospecto
              </button>
            )}
          </div>
        </div>

        {error && <div className="pa-alert-error">{error}</div>}

        {/* ── Barra de búsqueda ── */}
        <div className="pa-search-row">
          <div className="pa-search-left">
            <div className="pa-search-wrap">
              <svg className="pa-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                className="pa-input pa-search-input"
                placeholder="Buscar prospecto..."
                value={busquedaInput}
                onChange={(e) => { setBusquedaInput(e.target.value); debouncedBuscar(e.target.value); }}
              />
            </div>
            <select className="pa-select" value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="">Fecha de creación</option>
              <option value="proximo_contacto">Próximo contacto</option>
            </select>
          </div>
          <button
            className={`pa-btn-filter ${mostrarFiltros ? "active" : ""}`}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filtros
            {hayFiltrosActivos() && <span className="pa-filter-dot" />}
          </button>
        </div>

        {/* ── Filtros avanzados ── */}
        {mostrarFiltros && (
          <div className="pa-filters-panel">
            <div className="pa-filters-grid">
              <div className="pa-filter-item">
                <label>Vendedora</label>
                <select className="pa-select" value={cedulaVendedora} onChange={e => setCedulaVendedora(e.target.value)}>
                  <option value="">Todas</option>
                  {vendedoras.map(v => <option key={v.cedula_ruc} value={v.cedula_ruc}>{v.nombre}</option>)}
                </select>
              </div>
              <div className="pa-filter-item">
                <label>Estado(s)</label>
                <Select options={estados} isMulti styles={rsStyles} placeholder="Todos" value={estadoFiltro} onChange={setEstadoFiltro} />
              </div>
              <div className="pa-filter-item">
                <label>Categoría</label>
                <Select options={categorias} styles={rsStyles} placeholder="Todas" value={categoriaFiltro} onChange={setCategoriaFiltro} isClearable />
              </div>
              <div className="pa-filter-item">
                <label>Sector</label>
                <Select options={sectores} styles={rsStyles} placeholder="Todos" value={sectorFiltro} onChange={setSectorFiltro} isClearable />
              </div>
              <div className="pa-filter-item">
                <label>Ciudad</label>
                <Select options={ciudades} styles={rsStyles} placeholder="Todas" value={ciudades.find(c => c.value === ciudadFiltro)} onChange={op => setCiudadFiltro(op ? op.value : "")} isClearable />
              </div>
              <div className="pa-filter-item">
                <label>Provincia</label>
                <Select options={provincias} styles={rsStyles} placeholder="Todas" value={provincias.find(p => p.value === provinciaFiltro)} onChange={op => setProvinciaFiltro(op ? op.value : "")} isClearable />
              </div>
              <div className="pa-filter-item">
                <label>Desde</label>
                <input type="date" className="pa-input" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
              </div>
              <div className="pa-filter-item">
                <label>Hasta</label>
                <input type="date" className="pa-input" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
              </div>
            </div>
            <div className="pa-filters-footer">
              <button className="pa-btn-ghost" onClick={limpiarFiltros}>Limpiar filtros</button>
            </div>
          </div>
        )}

        {/* ── Tabla ── */}
        <div className="pa-card">

          {/* Paginación top */}
          <div className="pa-pagination">
            <span className="pa-pagination-info">
              Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
            </span>
            <div className="pa-pagination-btns">
              <button className="pa-page-btn" disabled={paginaActual <= 1} onClick={() => setPaginaActual(p => p - 1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="pa-page-btn" disabled={paginaActual >= totalPaginas} onClick={() => setPaginaActual(p => p + 1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="pa-loading">
              <div className="pa-spinner" />
              <span>Cargando prospectos...</span>
            </div>
          ) : (
            <>
              {/* Tabla escritorio */}
              <div className="pa-table-wrap">
                <table className="pa-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Prospecto</th>
                      <th>Vendedora</th>
                      <th>Objetivo</th>
                      <th>Estado</th>
                      <th>Próx. Contacto</th>
                      <th>Última Nota</th>
                      <th style={{ textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prospectos.length === 0 && (
                      <tr>
                        <td colSpan="8" className="pa-empty">
                          <div className="pa-empty-inner">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <p>No se encontraron prospectos</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {prospectos.flatMap((p, index) => {
                      if (!p.ventas || p.ventas.length === 0) {
                        return (
                          <tr key={`solo-${p.id_prospecto}`}>
                            <td className="pa-td-num">{(paginaActual - 1) * 10 + index + 1}</td>
                            <td className="pa-td-name">{p.nombre.toUpperCase()}</td>
                            <td>{p.vendedora_prospecto?.nombre || <span className="pa-muted">Sin asignar</span>}</td>
                            <td><span className="pa-muted">Sin objetivo</span></td>
                            <td><span className="pa-badge pa-badge-gray">Sin estado</span></td>
                            <td><span className="pa-muted">Sin programar</span></td>
                            <td className="pa-td-note"><span className="pa-muted">Sin nota</span></td>
                            <td className="pa-td-actions">
                              <button className="pa-icon-btn pa-icon-btn--add" onClick={() => navigate(`/abrir-venta/${p.id_prospecto}`)} title="Abrir prospección">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              </button>
                              <button className="pa-icon-btn" onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)} title="Editar">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              {!esSoloLectura && (
                                <button className="pa-icon-btn pa-icon-btn--del" onClick={() => eliminarProspecto(p.id_prospecto)} title="Eliminar">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      }
                      return p.ventas.map((venta) => {
                        const sigs = venta.seguimientos || [];
                        const ultimaNota = [...sigs].sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada))[0]?.nota ?? "Sin nota";
                        const proxSeg = sigs.filter(s => s.estado === "pendiente").sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];
                        const proxFecha = proxSeg ? new Date(proxSeg.fecha_programada).toLocaleDateString("es-EC") : null;
                        const esGanado = venta.estado_venta?.nombre?.toLowerCase() === "cierre de venta" && venta.monto_cierre;
                        const estadoTexto = esGanado ? `Ganado ($${parseFloat(venta.monto_cierre).toFixed(2)})` : (venta.estado_venta?.nombre || "Sin estado");

                        return (
                          <tr key={`${p.id_prospecto}-${venta.id_venta}`}>
                            <td className="pa-td-num">{(paginaActual - 1) * 10 + index + 1}</td>
                            <td className="pa-td-name">{p.nombre}</td>
                            <td>{p.vendedora_prospecto?.nombre || <span className="pa-muted">Sin asignar</span>}</td>
                            <td>{venta.objetivo || <span className="pa-muted">Sin objetivo</span>}</td>
                            <td>
                              <span className={`pa-badge ${esGanado ? "pa-badge-green" : "pa-badge-blue"}`}>
                                {estadoTexto}
                              </span>
                            </td>
                            <td>
                              {proxFecha
                                ? <span className="pa-date">{proxFecha}</span>
                                : <span className="pa-muted">Sin programar</span>}
                            </td>
                            <td className="pa-td-note">{ultimaNota}</td>
                            <td className="pa-td-actions">
                              <button className="pa-icon-btn pa-icon-btn--view" onClick={() => navigate(`/seguimientos-prospecto/${p.id_prospecto}`)} title="Ver seguimientos">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                              </button>
                              <button className="pa-icon-btn" onClick={() => navigate(`/seguimientos-prospecto/${p.id_prospecto}#historial`)} title="Historial">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                              </button>
                              <button className="pa-icon-btn" onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)} title="Editar">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              {!esSoloLectura && (
                                <button className="pa-icon-btn pa-icon-btn--del" onClick={() => eliminarProspecto(p.id_prospecto)} title="Eliminar">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil */}
              <div className="pa-mobile-view">
                {prospectos.length === 0 && <div className="pa-empty"><p>No se encontraron prospectos.</p></div>}
                {prospectos.flatMap((p) => {
                  if (!p.ventas || p.ventas.length === 0) {
                    return (
                      <div className="pa-mc" key={`solo-${p.id_prospecto}`}>
                        <div className="pa-mc-head">
                          <span className="pa-mc-name">{p.nombre}</span>
                          <span className="pa-badge pa-badge-gray">Sin estado</span>
                        </div>
                        <p className="pa-mc-meta">Vendedora: {p.vendedora_prospecto?.nombre || "Sin asignar"}</p>
                        <div className="pa-mc-actions">
                          <button className="pa-btn-ghost pa-btn-sm" onClick={() => navigate(`/abrir-venta/${p.id_prospecto}`)}>Abrir</button>
                          <button className="pa-btn-ghost pa-btn-sm" onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}>Editar</button>
                          {!esSoloLectura && <button className="pa-btn-danger pa-btn-sm" onClick={() => eliminarProspecto(p.id_prospecto)}>Eliminar</button>}
                        </div>
                      </div>
                    );
                  }
                  return p.ventas.map((venta) => {
                    const proxSeg = venta.seguimientos?.filter(s => s.estado === "pendiente").sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];
                    const proxFecha = proxSeg ? new Date(proxSeg.fecha_programada).toLocaleDateString("es-EC") : "Sin programar";
                    const esGanado = venta.estado_venta?.nombre?.toLowerCase() === "cierre de venta" && venta.monto_cierre;
                    return (
                      <div className="pa-mc" key={`v-${p.id_prospecto}-${venta.id_venta}`}>
                        <div className="pa-mc-head">
                          <span className="pa-mc-name">{p.nombre}</span>
                          <span className={`pa-badge ${esGanado ? "pa-badge-green" : "pa-badge-blue"}`}>
                            {esGanado ? "Ganado" : venta.estado_venta?.nombre}
                          </span>
                        </div>
                        <p className="pa-mc-meta">Vendedora: {p.vendedora_prospecto?.nombre || "Sin asignar"}</p>
                        <p className="pa-mc-meta">Objetivo: {venta.objetivo || "—"}</p>
                        <p className="pa-mc-meta">Próximo: {proxFecha}</p>
                        <div className="pa-mc-actions">
                          <button className="pa-btn-ghost pa-btn-sm" onClick={() => navigate(`/seguimientos-prospecto/${p.id_prospecto}`)}>Ver</button>
                          <button className="pa-btn-ghost pa-btn-sm" onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}>Editar</button>
                          {!esSoloLectura && <button className="pa-btn-danger pa-btn-sm" onClick={() => eliminarProspecto(p.id_prospecto)}>Eliminar</button>}
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

  export default ProspectosAdmin;