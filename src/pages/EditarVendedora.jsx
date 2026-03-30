import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRol } from "../utils/auth";
import "../styles/editarVendedora.css";

const EditarVendedora = () => {
  const { cedula_ruc } = useParams();
  const navigate = useNavigate();
  const rol = getRol();
  const esSoloLectura = rol === "lectura";

  const [vendedora, setVendedora] = useState(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [estado, setEstado] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerVendedora();
  }, []);

  const obtenerVendedora = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras/${cedula_ruc}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al obtener datos de la vendedora");

      const data = await res.json();
      setVendedora(data);
      setNombre(data.nombre);
      setEmail(data.email);
      setEstado(data.estado);
    } catch (err) {
      setError(err.message);
    }
  };

  const guardarCambios = async (e) => {
    e.preventDefault(); // Previene recarga si se envuelve en un form
    try {
      const token = localStorage.getItem("token");
      const bodyData = { nombre, email, estado };

      if (password.trim()) {
        bodyData.password = password;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras/${cedula_ruc}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) throw new Error("Error al guardar cambios");

      alert("¡Perfil actualizado con éxito!");
      navigate(-1);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleEstado = async () => {
    try {
      const nuevoEstado = estado === 1 ? 0 : 1;
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras/${cedula_ruc}/inactivar`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al cambiar el estado");
      }

      setEstado(nuevoEstado);
      alert(`Estado actualizado a: ${nuevoEstado === 1 ? "ACTIVA" : "INACTIVA"}`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!vendedora && !error) return (
    <div className="ev-wrapper">
      <div className="ev-loading">Cargando perfil...</div>
    </div>
  );

  return (
    <div className="ev-wrapper">
      <button className="ev-btn-volver" onClick={() => navigate(-1)}>
        ⬅ Volver al listado
      </button>

      <div className="ev-card">
        <div className="ev-card-header">
          <h2>Perfil de Vendedora</h2>
          <span className={`ev-badge ${estado === 1 ? "ev-badge-activa" : "ev-badge-inactiva"}`}>
            {estado === 1 ? "ACTIVA" : "INACTIVA"}
          </span>
        </div>

        {error && <div className="ev-error">{error}</div>}

        <form className="ev-form" onSubmit={guardarCambios}>
          <div className="ev-form-group">
            <label>Cédula / RUC (No editable)</label>
            <input type="text" value={cedula_ruc} disabled />
          </div>

          <div className="ev-form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={esSoloLectura}
              placeholder="Ej. María Pérez"
            />
          </div>

          <div className="ev-form-group">
            <label>Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={esSoloLectura}
              placeholder="correo@empresa.com"
            />
          </div>

          <div className="ev-form-group">
            <label>Nueva Contraseña <span className="ev-optional">(Solo si desea cambiarla)</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={esSoloLectura}
              placeholder="••••••••"
            />
          </div>

          {!esSoloLectura && (
            <div className="ev-actions">
              <button type="submit" className="ev-btn-guardar">
                💾 Guardar Cambios
              </button>

              <button 
                type="button" 
                onClick={toggleEstado} 
                className={`ev-btn-toggle ${estado === 1 ? "ev-btn-danger" : "ev-btn-success"}`}
              >
                {estado === 1 ? "🚫 Inactivar Usuario" : "✅ Activar Usuario"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditarVendedora;