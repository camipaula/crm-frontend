import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/editarVendedora.css";

const EditarVendedora = () => {
  const { cedula_ruc } = useParams();
  const navigate = useNavigate();
  const [vendedora, setVendedora] = useState(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerVendedora();
  }, []);

  const obtenerVendedora = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/usuarios/vendedoras/${cedula_ruc}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al obtener vendedora");

      const data = await res.json();
      setVendedora(data);
      setNombre(data.nombre);
      setEmail(data.email);
    } catch (err) {
      setError(err.message);
    }
  };

  const guardarCambios = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/usuarios/vendedoras/${cedula_ruc}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre, email }),
      });

      if (!res.ok) throw new Error("Error al guardar cambios");

      alert("Cambios guardados correctamente");
      navigate(-1);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!vendedora) return <p>Cargando vendedora...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="editar-vendedora-container">
      <h1>Editar Vendedora</h1>

      <div className="form-group">
        <label>Nombre:</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button onClick={guardarCambios} className="btn-guardar">
        Guardar Cambios
      </button>
    </div>
  );
};

export default EditarVendedora;
