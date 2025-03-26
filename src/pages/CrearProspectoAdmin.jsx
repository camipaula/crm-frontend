import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/crearProspecto.css";

const CrearProspectoAdmin = () => {
  const navigate = useNavigate();
  const [vendedoras, setVendedoras] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({
    nombre: "",
    nombre_contacto: "",
    descripcion: "",
    id_categoria: null,
    origen: "",
    nota: "",
    estado: "nuevo",
    correo: "",
    telefono: "",
    direccion: "",
    provincia: "",
    ciudad: "",
    sector: "",
    cedula_ruc: "",
    cedula_vendedora: "",
    created_at: new Date().toISOString().split("T")[0], // ✅ Fecha de hoy por defecto
  });


  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerVendedoras();
    obtenerCategorias();
  }, []);

  const obtenerVendedoras = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al obtener vendedoras");
      const data = await res.json();
      setVendedoras(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const obtenerCategorias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`);
      if (!res.ok) throw new Error("Error al obtener categorías");
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      setError(err.message);
      alert("Error al cargar las categorías, intente más tarde.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "id_categoria" ? (value ? Number(value) : null) : value,
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setError(null);

    if (!formData.nombre || !formData.estado) {
      setError("El nombre y el estado son obligatorios.");
      return;
    }

    if (!formData.cedula_vendedora) {
      setError("Debe asignar una vendedora.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al crear prospecto");
      }

      setMensaje("Prospecto creado exitosamente.");
      setTimeout(() => navigate("/prospectos-admin"), 2000);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="crear-prospecto-container">
            <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

      <h1>Crear Prospecto</h1>

      {mensaje && <p className="success">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* Nombre */}
        <label>Nombre <span className="required">*</span>:</label>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />

        {/* Nombre de contacto */}
        <label>Nombre del contacto:</label>
        <input type="text" name="nombre_contacto" value={formData.nombre_contacto} onChange={handleChange} />

        {/* Descripción */}
        <label>Descripción:</label>
        <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} />

        {/* Categoría */}
        <label>Categoría:</label>
        <select name="id_categoria" value={formData.id_categoria || ""} onChange={handleChange}>
          <option value="">Seleccione...</option>
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
          ))}
        </select>

        {/* Origen */}
        <label>Origen:</label>
        <select name="origen" value={formData.origen} onChange={handleChange}>
          <option value="">Seleccione...</option>
          <option value="publicidad">Publicidad</option>
          <option value="referencias">Referencias</option>
          <option value="online">Online</option>
          <option value="evento">Evento</option>
          <option value="contacto_directo">Contacto Directo</option>
          <option value="visita">Visita</option>
          <option value="otros">Otros</option>
        </select>

        {/* Nota */}
        <label>Nota:</label>
        <textarea name="nota" value={formData.nota} onChange={handleChange} />

        {/* Estado */}
        <label>Estado <span className="required">*</span>:</label>
        <select name="estado" value={formData.estado} onChange={handleChange} required>
          <option value="nuevo">Nuevo</option>
          <option value="contactar">Contactar</option>
          <option value="cita">Cita</option>
          <option value="visita">Visita</option>
          <option value="en_prueba">En prueba</option>
          <option value="proformado">Proformado</option>
          <option value="no_interesado">No Interesado</option>
          <option value="interesado">Interesado</option>
          <option value="ganado">Ganado</option>
          <option value="perdido">Perdido</option>
          <option value="archivado">Archivado</option>
        </select>

        {/* Correo */}
        <label>Correo:</label>
        <input type="email" name="correo" value={formData.correo} onChange={handleChange} />

        {/* Teléfono */}
        <label>Teléfono:</label>
        <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />

        {/* Dirección */}
        <label>Dirección:</label>
        <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} />

        {/* Provincia */}
        <label>Provincia:</label>
        <input type="text" name="provincia" value={formData.provincia} onChange={handleChange} />

        {/* Ciudad */}
        <label>Ciudad:</label>
        <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} />

        {/* Sector */}
        <label>Sector:</label>
        <input type="text" name="sector" value={formData.sector} onChange={handleChange} />

        {/* Cédula/RUC */}
        <label>Cédula/RUC:</label>
        <input type="text" name="cedula_ruc" value={formData.cedula_ruc} onChange={handleChange} />

        {/* Asignar vendedora */}
        <label>Asignar Vendedora <span className="required">*</span>:</label>
        <select name="cedula_vendedora" value={formData.cedula_vendedora} onChange={handleChange} required>
          <option value="">Seleccione una vendedora...</option>
          {vendedoras.map((v) => (
            <option key={v.cedula_ruc} value={v.cedula_ruc}>{v.nombre}</option>
          ))}
        </select>

        {/* Fecha de Creación */}
        <label>Fecha de Creación:</label>
        <input
          type="date"
          name="created_at"
          value={formData.created_at}
          onChange={handleChange}
        />

        <button type="submit">Crear Prospecto</button>
        <button type="button" className="btn-cerrar" onClick={() => navigate(-1)}>
          Cerrar
        </button>
      </form>
    </div>
  );
};

export default CrearProspectoAdmin;
