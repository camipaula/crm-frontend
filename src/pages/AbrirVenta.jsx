import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/abrirVenta.css";

const AbrirVenta = () => {
  const { id_prospecto } = useParams();
  const navigate = useNavigate();
  const [objetivo, setObjetivo] = useState("");
  const [error, setError] = useState("");

  const crearVenta = async () => {
    if (!objetivo.trim()) {
      setError("Por favor ingresa un objetivo para la prospección.");
      return;
    }

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

      if (!res.ok) throw new Error("Error creando la prospección");

      alert("Prospección creada exitosamente");
      navigate(-1);
    } catch (err) {
      setError(err.message);
    }
  };


  return (
    <div className="abrir-venta-container">
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

      <h1>Abrir Nueva Prospección</h1>
      <textarea
        placeholder="Objetivo de la prospección"
        value={objetivo}
        onChange={(e) => {
          setObjetivo(e.target.value);
          setError(""); 
        }}
      />


      <button onClick={crearVenta}>Abrir Prospección</button>

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default AbrirVenta;
