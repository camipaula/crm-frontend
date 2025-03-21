import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/abrirVenta.css";

const AbrirVenta = () => {
  const { id_prospecto } = useParams();
  const navigate = useNavigate();
  const [objetivo, setObjetivo] = useState("");
  const [error, setError] = useState("");

  const crearVenta = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id_prospecto, objetivo }),
      });

      if (!res.ok) throw new Error("Error creando la venta");

      alert("Venta creada exitosamente");
      navigate(-1);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="abrir-venta-container">
      <h1>Abrir Nueva Prospección</h1>
      <textarea
        placeholder="Objetivo de la prospección"
        value={objetivo}
        onChange={(e) => setObjetivo(e.target.value)}
      />

      <button onClick={crearVenta}>Abrir Prospección</button>

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default AbrirVenta;
