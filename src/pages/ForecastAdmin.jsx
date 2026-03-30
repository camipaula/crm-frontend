import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRol } from "../utils/auth";
import "../styles/forecastAdmin.css";
import React from "react";

const MESES = [
  { val: 1, label: "Ene" }, { val: 2, label: "Feb" }, { val: 3, label: "Mar" },
  { val: 4, label: "Abr" }, { val: 5, label: "May" }, { val: 6, label: "Jun" },
  { val: 7, label: "Jul" }, { val: 8, label: "Ago" }, { val: 9, label: "Sep" },
  { val: 10, label: "Oct" }, { val: 11, label: "Nov" }, { val: 12, label: "Dic" },
];

const ForecastAdmin = () => {
  const navigate = useNavigate();
  const rol = getRol();
  const esSoloLectura = rol === "lectura";

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

  // ─── ESTADOS GLOBALES (Estructura) ───
  const [vendedoras, setVendedoras] = useState([]);
  const [categoriasVenta, setCategoriasVenta] = useState([]);
  const [errorGlobal, setErrorGlobal] = useState("");

  // ─── ESTADOS FORMULARIO INDIVIDUAL ───
  const [form, setForm] = useState({
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    cedula_vendedora: "",
    id_categoria_venta: "",
    monto_proyectado: "",
  });
  const [enviandoForm, setEnviandoForm] = useState(false);
  const [mensajeForm, setMensajeForm] = useState("");
  const [errorForm, setErrorForm] = useState("");

  // ─── ESTADOS TABLA MASIVA (GRILLA) ───
  const [anioTabla, setAnioTabla] = useState(new Date().getFullYear());
  const [datosBase, setDatosBase] = useState([]);
  const [grillaMontos, setGrillaMontos] = useState({});
  const [cambiosPendientes, setCambiosPendientes] = useState({});
  const [loadingTabla, setLoadingTabla] = useState(false);
  const [guardandoTabla, setGuardandoTabla] = useState(false);
  const [errorTabla, setErrorTabla] = useState("");

  // ─── CARGA INICIAL ───
  useEffect(() => {
    cargarEstructuras();
  }, []);

  useEffect(() => {
    if (vendedoras.length > 0 && categoriasVenta.length > 0) {
      cargarDatosAnio(anioTabla);
    }
  }, [anioTabla, vendedoras, categoriasVenta]);

  const cargarEstructuras = async () => {
    try {
      const token = localStorage.getItem("token");
      const [resVend, resCat] = await Promise.all([
        fetch(`${API_URL}/api/usuarios/vendedoras`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch(`${API_URL}/api/categorias-venta`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ]);
      
      const vends = resVend && resVend.ok ? await resVend.json() : [];
      setVendedoras(Array.isArray(vends) ? vends.filter(v => v.estado === 1) : []);

      const catsRaw = resCat && resCat.ok ? await resCat.json() : [];
      const catsList = Array.isArray(catsRaw) ? catsRaw : (Array.isArray(catsRaw?.data) ? catsRaw.data : catsRaw?.categorias ?? []);
      setCategoriasVenta(catsList.map(c => ({ id_categoria_venta: c.id_categoria_venta ?? c.id, nombre: c.nombre ?? c.name ?? "Sin nombre" })));
      
    } catch (err) {
      console.error(err);
      setErrorGlobal("Error cargando vendedoras o categorías.");
    }
  };

  // ─── LÓGICA DEL FORMULARIO INDIVIDUAL ───
  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "anio" || name === "mes" ? (value ? Number(value) : "") : value,
    }));
    setErrorForm("");
    setMensajeForm("");
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setErrorForm(""); setMensajeForm("");

    if (!form.cedula_vendedora || !form.id_categoria_venta) return setErrorForm("Selecciona vendedora y categoría.");
    const monto = parseFloat(form.monto_proyectado);
    if (isNaN(monto) || monto < 0) return setErrorForm("El monto proyectado debe ser un número válido ≥ 0.");

    setEnviandoForm(true);
    try {
      const token = localStorage.getItem("token");
      const body = {
        anio: Number(form.anio),
        mes: Number(form.mes),
        cedula_vendedora: form.cedula_vendedora,
        id_categoria_venta: Number(form.id_categoria_venta),
        monto_proyectado: monto,
      };

      const res = await fetch(`${API_URL}/api/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      // Si ya existe (409), hacemos PUT para actualizar
      if (res.status === 409 && data.id_forecast) {
        const putRes = await fetch(`${API_URL}/api/forecast/${data.id_forecast}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ monto_proyectado: monto }),
        });
        if (!putRes.ok) throw new Error("Error al actualizar el forecast individual");
        setMensajeForm("✅ Meta actualizada correctamente (ya existía).");
      } else if (!res.ok) {
        throw new Error(data?.message || "Error al guardar forecast");
      } else {
        setMensajeForm("✅ Meta guardada correctamente.");
      }

      setForm((prev) => ({ ...prev, monto_proyectado: "" }));
      
      // Si el año editado es el mismo que el de la tabla, recargar la tabla para que se vea el cambio
      if (Number(form.anio) === anioTabla) {
        cargarDatosAnio(anioTabla);
      }
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setEnviandoForm(false);
    }
  };

  // ─── LÓGICA DE LA TABLA MASIVA ───
  const cargarDatosAnio = async (anio) => {
    setLoadingTabla(true); setErrorTabla(""); setCambiosPendientes({}); 
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/forecast/anio?anio=${anio}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Error al cargar las metas del año");
      
      const data = await res.json();
      const datosValidos = Array.isArray(data) ? data : [];
      setDatosBase(datosValidos);

      const nuevaGrilla = {};
      vendedoras.forEach(vend => {
        categoriasVenta.forEach(cat => {
          MESES.forEach(mes => {
            nuevaGrilla[`${vend.cedula_ruc}-${cat.id_categoria_venta}-${mes.val}`] = 0;
          });
        });
      });

      datosValidos.forEach(d => {
        const key = `${d.cedula_vendedora}-${d.id_categoria_venta}-${d.mes}`;
        if (nuevaGrilla[key] !== undefined) {
          nuevaGrilla[key] = parseFloat(d.monto_proyectado) || 0;
        }
      });
      setGrillaMontos(nuevaGrilla);
    } catch (err) {
      setErrorTabla(err.message);
    } finally {
      setLoadingTabla(false);
    }
  };

  const handleInputChange = (cedula, idCat, mes, nuevoValor) => {
    const key = `${cedula}-${idCat}-${mes}`;
    if (nuevoValor < 0) return;

    setGrillaMontos(prev => ({ ...prev, [key]: nuevoValor }));
    setCambiosPendientes(prev => ({ ...prev, [key]: nuevoValor === "" ? 0 : parseFloat(nuevoValor) }));
  };

  const guardarCambiosMasivos = async () => {
    const keysCambiadas = Object.keys(cambiosPendientes);
    if (keysCambiadas.length === 0) return;

    setGuardandoTabla(true);
    try {
      const cambiosArray = keysCambiadas.map(key => {
        const [cedula_vendedora, id_categoria_venta, mes] = key.split("-");
        return {
          anio: anioTabla,
          mes: parseInt(mes, 10),
          cedula_vendedora,
          id_categoria_venta: parseInt(id_categoria_venta, 10),
          monto_proyectado: cambiosPendientes[key]
        };
      });

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/forecast/bulk`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cambios: cambiosArray })
      });

      if (!res.ok) {
        const data = await res.json().catch(()=>({}));
        throw new Error(data.message || "Error al guardar los cambios masivamente.");
      }

      alert("✅ Metas actualizadas masivamente.");
      setCambiosPendientes({}); 
      cargarDatosAnio(anioTabla); 
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setGuardandoTabla(false);
    }
  };

  const calcularTotalFila = (cedula, idCat) => {
    let total = 0;
    MESES.forEach(m => { total += parseFloat(grillaMontos[`${cedula}-${idCat}-${m.val}`]) || 0; });
    return total;
  };

  const calcularTotalVendedoraMes = (cedula, mes) => {
    let total = 0;
    categoriasVenta.forEach(cat => { total += parseFloat(grillaMontos[`${cedula}-${cat.id_categoria_venta}-${mes}`]) || 0; });
    return total;
  };

  const calcularGranTotalVendedora = (cedula) => {
    let total = 0;
    categoriasVenta.forEach(cat => { total += calcularTotalFila(cedula, cat.id_categoria_venta); });
    return total;
  };

  return (
    <div className="fa-container">
      <div className="fa-header">
        <div className="fa-header-left">
          <button type="button" className="fa-btn-outline" onClick={() => navigate(-1)}>⬅️ Volver</button>
          <div>
            <h1 className="fa-title">Forecast – Metas de Venta</h1>
            <p className="fa-subtitle">Registra metas de forma individual o actualiza masivamente el año</p>
          </div>
        </div>
      </div>

      {errorGlobal && <div className="fa-alert-error">{errorGlobal}</div>}

      {/* ── SECCIÓN 1: FORMULARIO INDIVIDUAL ── */}
      {!esSoloLectura && (
        <div className="fa-card">
          <div className="fa-card-header">
            <h3>📝 Registro Individual</h3>
            <p>Usa este formulario para agregar o actualizar la meta de un solo mes de forma directa.</p>
          </div>
          
          <form onSubmit={handleSubmitForm} className="fa-form">
            <div className="fa-form-grid">
              <div className="fa-form-group">
                <label>Año</label>
                <select className="fa-select" name="anio" value={form.anio} onChange={handleChangeForm} required>
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="fa-form-group">
                <label>Mes</label>
                <select className="fa-select" name="mes" value={form.mes} onChange={handleChangeForm} required>
                  {MESES.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>
              </div>

              <div className="fa-form-group">
                <label>Vendedora</label>
                <select className="fa-select" name="cedula_vendedora" value={form.cedula_vendedora} onChange={handleChangeForm} required>
                  <option value="">Seleccione vendedora...</option>
                  {vendedoras.map(v => <option key={v.cedula_ruc} value={v.cedula_ruc}>{v.nombre}</option>)}
                </select>
              </div>

              <div className="fa-form-group">
                <label>Categoría</label>
                <select className="fa-select" name="id_categoria_venta" value={form.id_categoria_venta} onChange={handleChangeForm} required>
                  <option value="">Seleccione categoría...</option>
                  {categoriasVenta.map(c => <option key={c.id_categoria_venta} value={c.id_categoria_venta}>{c.nombre}</option>)}
                </select>
              </div>

              <div className="fa-form-group">
                <label>Monto Proyectado ($)</label>
                <input className="fa-input" type="number" name="monto_proyectado" value={form.monto_proyectado} onChange={handleChangeForm} placeholder="Ej: 15000" min="0" step="0.01" />
              </div>
            </div>

            {mensajeForm && <div className="fa-alert-success">{mensajeForm}</div>}
            {errorForm && <div className="fa-alert-error">{errorForm}</div>}

            <div className="fa-form-actions">
              <button type="submit" className="fa-btn-primary" disabled={enviandoForm}>
                {enviandoForm ? "Guardando..." : "💾 Guardar Meta Individual"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── SECCIÓN 2: TABLA MASIVA TIPO EXCEL ── */}
      <div className="fa-card">
        <div className="fa-table-topbar">
          <div className="fa-table-title">
            <h3>📊 Vista y Edición(Anual)</h3>
          </div>
          <div className="fa-table-actions">
            <div className="fa-year-selector">
              <label>Año:</label>
              <select className="fa-select-inline" value={anioTabla} onChange={(e) => setAnioTabla(Number(e.target.value))}>
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            
            {!esSoloLectura && Object.keys(cambiosPendientes).length > 0 && (
              <button className="fa-btn-primary fa-pulse" onClick={guardarCambiosMasivos} disabled={guardandoTabla}>
                {guardandoTabla ? "Guardando..." : "💾 Guardar Cambios de Tabla"}
              </button>
            )}
          </div>
        </div>

        {errorTabla && <div className="fa-alert-error">{errorTabla}</div>}

        {loadingTabla ? (
          <div className="fa-loading">Cargando grilla de metas...</div>
        ) : vendedoras.length === 0 || categoriasVenta.length === 0 ? (
          <div className="fa-empty">No hay datos suficientes (vendedoras o categorías) para armar la tabla.</div>
        ) : (
          <div className="fa-table-wrapper">
            <table className="fa-table">
              <thead>
                <tr>
                  <th className="fa-sticky-col">Vendedora</th>
                  <th className="fa-sticky-col2">Categoría</th>
                  {MESES.map((m) => (
                    <th key={m.val}>{m.label}</th>
                  ))}
                  <th className="fa-total-col">Total Anual</th>
                </tr>
              </thead>
              <tbody>
                {vendedoras.map((vend) => {
                  return (
                    <React.Fragment key={vend.cedula_ruc}>
                      {categoriasVenta.map((cat, idxC) => {
                        const esPrimeraCat = idxC === 0;
                        return (
                          <tr key={`${vend.cedula_ruc}-${cat.id_categoria_venta}`} className="fa-data-row">
                            <td className="fa-sticky-col fa-vend-name">
                              {esPrimeraCat ? vend.nombre.toUpperCase() : ""}
                            </td>
                            <td className="fa-sticky-col2 fa-cat-name">
                              {cat.nombre}
                            </td>
                            
                            {MESES.map((m) => {
                              const cellKey = `${vend.cedula_ruc}-${cat.id_categoria_venta}-${m.val}`;
                              const valor = grillaMontos[cellKey];
                              const fueModificado = cambiosPendientes[cellKey] !== undefined;

                              return (
                                <td key={m.val} className={`fa-input-cell ${fueModificado ? "fa-modified" : ""}`}>
                                  {esSoloLectura ? (
                                    <span className="fa-readonly-val">{Number(valor || 0).toFixed(2)}</span>
                                  ) : (
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      className="fa-cell-input"
                                      value={valor === 0 && !fueModificado ? "" : valor} 
                                      placeholder="0.00"
                                      onChange={(e) => handleInputChange(vend.cedula_ruc, cat.id_categoria_venta, m.val, e.target.value)}
                                      onWheel={(e) => e.target.blur()}
                                    />
                                  )}
                                </td>
                              );
                            })}
                            
                            <td className="fa-total-col fa-row-sum">
                              ${calcularTotalFila(vend.cedula_ruc, cat.id_categoria_venta).toLocaleString("en-US", {minimumFractionDigits: 2})}
                            </td>
                          </tr>
                        );
                      })}

                      <tr className="fa-subtotal-row">
                        <td className="fa-sticky-col"></td>
                        <td className="fa-sticky-col2 fa-bold">TOTAL {vend.nombre.split(" ")[0].toUpperCase()}</td>
                        {MESES.map((m) => (
                          <td key={m.val} className="fa-col-sum">
                            ${calcularTotalVendedoraMes(vend.cedula_ruc, m.val).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits:2})}
                          </td>
                        ))}
                        <td className="fa-total-col fa-grand-sum">
                          ${calcularGranTotalVendedora(vend.cedula_ruc).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits:2})}
                        </td>
                      </tr>
                      <tr className="fa-spacer"><td colSpan={15}></td></tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastAdmin;