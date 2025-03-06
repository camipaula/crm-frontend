import { useState, useEffect } from "react"; 
import { useParams, useNavigate } from "react-router-dom";

const DetalleProspecto = () => {
  const { id_prospecto } = useParams();
  const navigate = useNavigate();
  const [prospecto, setProspecto] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [rolUsuario, setRolUsuario] = useState(""); // Estado para el rol del usuario

  useEffect(() => {
    const cargarDetalle = async () => {
      try {
        const token = localStorage.getItem("token");
        const rol = localStorage.getItem("rol");
        if (!token || !rol) throw new Error("No estás autenticado. Inicia sesión nuevamente.");
        
        setRolUsuario(rol); 

        //Agregar el token correctamente en la solicitud
        const res = await fetch(`http://localhost:5000/api/prospectos/${id_prospecto}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // Incluir el token
          },
        });

        if (!res.ok) throw new Error("Error al cargar los detalles del prospecto.");
        const data = await res.json();
        setProspecto(data);
      } catch (err) {
        console.error(" Error al obtener el prospecto:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDetalle();
  }, [id_prospecto]);

  if (loading) return <p>Cargando detalles...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="detalle-prospecto-container">
      <h1>Detalles del Prospecto</h1>
      {error && <p className="error">{error}</p>}

      <p><strong>Nombre:</strong> {prospecto.nombre}</p>
      <p><strong>Correo:</strong> {prospecto.correo}</p>
      <p><strong>Teléfono:</strong> {prospecto.telefono}</p>
      <p><strong>Dirección:</strong> {prospecto.direccion}</p>
      <p><strong>Provincia:</strong> {prospecto.provincia}</p>
      <p><strong>Ciudad:</strong> {prospecto.ciudad}</p>
      <p><strong>Sector:</strong> {prospecto.sector}</p>
      <p><strong>Nota:</strong> {prospecto.nota}</p>
      <p><strong>Estado:</strong> {prospecto.estado}</p>
      <p><strong>Vendedora:</strong> {prospecto.vendedora_prospecto?.nombre ?? "No asignada"}</p>

      <div className="button-container">
        {/* Botón para volver a la lista */}
        <button 
          className="btn-volver" 
          onClick={() => navigate(rolUsuario === "admin" ? "/prospectos-admin" : "/prospectos-vendedora")}
        >
          Volver
        </button>

        {/*  Botón para editar el prospecto (Solo admins pueden editar) */}
        {rolUsuario === "admin" && (
          <button 
            className="btn-editar" 
            onClick={() => navigate(`/editar-prospecto/${id_prospecto}`)}
          >
            Editar
          </button>
        )}
      </div>
    </div>
  );
};

export default DetalleProspecto;
