import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerCedulaDesdeToken } from "../utils/auth"; 
import "../styles/crearProspecto.css"; 

const CrearProspecto = () => {
  const navigate = useNavigate(); 
  const [cedulaVendedora, setCedulaVendedora] = useState(null);
  const [formData, setFormData] = useState({
    cedula_ruc: "",
    nombre: "",
    nombre_contacto: "",
    correo: "",
    telefono: "",
    direccion: "",
    provincia: "",
    ciudad: "",
    sector: "",
    origen: "",
    id_categoria: null,
    descripcion: "",
    nota: "",
    estado: "nuevo",
    created_at: new Date().toISOString().split("T")[0],
  });

  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cedula = obtenerCedulaDesdeToken();
    if (cedula) {
      setCedulaVendedora(cedula);
    }
  }, []);

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

    if (!cedulaVendedora) {
      setError("Error: No se pudo obtener la cédula de la vendedora.");
      return;
    }

    if (!formData.nombre || !formData.estado) {
      setError("El nombre y el estado son obligatorios.");
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
        body: JSON.stringify({
          ...formData,
          cedula_vendedora: cedulaVendedora,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al crear prospecto");
      }

      setMensaje("Prospecto creado exitosamente.");
      setTimeout(() => navigate("/prospectos-vendedora"), 2000);
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
        <label>Cédula/RUC:</label>
        <input type="text" name="cedula_ruc" value={formData.cedula_ruc} onChange={handleChange} />

        <label>Nombre <span className="required">*</span>:</label>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />

        <label>Nombre del Contacto:</label>
        <input type="text" name="nombre_contacto" value={formData.nombre_contacto} onChange={handleChange} />

        <label>Correo:</label>
        <input type="email" name="correo" value={formData.correo} onChange={handleChange} />

        <label>Teléfono:</label>
        <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />

        <label>Dirección:</label>
        <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} />

        <label>Provincia:</label>
        <input type="text" name="provincia" value={formData.provincia} onChange={handleChange} />

        <label>Ciudad:</label>
        <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} />

        <label>Sector:</label>
        <input type="text" name="sector" value={formData.sector} onChange={handleChange} />

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

        <label>Descripción:</label>
        <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} />

        <label>Nota:</label>
        <textarea name="nota" value={formData.nota} onChange={handleChange} />

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

export default CrearProspecto;
