import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRol } from "../utils/auth";
import "../styles/editarProspecto.css"; // Asegúrate de que el nombre coincida
import React from "react";

const EditarProspecto = () => {
  const { id_prospecto } = useParams();
  const navigate = useNavigate();
  const [prospecto, setProspecto] = useState(null);
  const [prospectoOriginal, setProspectoOriginal] = useState(null);
  const [vendedoras, setVendedoras] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [origenes, setOrigenes] = useState([]);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);

  const rolUsuario = getRol();
  const esSoloLectura = rolUsuario === "lectura";

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No estás autenticado. Inicia sesión nuevamente.");

        const [resOrigenes, resProspecto, resCategorias] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/origenes`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/${id_prospecto}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${import.meta.env.VITE_API_URL}/api/categorias`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (!resOrigenes.ok) throw new Error("Error al cargar orígenes.");
        if (!resProspecto.ok) throw new Error("Error al cargar el prospecto.");
        if (!resCategorias.ok) throw new Error("Error al cargar categorías.");

        setOrigenes(await resOrigenes.json());
        const dataProspecto = await resProspecto.json();
        setProspecto(dataProspecto);
        setProspectoOriginal(dataProspecto); // 👈 AQUÍ GUARDAMOS LA COPIA INTACTA
        setCategorias(await resCategorias.json());

        if (rolUsuario === "admin") {
          const resVendedoras = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!resVendedoras.ok) throw new Error("Error al cargar vendedoras.");
          setVendedoras(await resVendedoras.json());
        }

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

      setMensaje("✅ Prospecto actualizado con éxito.");
      setModoEdicion(false);

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setMensaje(""), 3000);

    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="ep-loading">Cargando ficha del prospecto...</div>;

  return (
    <div className="ep-container">
      {/* HEADER */}
      <div className="ep-header">
        <div className="ep-header-left">
          <button className="ep-btn-outline" onClick={() => navigate(-1)}>⬅️ Volver</button>
          <div className="ep-header-titles">
            <h1 className="ep-title">Ficha del Prospecto</h1>
            <p className="ep-subtitle">{prospecto?.nombre || "Cargando..."}</p>
          </div>
        </div>

        <div className="ep-header-actions">
          {!esSoloLectura && !modoEdicion && (
            <button type="button" className="ep-btn-primary" onClick={() => setModoEdicion(true)}>
              ✏️ Activar Edición
            </button>
          )}
        </div>
      </div>

      {mensaje && <div className="ep-alert-success">{mensaje}</div>}
      {error && <div className="ep-alert-error">{error}</div>}

      {/* FORMULARIO / VISTA */}
      <div className="ep-card">
        <form onSubmit={handleSubmit} className="ep-form">
          
          <h3 className="ep-section-title">Información Principal</h3>
          <div className="ep-grid">
            <div className="ep-form-group">
              <label>Nombre de la Empresa / Prospecto</label>
              <input type="text" name="nombre" value={prospecto?.nombre || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-input" />
            </div>

            <div className="ep-form-group">
              <label>Nombre del Contacto</label>
              <input type="text" name="nombre_contacto" value={prospecto?.nombre_contacto || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-input" />
            </div>

            <div className="ep-form-group">
              <label>Cédula / RUC</label>
              <input type="text" name="cedula_ruc" value={prospecto?.cedula_ruc || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-input" />
            </div>

            <div className="ep-form-group">
              <label>Número de Empleados</label>
              <input type="number" name="empleados" value={prospecto?.empleados ?? ""} onWheel={(e) => e.target.blur()} min="0" onChange={handleChange} disabled={!modoEdicion} className="ep-input" />
            </div>

            <div className="ep-form-group ep-full-width">
              <label>Descripción</label>
              <textarea name="descripcion" value={prospecto?.descripcion || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-textarea" rows="3" />
            </div>
          </div>

          <div className="ep-divider"></div>

          <h3 className="ep-section-title">Clasificación</h3>
          <div className="ep-grid">
            <div className="ep-form-group">
              <label>Categoría</label>
              <select name="id_categoria" value={prospecto?.id_categoria || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-select">
                <option value="">Seleccione...</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="ep-form-group">
              <label>Origen de captación</label>
              <select name="id_origen" value={prospecto?.id_origen || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-select">
                <option value="">Seleccione...</option>
                {origenes.map((o) => (
                  <option key={o.id_origen} value={o.id_origen}>{o.descripcion}</option>
                ))}
              </select>
            </div>

            <div className="ep-form-group ep-full-width">
              <label>Nota Interna / Observaciones</label>
              <textarea name="nota" value={prospecto?.nota || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-textarea" rows="2" />
            </div>
          </div>

          <div className="ep-divider"></div>

          <h3 className="ep-section-title">Datos de Contacto y Ubicación</h3>
          <div className="ep-grid">
            <div className="ep-form-group">
              <label>Correo Electrónico</label>
              <input type="email" name="correo" value={prospecto?.correo || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-input" />
            </div>

            <div className="ep-form-group">
              <label>Teléfono</label>
              <input type="text" name="telefono" value={prospecto?.telefono || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-input" />
            </div>

            <div className="ep-form-group">
              <label>Provincia</label>
              <input type="text" name="provincia" value={prospecto?.provincia || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-input" />
            </div>

            <div className="ep-form-group">
              <label>Ciudad</label>
              <input type="text" name="ciudad" value={prospecto?.ciudad || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-input" />
            </div>

            <div className="ep-form-group">
              <label>Sector / Barrio</label>
              <input type="text" name="sector" value={prospecto?.sector || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-input" />
            </div>

            <div className="ep-form-group ep-full-width">
              <label>Dirección Exacta</label>
              <input type="text" name="direccion" value={prospecto?.direccion || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-input" />
            </div>
          </div>

          {rolUsuario === "admin" && (
            <>
              <div className="ep-divider"></div>
              <h3 className="ep-section-title">Administración</h3>
              <div className="ep-grid">
                <div className="ep-form-group">
                  <label>Vendedora Asignada</label>
                  <select name="cedula_vendedora" value={prospecto?.cedula_vendedora || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-select">
                    <option value="">Sin asignar</option>
                    {vendedoras.map((v) => (
                      <option key={v.cedula_ruc} value={v.cedula_ruc}>{v.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="ep-form-group">
                  <label>Fecha de Registro</label>
                  <input type="date" name="created_at" value={prospecto?.created_at?.slice(0, 10) || ""} onChange={handleChange} disabled={!modoEdicion} className="ep-input" />
                </div>
              </div>
            </>
          )}

          {/* BOTONES DE ACCIÓN (Solo visibles en modo edición) */}
          {modoEdicion && (
            <div className="ep-form-actions">
              <button type="button" className="ep-btn-ghost" onClick={() => {
                setProspecto(prospectoOriginal); 
                setError("");
              }}>
                Cancelar
              </button>
              <button type="submit" className="ep-btn-primary">
                💾 Guardar Cambios
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditarProspecto;