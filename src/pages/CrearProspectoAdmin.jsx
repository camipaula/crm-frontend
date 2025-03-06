import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/crearProspecto.css"; 

const CrearProspectoAdmin = () => {
  const navigate = useNavigate();
  const [vendedoras, setVendedoras] = useState([]);
  const [formData, setFormData] = useState({
    cedula_ruc: "",
    nombre: "",
    email: "",
    telefono: "",
    estado: "nuevo",
    cedula_vendedora: "", 
  });

  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  // Cargar lista de vendedoras desde el backend
  useEffect(() => {
    const cargarVendedoras = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/usuarios/vendedoras", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Error al cargar las vendedoras.");

        const data = await res.json();
        setVendedoras(data);
      } catch (err) {
        setError(err.message);
      }
    };

    cargarVendedoras();
  }, []);

  // Manejo de cambios en los inputs del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Enviar datos al backend para crear un prospecto
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setError(null);

    if (!formData.cedula_vendedora) {
      setError("Debe asignar una vendedora al prospecto.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/prospectos", {
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
      <h1>Crear Prospecto</h1>

      {mensaje && <p className="success">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>Cédula/RUC:</label>
        <input type="text" name="cedula_ruc" value={formData.cedula_ruc} onChange={handleChange} required />

        <label>Nombre:</label>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />

        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />

        <label>Teléfono:</label>
        <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} required />

        <label>Estado:</label>
        <select name="estado" value={formData.estado} onChange={handleChange}>
          <option value="nuevo">Nuevo</option>
          <option value="interesado">Interesado</option>
          <option value="ganado">Ganado</option>
          <option value="archivado">Archivado</option>
          <option value="perdido">Perdido</option>
        </select>

        {/* Selector de Vendedora */}
        <label>Asignar a Vendedora:</label>
        <select name="cedula_vendedora" value={formData.cedula_vendedora} onChange={handleChange} required>
          <option value="">Selecciona una vendedora</option>
          {vendedoras.map((v) => (
            <option key={v.cedula_ruc} value={v.cedula_ruc}>
              {v.nombre}
            </option>
          ))}
        </select>

        <button type="submit">Crear Prospecto</button>
        <button type="button" className="btn-cerrar" onClick={() => navigate("/prospectos-admin")}>Cerrar</button>
      </form>
    </div>
  );
};

export default CrearProspectoAdmin;
