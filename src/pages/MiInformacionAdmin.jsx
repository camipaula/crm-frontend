import { useEffect, useState } from "react";
import { logout } from "../utils/auth"; // 👈 asegúrate que esté importado
import "../styles/miInformacionAdmin.css";
 
const MiInformacionAdmin = () => {
  const [admin, setAdmin] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const obtenerPerfil = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/mi-perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (res.status === 401) {
        alert("Tu sesión ha expirado.");
        logout(); // 👈 Redirige al login y limpia token
        return;
      }
  
      const data = await res.json();
      setAdmin(data);
      setEmail(data.email);
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
    } catch (err) {
        console.error(err);

      alert("Error al guardar cambios");

    }
  };

  if (!admin) return <p>Cargando...</p>;

  return (
    <div className="mi-info-container">
      <h2>Mi Información</h2>
      <p><strong>Cédula:</strong> {admin.cedula_ruc}</p>
      <p><strong>Nombre:</strong> {admin.nombre}</p>
      <p>
        <strong>Email:</strong>{" "}
        {modoEdicion ? (
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        ) : (
          admin.email
        )}
      </p>
      <p>
        <strong>Contraseña:</strong>{" "}
        {modoEdicion ? (
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        ) : (
          "********"
        )}
      </p>
      <button onClick={() => setModoEdicion(!modoEdicion)}>
        {modoEdicion ? "Cancelar" : "Editar"}
      </button>
      {modoEdicion && <button onClick={guardarCambios}>Guardar Cambios</button>}
    </div>
  );
};

export default MiInformacionAdmin;
