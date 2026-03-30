import { useState } from "react";
import "../styles/crearVendedora.css";
import { useNavigate } from "react-router-dom";

const CrearVendedora = () => {
  const navigate = useNavigate();
  const [cedula_ruc, setCedulaRuc] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const crearVendedora = async () => {
    try {
      setError("");
      setMensaje("");

      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cedula_ruc,
          nombre,
          email,
          password,
          rol: "vendedora",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error creando vendedora");
      }

      setMensaje("Vendedora creada exitosamente");
      navigate(-1);
      setCedulaRuc("");
      setNombre("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="cv-container">
      <div className="cv-header">
        <div>
          <h1 className="cv-title">Crear nueva vendedora</h1>
          <p className="cv-subtitle">
            Registra una nueva usuaria comercial dentro del sistema.
          </p>
        </div>

        <div className="cv-header-actions">
          <button className="cv-btn cv-btn-secondary" onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>

      {(mensaje || error) && (
        <div className="cv-alerts">
          {mensaje && <div className="cv-alert cv-alert-success">{mensaje}</div>}
          {error && <div className="cv-alert cv-alert-error">{error}</div>}
        </div>
      )}

      <div className="cv-card">
        <div className="cv-card-head">
          <div>
            <h3>Información de la vendedora</h3>
            <p>Completa los datos para crear el nuevo usuario.</p>
          </div>
        </div>

        <div className="cv-form-grid">
          <div className="cv-field">
            <label>Cédula / RUC</label>
            <input
              className="cv-input"
              type="text"
              placeholder="Ingresa la cédula o RUC"
              value={cedula_ruc}
              onChange={(e) => setCedulaRuc(e.target.value)}
            />
          </div>

          <div className="cv-field">
            <label>Nombre</label>
            <input
              className="cv-input"
              type="text"
              placeholder="Ingresa el nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="cv-field">
            <label>Correo electrónico</label>
            <input
              className="cv-input"
              type="email"
              placeholder="Ingresa el correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="cv-field">
            <label>Contraseña</label>
            <input
              className="cv-input"
              type="password"
              placeholder="Ingresa la contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="cv-actions">
          <button className="cv-btn cv-btn-primary" onClick={crearVendedora}>
            Crear vendedora
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrearVendedora;