import { useEffect, useState } from "react";
import { logout } from "../utils/auth";
import "../styles/miInformacionAdmin.css";

const MiInformacionAdmin = () => {
  const [admin, setAdmin] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const obtenerPerfil = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/mi-perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          alert("Tu sesión ha expirado.");
          logout();
          return;
        }

        const data = await res.json();
        setAdmin(data);
        setEmail(data.email || "");
      } catch (error) {
        console.error("Error al obtener perfil:", error);
        alert("No se pudo cargar la información del perfil.");
      }
    };

    obtenerPerfil();
  }, []);

  const guardarCambios = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/mi-perfil`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await res.json();
      alert(result.message || "Información actualizada correctamente");
      setModoEdicion(false);
      setPassword("");
      setAdmin((prev) => ({
        ...prev,
        email,
      }));
    } catch (err) {
      console.error(err);
      alert("Error al guardar cambios");
    }
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setEmail(admin?.email || "");
    setPassword("");
  };

  if (!admin) {
    return (
      <div className="mia-container">
        <div className="mia-loading-card">
          <p className="mia-loading-text">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mia-container">
      <div className="mia-header">
        <div>
          <h1 className="mia-title">Mi Información</h1>
          <p className="mia-subtitle">
            Consulta y actualiza tus datos personales de acceso.
          </p>
        </div>
      </div>

      <div className="mia-card">
        <div className="mia-card-header">
          <div>
            <h2 className="mia-card-title">Perfil de administrador</h2>
            <p className="mia-card-subtitle">
              Mantén actualizada tu información de contacto.
            </p>
          </div>
        </div>

        <div className="mia-info-grid">
          <div className="mia-info-item">
            <span className="mia-label">Cédula</span>
            <div className="mia-value-box">{admin.cedula_ruc}</div>
          </div>

          <div className="mia-info-item">
            <span className="mia-label">Nombre</span>
            <div className="mia-value-box">{admin.nombre}</div>
          </div>

          <div className="mia-info-item mia-full">
            <span className="mia-label">Email</span>
            {modoEdicion ? (
              <input
                className="mia-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu correo"
              />
            ) : (
              <div className="mia-value-box">{admin.email}</div>
            )}
          </div>

          <div className="mia-info-item mia-full">
            <span className="mia-label">Contraseña</span>
            {modoEdicion ? (
              <input
                className="mia-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa una nueva contraseña"
              />
            ) : (
              <div className="mia-value-box">********</div>
            )}
          </div>
        </div>

        <div className="mia-actions">
          {modoEdicion ? (
            <>
              <button className="mia-btn mia-btn-primary" onClick={guardarCambios}>
                Guardar cambios
              </button>
              <button className="mia-btn mia-btn-secondary" onClick={cancelarEdicion}>
                Cancelar
              </button>
            </>
          ) : (
            <button
              className="mia-btn mia-btn-primary"
              onClick={() => setModoEdicion(true)}
            >
              Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiInformacionAdmin;