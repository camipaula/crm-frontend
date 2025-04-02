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
    const [modoEdicion, setModoEdicion] = useState(false);
    const [estados, setEstados] = useState([]);
    const [origenes, setOrigenes] = useState([]);

    const rolUsuario = getRol();

    useEffect(() => {



      const cargarDatos = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) throw new Error("No estás autenticado. Inicia sesión nuevamente.");

          const resOrigenes = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/origenes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!resOrigenes.ok) throw new Error("Error al cargar orígenes.");
          const dataOrigenes = await resOrigenes.json();
          setOrigenes(dataOrigenes);

          
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
          const resEstados = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/estados`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!resEstados.ok) throw new Error("Error al cargar estados.");
          const dataEstados = await resEstados.json();
          setEstados(dataEstados);

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
        <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

        <h1>Información del Prospecto</h1>
        <button type="button" className="btn-editar" onClick={() => setModoEdicion(true)}>✏️ Editar</button>

        {mensaje && <p className="success">{mensaje}</p>}
        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Nombre:</label>
          <input type="text" name="nombre" value={prospecto?.nombre || ""} onChange={handleChange} disabled={!modoEdicion} />

          <label>Nombre del Contacto:</label>
          <input type="text" name="nombre_contacto" value={prospecto?.nombre_contacto || ""} onChange={handleChange} disabled={!modoEdicion} />

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
    <option value="">Seleccione...</option>
    {origenes.map((o) => (
      <option key={o.id_origen} value={o.id_origen}>{o.descripcion}</option>
    ))}
  </select>


          <label>Nota:</label>
          <textarea name="nota" value={prospecto?.nota || ""} onChange={handleChange} disabled={!modoEdicion} />

          {!modoEdicion ? (
            <div>
              <label>Estado:</label>
              <p><strong>
    {prospecto?.estado_prospecto?.nombre
      ? prospecto.estado_prospecto.nombre
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : "Sin estado"}
  </strong></p>
            </div>
          ) : (
            <>
              <label>Estado:</label>
              <select
                name="id_estado"
                value={prospecto?.id_estado || ""}
                onChange={handleChange}
                disabled={!modoEdicion}
              >
                <option value="">Seleccione un estado...</option>
                {estados.map((e) => (
                  <option key={e.id_estado} value={e.id_estado}>
                    {e.nombre.charAt(0).toUpperCase() + e.nombre.slice(1).replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </>
          )}




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
            {modoEdicion && (
              <div className="button-container">
                <button type="submit" className="btn-guardar">Guardar Cambios</button>
                <button type="button" className="btn-cerrar" onClick={() => setModoEdicion(false)}>Cancelar</button>
              </div>
            )}

          </div>
        </form>
      </div>
    );
  };

  export default EditarProspecto;