import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerCedulaDesdeToken, getRol } from "../utils/auth";
import "../styles/crearProspecto.css";

const CrearProspecto = () => {
  const navigate = useNavigate();
  const [vendedoras, setVendedoras] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [categorias, setCategorias] = useState([]);
  const [categoriasVenta, setCategoriasVenta] = useState([]);
  const [origenes, setOrigenes] = useState([]);

  const [formData, setFormData] = useState({
    nombre: "",
    nombre_contacto: "",
    descripcion: "",
    id_categoria: null,
    id_categoria_venta: null,
    id_origen: null,
    nota: "",
    correo: "",
    telefono: "",
    direccion: "",
    provincia: "",
    ciudad: "",
    sector: "",
    cedula_ruc: "",
    cedula_vendedora: "",
    objetivo: "",
    created_at: new Date().toISOString().split("T")[0],
    empleados: "",
    monto_proyectado: "",
  });

  useEffect(() => {
    obtenerCategorias();
    cargarCategoriasVenta();
    cargarOrigenes();
    const rol = getRol();
    const cedula = obtenerCedulaDesdeToken();

    setEsAdmin(rol === "admin");

    if (rol === "vendedora") {
      setFormData((prev) => ({ ...prev, cedula_vendedora: cedula }));
    } else {
      cargarVendedoras();
    }
  }, []);

  const cargarOrigenes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/origenes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Error al cargar orígenes");
      const data = await res.json();
      setOrigenes(data);
    } catch (err) {
      console.error("Error al cargar orígenes:", err);
      setError("No se pudieron cargar los orígenes.");
    }
  };

  const cargarVendedoras = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setVendedoras(data);
    } catch (err) {
      setError("Error al cargar vendedoras");
      console.error("Error al cargar vendedoras:", err);
    }
  };

  const obtenerCategorias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`);
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
      setError("No se pudieron cargar las categorías.");
    }
  };

  const cargarCategoriasVenta = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/api/categorias-venta`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar categorías de venta");
      const raw = await res.json();
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.categorias)
            ? raw.categorias
            : [];
      const normalizadas = list.map((c) => ({
        id_categoria_venta: c.id_categoria_venta ?? c.id,
        nombre: c.nombre ?? c.name ?? String(c.id_categoria_venta ?? c.id ?? ""),
      }));
      setCategoriasVenta(normalizadas);
    } catch (err) {
      console.error("Error al cargar categorías de venta:", err);
      setCategoriasVenta([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "id_categoria"
          ? (value ? Number(value) : null)
          : name === "id_categoria_venta"
            ? (value ? Number(value) : null)
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setEnviando(true);

    const camposObligatorios = [
      { campo: formData.nombre, mensaje: "El nombre es obligatorio." },
      { campo: formData.id_origen, mensaje: "Debe seleccionar un origen." },
      { campo: formData.id_categoria, mensaje: "Debe seleccionar una categoría." },
      { campo: formData.objetivo, mensaje: "Debe ingresar el objetivo de la prospección." },
      { campo: formData.empleados, mensaje: "Debe ingresar el número de empleados." },
      { campo: formData.monto_proyectado, mensaje: "Debe ingresar el monto proyectado de la venta." },
      { campo: formData.cedula_vendedora, mensaje: "Debe asignar una vendedora." }
    ];

    for (const item of camposObligatorios) {
      if (!item.campo || item.campo === "") {
        setEnviando(false);
        return setError(item.mensaje);
      }
    }

    if (isNaN(formData.empleados) || Number(formData.empleados) < 0) {
      setEnviando(false);
      return setError("El número de empleados debe ser un número válido y no negativo.");
    }

    if (isNaN(formData.monto_proyectado) || Number(formData.monto_proyectado) < 0) {
      setEnviando(false);
      return setError("El monto proyectado debe ser un número válido y no negativo.");
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          id_categoria_venta: formData.id_categoria_venta ?? null,
          estado: "Captación/ensayo",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear prospecto");

      window.alert("✅ Prospecto creado exitosamente.");
      navigate(esAdmin ? "/prospectos-admin" : "/prospectos-vendedora");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="cp-container">
      <div className="cp-header">
        <button className="cp-btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>
        <div className="cp-header-text">
          <h1 className="cp-title">Crear Nuevo Prospecto</h1>
          <p className="cp-subtitle">Registra la información inicial para la oportunidad de venta</p>
        </div>
      </div>

      {mensaje && <div className="cp-alert-success">{mensaje}</div>}
      {error && <div className="cp-alert-error">{error}</div>}

      <div className="cp-card">
        <form onSubmit={handleSubmit} className="cp-form">
          <div className="cp-form-grid">
            
            {/* Fila 1: Nombre (ancho completo) */}
            <div className="cp-form-group cp-full-width">
              <label>Nombre del Prospecto / Empresa <span className="cp-required">*</span></label>
              <input type="text" className="cp-input" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej. Corporación ABC" />
            </div>

            {/* Fila 2: Categoría y Origen */}
            <div className="cp-form-group">
              <label>Categoría <span className="cp-required">*</span></label>
              <select className="cp-select" name="id_categoria" value={formData.id_categoria || ""} onChange={handleChange} required>
                <option value="">Seleccione una categoría...</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="cp-form-group">
              <label>Origen <span className="cp-required">*</span></label>
              <select className="cp-select" name="id_origen" value={formData.id_origen || ""} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                {origenes.map((o) => (
                  <option key={o.id_origen} value={o.id_origen}>{o.descripcion}</option>
                ))}
              </select>
            </div>

            {/* Fila 3: Empleados y Monto Proyectado */}
            <div className="cp-form-group">
              <label>Número de Empleados <span className="cp-required">*</span></label>
              <input type="number" className="cp-input" name="empleados" value={formData.empleados} onWheel={(e) => e.target.blur()} onChange={handleChange} required placeholder="Ej. 150" />
            </div>

            <div className="cp-form-group">
              <label>Monto Proyectado ($) <span className="cp-required">*</span></label>
              <input type="number" className="cp-input" name="monto_proyectado" value={formData.monto_proyectado} onChange={handleChange} required onWheel={(e) => e.target.blur()} placeholder="Ej. 5000" />
            </div>

            {/* Fila 4: Contacto y Correo */}
            <div className="cp-form-group">
              <label>Nombre del Contacto</label>
              <input type="text" className="cp-input" name="nombre_contacto" value={formData.nombre_contacto} onChange={handleChange} placeholder="Ej. Juan Pérez" />
            </div>

            <div className="cp-form-group">
              <label>Correo Electrónico</label>
              <input type="email" className="cp-input" name="correo" value={formData.correo} onChange={handleChange} placeholder="correo@empresa.com" />
            </div>

            {/* Fila 5: Teléfono y Cédula/RUC */}
            <div className="cp-form-group">
              <label>Teléfono</label>
              <input type="text" className="cp-input" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej. 0991234567" />
            </div>

            <div className="cp-form-group">
              <label>Cédula / RUC</label>
              <input type="text" className="cp-input" name="cedula_ruc" value={formData.cedula_ruc} onChange={handleChange} placeholder="Ej. 1700000000001" />
            </div>

            {/* Fila 6: Provincia y Ciudad */}
            <div className="cp-form-group">
              <label>Provincia</label>
              <input type="text" className="cp-input" name="provincia" value={formData.provincia} onChange={handleChange} placeholder="Ej. Pichincha" />
            </div>

            <div className="cp-form-group">
              <label>Ciudad</label>
              <input type="text" className="cp-input" name="ciudad" value={formData.ciudad} onChange={handleChange} placeholder="Ej. Quito" />
            </div>

            {/* Fila 7: Sector y Dirección */}
            <div className="cp-form-group">
              <label>Sector</label>
              <input type="text" className="cp-input" name="sector" value={formData.sector} onChange={handleChange} placeholder="Ej. Norte" />
            </div>

            <div className="cp-form-group">
              <label>Dirección</label>
              <input type="text" className="cp-input" name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Av. Principal y Secundaria" />
            </div>

            {/* Fila 8: Objetivo (Ancho completo) */}
            <div className="cp-form-group cp-full-width">
              <label>Objetivo de la Prospección <span className="cp-required">*</span></label>
              <textarea className="cp-textarea" name="objetivo" value={formData.objetivo || ""} onChange={handleChange} required placeholder="¿Qué buscamos lograr con este prospecto?" rows="3" />
            </div>

            {/* Fila 9: Descripción y Nota */}
            <div className="cp-form-group cp-full-width">
              <label>Descripción de la Empresa</label>
              <textarea className="cp-textarea" name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Breve perfil de la empresa..." rows="2" />
            </div>

            <div className="cp-form-group cp-full-width">
              <label>Nota Interna Adicional</label>
              <textarea className="cp-textarea" name="nota" value={formData.nota} onChange={handleChange} placeholder="Cualquier información relevante..." rows="2" />
            </div>

            {/* Fila 10: Datos Finales */}
            {esAdmin && (
              <div className="cp-form-group">
                <label>Asignar Vendedora <span className="cp-required">*</span></label>
                <select className="cp-select" name="cedula_vendedora" value={formData.cedula_vendedora} onChange={handleChange} required>
                  <option value="">Seleccione una vendedora...</option>
                  {vendedoras.map((v) => (
                    <option key={v.cedula_ruc} value={v.cedula_ruc}>{v.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="cp-form-group">
              <label>Categoría de Venta</label>
              <select className="cp-select" name="id_categoria_venta" value={formData.id_categoria_venta ?? ""} onChange={handleChange}>
                <option value="">Seleccione categoría de venta...</option>
                {categoriasVenta.map((c) => (
                  <option key={c.id_categoria_venta} value={c.id_categoria_venta}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="cp-form-group">
              <label>Fecha de Creación</label>
              <input type="date" className="cp-input" name="created_at" value={formData.created_at} onChange={handleChange} />
            </div>

          </div>

          <div className="cp-form-actions">
            <button type="button" className="cp-btn-secondary" onClick={() => navigate(-1)}>
              Cancelar
            </button>
            <button type="submit" className="cp-btn-primary" disabled={enviando}>
              {enviando ? "Creando..." : "💾 Guardar Prospecto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearProspecto;