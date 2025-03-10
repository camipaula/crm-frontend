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
    correo: "",
    telefono: "",
    direccion: "",
    provincia: "",
    ciudad: "",
    sector: "",
    origen: "",
    nota: "",
    estado: "nuevo",
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      <h1>Crear Prospecto</h1>

      {mensaje && <p className="success">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>Cédula/RUC:</label>
        <input type="text" name="cedula_ruc" value={formData.cedula_ruc} onChange={handleChange} />

        <label>Nombre <span className="required">*</span>:</label>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />

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

        <label>Nota:</label>
        <textarea name="nota" value={formData.nota} onChange={handleChange} />

        <label>Estado <span className="required">*</span>:</label>
        <select name="estado" value={formData.estado} onChange={handleChange} required>
          <option value="nuevo">Nuevo</option>
          <option value="interesado">Interesado</option>
          <option value="propuesta">Propuesta</option>
          <option value="ganado">Ganado</option>
          <option value="perdido">Perdido</option>
          <option value="archivado">Archivado</option>
        </select>

        <button type="submit">Crear Prospecto</button>
        <button type="button" className="btn-cerrar" onClick={() => navigate("/prospectos-vendedora")}>
          Cerrar
        </button>
      </form>
    </div>
  );
};

export default CrearProspecto;
