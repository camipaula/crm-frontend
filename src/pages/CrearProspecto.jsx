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
    const [estados, setEstados] = useState([]);
    const [enviando, setEnviando] = useState(false);

    const [categorias, setCategorias] = useState([]);
    const [origenes, setOrigenes] = useState([]);

    const [formData, setFormData] = useState({
      nombre: "",
      nombre_contacto: "",
      descripcion: "",
      id_categoria: null,
      id_origen: null,
      nota: "",
      id_estado: null,
      correo: "",
      telefono: "",
      direccion: "",
      provincia: "",
      ciudad: "",
      sector: "",
      cedula_ruc: "",
      cedula_vendedora: "",
      created_at: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {

      obtenerCategorias();
      cargarEstados();
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

    const cargarEstados = async () => {
      try {
        const token = localStorage.getItem("token"); //
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/estados`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();
        setEstados(data);

        // Establecer el estado por defecto como "nuevo"
        const estadoNuevo = data.find((e) => e.nombre === "nuevo");
        if (estadoNuevo) {
          setFormData((prev) => ({ ...prev, id_estado: estadoNuevo.id_estado }));
        }
      } catch (err) {
        console.error("Error al cargar estados:", err);
        setError("No se pudieron cargar los estados.");
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

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: name === "id_categoria" ? (value ? Number(value) : null) : value,
      }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);
      setMensaje(null);
      setEnviando(true); // empieza a enviar

      if (!formData.nombre || !formData.id_estado) {
        setEnviando(false);
        return setError("El nombre y el estado son obligatorios.");
      }

      if (!formData.origen) {
        setEnviando(false);
        return setError("Debe seleccionar un origen.");
      }

      if (!formData.id_categoria) {
        setEnviando(false);
        return setError("Debe seleccionar una categoría.");
      }

      /*if (!formData.telefono && !formData.correo) {
        setEnviando(false);
        return setError("Debe ingresar al menos un teléfono o un correo.");
      }*/

      if (!formData.cedula_vendedora) {
        setEnviando(false);
        return setError("Debe asignar una vendedora.");
      }

      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error al crear prospecto");

        setMensaje("Prospecto creado exitosamente.");
        setTimeout(() => {
          navigate(esAdmin ? "/prospectos-admin" : "/prospectos-vendedora");
        }, 2000);
      } catch (err) {
        setError(err.message);
      } finally {
        setEnviando(false); // 🔹 termina el envío
      }
    };


    return (
      <div className="crear-prospecto-container">
        <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>
        <h1>Crear Prospecto</h1>

        {mensaje && <p className="success">{mensaje}</p>}
        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Nombre <span className="required">*</span>:</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />


          <label>Categoría <span className="required">*</span>:</label>
          <select
            name="id_categoria"
            value={formData.id_categoria || ""}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione una categoría...</option>
            {categorias.map((c) => (
              <option key={c.id_categoria} value={c.id_categoria}>
                {c.nombre}
              </option>
            ))}
          </select>

          <label>Nombre del Contacto:</label>
          <input type="text" name="nombre_contacto" value={formData.nombre_contacto} onChange={handleChange} />

          <label>Correo: </label>
          <input type="email" name="correo" value={formData.correo} onChange={handleChange} />

          <label>Teléfono: </label>
          <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />

          <label>Dirección:</label>
          <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} />

          <label>Provincia:</label>
          <input type="text" name="provincia" value={formData.provincia} onChange={handleChange} />

          <label>Ciudad:</label>
          <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} />

          <label>Sector:</label>
          <input type="text" name="sector" value={formData.sector} onChange={handleChange} />

          <label>Cédula/RUC:</label>
          <input type="text" name="cedula_ruc" value={formData.cedula_ruc} onChange={handleChange} />

          <label>Origen <span className="required">*</span>:</label>
          <select name="id_origen" value={formData.id_origen || ""} onChange={handleChange} required>
            <option value="">Seleccione...</option>
            {origenes.map((o) => (
              <option key={o.id_origen} value={o.id_origen}>{o.descripcion}</option>
            ))}
          </select>



          <label>Descripción:</label>
          <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} />

          <label>Nota:</label>
          <textarea name="nota" value={formData.nota} onChange={handleChange} />

          <label>Estado:</label>
          <p className="estado-label">
            {estados.find((e) => e.id_estado === formData.id_estado)?.nombre || "nuevo"}
          </p>



          <label>Fecha de Creación:</label>
          <input type="date" name="created_at" value={formData.created_at} onChange={handleChange} />

          {/* Solo si es admin, muestra selector de vendedora */}
          {esAdmin && (
            <>
              <label>Asignar Vendedora <span className="required">*</span>:</label>
              <select
                name="cedula_vendedora"
                value={formData.cedula_vendedora}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione una vendedora...</option>
                {vendedoras.map((v) => (
                  <option key={v.cedula_ruc} value={v.cedula_ruc}>{v.nombre}</option>
                ))}
              </select>
            </>
          )}

          <button type="submit" disabled={enviando}>
            {enviando ? "Creando..." : "Crear Prospecto"}
          </button>
          <button type="button" className="btn-cerrar" onClick={() => navigate(-1)}>Cerrar</button>
        </form>
      </div>
    );
  };

  export default CrearProspecto;
