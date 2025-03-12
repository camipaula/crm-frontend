import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRol } from "../utils/auth"; 
//import "../styles/editarProspecto.css";

const EditarProspecto = () => {
  const { id_prospecto } = useParams();
  console.log(" ID del prospecto recibido en el frontend:", id_prospecto);
  const navigate = useNavigate();
  const [prospecto, setProspecto] = useState(null);
  const [vendedoras, setVendedoras] = useState([]);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(true);

  const rolUsuario = getRol(); // Obtener el rol del usuario

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const token = localStorage.getItem("token");  
        if (!token) throw new Error("No estás autenticado. Inicia sesión nuevamente.");

        // Cargar datos del prospecto
        const resProspecto = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/${id_prospecto}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!resProspecto.ok) throw new Error("Error al cargar el prospecto.");
        const dataProspecto = await resProspecto.json();
        console.log(" Prospecto cargado:", dataProspecto);
        setProspecto(dataProspecto);

        // 🔍 Cargar lista de vendedoras solo si el usuario es administrador
        if (rolUsuario === "admin") {
          const resVendedoras = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!resVendedoras.ok) throw new Error("Error al cargar vendedoras.");
          const dataVendedoras = await resVendedoras.json();
          setVendedoras(dataVendedoras);
        }
      } catch (err) {
        console.error(" Error en la carga:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id_prospecto, rolUsuario]);

  // 🔹 Manejo de cambios en los inputs
  const handleChange = (e) => {
    if (!prospecto) return;
    setProspecto((prev) => ({
      ...prev,
      [e.target.name]: e.target.value || "",
    }));
  };

  // 🔹 Enviar datos al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!prospecto) return;

    const token = localStorage.getItem("token");

    try {
      console.log(" Enviando datos al backend:", prospecto);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/${id_prospecto}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(prospecto),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el prospecto.");
      }

      setMensaje("Prospecto actualizado con éxito.");
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      console.error(" Error al actualizar:", err);
      setError(err.message);
    }
  };

  // 🔹 Muestra mensaje de carga
  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="editar-prospecto-container">
      <h1>Editar Prospecto</h1>
      {mensaje && <p className="success">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>Nombre:</label>
        <input type="text" name="nombre" value={prospecto?.nombre || ""} onChange={handleChange} required />

        <label>Correo:</label>
        <input type="email" name="correo" value={prospecto?.correo || ""} onChange={handleChange} required />

        <label>Teléfono:</label>
        <input type="text" name="telefono" value={prospecto?.telefono || ""} onChange={handleChange} required />

        <label>Dirección:</label>
        <input type="text" name="direccion" value={prospecto?.direccion || ""} onChange={handleChange} />

        <label>Provincia:</label>
        <input type="text" name="provincia" value={prospecto?.provincia || ""} onChange={handleChange} />

        <label>Ciudad:</label>
        <input type="text" name="ciudad" value={prospecto?.ciudad || ""} onChange={handleChange} />

        <label>Sector:</label>
        <input type="text" name="sector" value={prospecto?.sector || ""} onChange={handleChange} />

        <label>Origen:</label>
        <select name="origen" value={prospecto?.origen || ""} onChange={handleChange}>
          <option value="publicidad">Publicidad</option>
          <option value="referencias">Referencias</option>
          <option value="online">Online</option>
          <option value="evento">Evento</option>
          <option value="contacto_directo">Contacto Directo</option>
          <option value="visita">Visita</option>
          <option value="otros">Otros</option>
        </select>

        <label>Nota:</label>
        <textarea name="nota" value={prospecto?.nota || ""} onChange={handleChange} />

        <label>Estado:</label>
        <select name="estado" value={prospecto?.estado || ""} onChange={handleChange}>
          <option value="nuevo">Nuevo</option>
          <option value="interesado">Interesado</option>
          <option value="proformado">Proformado</option>
          <option value="ganado">Ganado</option>
          <option value="archivado">Archivado</option>
          <option value="perdido">Perdido</option>
        </select>

        {/* Solo mostrar el campo de vendedora si el usuario es admin */}
        {rolUsuario === "admin" && (
          <>
            <label>Vendedora asignada:</label>
            <select name="cedula_vendedora" value={prospecto?.cedula_vendedora || ""} onChange={handleChange}>
              <option value="">Sin asignar</option>
              {vendedoras.map((v) => (
                <option key={v.cedula_ruc} value={v.cedula_ruc}>
                  {v.nombre}
                </option>
              ))}
            </select>
          </>
        )}

        <div className="button-container">
          <button type="submit" className="btn-guardar">Guardar Cambios</button>
          <button type="button" className="btn-cerrar" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarProspecto;
