import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRol } from "../utils/auth";
import "../styles/editarProspecto.css";

const EditarProspecto = () => {
  const { id_prospecto } = useParams();
  const navigate = useNavigate();
  const [prospecto, setProspecto] = useState(null);
  const [vendedoras, setVendedoras] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false); // ✅ Estado para alternar entre vista y edición

  const rolUsuario = getRol();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No estás autenticado. Inicia sesión nuevamente.");

        const resProspecto = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/${id_prospecto}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resProspecto.ok) throw new Error("Error al cargar el prospecto.");
        const dataProspecto = await resProspecto.json();
        setProspecto(dataProspecto);

        if (rolUsuario === "admin") {
          const resVendedoras = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!resVendedoras.ok) throw new Error("Error al cargar vendedoras.");
          setVendedoras(await resVendedoras.json());
        }

        const resCategorias = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resCategorias.ok) throw new Error("Error al cargar categorías.");
        setCategorias(await resCategorias.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id_prospecto, rolUsuario]);

  const handleChange = (e) => {
    if (!prospecto) return;
    setProspecto((prev) => ({ ...prev, [e.target.name]: e.target.value || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");
  
    if (!prospecto) return;
  
    const token = localStorage.getItem("token");
  
    try {
      // 🔹 Filtramos valores vacíos y los convertimos en `null`
      const prospectoFiltrado = Object.fromEntries(
        Object.entries(prospecto).map(([key, value]) => [key, value === "" ? null : value])
      );
  
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/${id_prospecto}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(prospectoFiltrado),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el prospecto.");
      }
  
      setMensaje("Prospecto actualizado con éxito.");
      setModoEdicion(false);
    } catch (err) {
      setError(err.message);
    }
  };
  

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="editar-prospecto-container">
      <h1>Información del Prospecto</h1>
      {mensaje && <p className="success">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>Nombre:</label>
        <input type="text" name="nombre" value={prospecto?.nombre || ""} onChange={handleChange} disabled={!modoEdicion} />

        <label>Descripción:</label>
        <textarea name="descripcion" value={prospecto?.descripcion || ""} onChange={handleChange} disabled={!modoEdicion} />

        <label>Categoría:</label>
        <select name="id_categoria" value={prospecto?.id_categoria || ""} onChange={handleChange} disabled={!modoEdicion}>
          <option value="">Seleccione...</option>
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
          ))}
        </select>

        <label>Origen:</label>
        <select name="id_origen" value={prospecto?.id_origen || ""} onChange={handleChange} disabled={!modoEdicion}>
          <option value="publicidad">Publicidad</option>
          <option value="referencias">Referencias</option>
          <option value="online">Online</option>
          <option value="evento">Evento</option>
          <option value="contacto_directo">Contacto Directo</option>
          <option value="visita">Visita</option>
          <option value="otros">Otros</option>
        </select>

        <label>Nota:</label>
        <textarea name="nota" value={prospecto?.nota || ""} onChange={handleChange} disabled={!modoEdicion} />

        <label>Estado:</label>
        <select name="estado" value={prospecto?.estado || ""} onChange={handleChange} disabled={!modoEdicion}>
          <option value="nuevo">Nuevo</option>
          <option value="interesado">Interesado</option>
          <option value="proformado">Proformado</option>
          <option value="ganado">Ganado</option>
          <option value="archivado">Archivado</option>
          <option value="perdido">Perdido</option>
        </select>

        <label>Correo:</label>
        <input type="email" name="correo" value={prospecto?.correo || ""} onChange={handleChange} disabled={!modoEdicion} />

        <label>Teléfono:</label>
        <input type="text" name="telefono" value={prospecto?.telefono || ""} onChange={handleChange} disabled={!modoEdicion} />

        <label>Dirección:</label>
        <input type="text" name="direccion" value={prospecto?.direccion || ""} onChange={handleChange} disabled={!modoEdicion} />

        {rolUsuario === "admin" && (
          <>
            <label>Vendedora asignada:</label>
            <select name="cedula_vendedora" value={prospecto?.cedula_vendedora || ""} onChange={handleChange} disabled={!modoEdicion}>
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
          {modoEdicion ? (
            <>
              <button type="submit" className="btn-guardar">Guardar Cambios</button>
              <button type="button" className="btn-cerrar" onClick={() => setModoEdicion(false)}>Cancelar</button>
            </>
          ) : (
            <button type="button" className="btn-editar" onClick={() => setModoEdicion(true)}>✏️ Editar</button>
          )}
          <button type="button" className="btn-cerrar" onClick={() => navigate(-1)}>Volver</button>
        </div>
      </form>
    </div>
  );
};

export default EditarProspecto;
