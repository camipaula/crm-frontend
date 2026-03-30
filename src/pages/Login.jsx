import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true); // Deshabilita el botón mientras carga

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error en login");

      // Guardamos en localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("rol", data.rol);

      // Redirigir según el rol
      setTimeout(() => {
        if (data.rol === "admin") {
          navigate("/admin");
        } else if (data.rol === "vendedora") {
          navigate("/vendedora");
        } else if (data.rol === "lectura") {
          navigate("/admin");
        } else {
          navigate("/");
        }
        window.location.reload();
      }, 100);

    } catch (error) {
      setError(error.message);
      setIsSubmitting(false); // Vuelve a habilitar el botón si hay error
    }
  };

  return (
    <div className="lg-container">
      <div className="lg-box">
        
        <div className="lg-header">
          <div className="lg-logo">
            <span className="lg-emoji">🏢</span>
          </div>
          <h2 className="lg-title">Bienvenido de nuevo</h2>
          <p className="lg-subtitle">Ingresa tus credenciales para acceder al CRM</p>
        </div>

        {error && <div className="lg-error">{error}</div>}

        <form className="lg-form" onSubmit={handleLogin}>
          <div className="lg-input-group">
            <label>Correo Electrónico</label>
            <input
              className="lg-input"
              type="email"
              placeholder="ejemplo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="lg-input-group">
            <label>Contraseña</label>
            <input
              className="lg-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <button className="lg-btn-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;