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
      const res = await fetch("http://localhost:5000/api/ventas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id_prospecto, objetivo }),
      });

      if (!res.ok) throw new Error("Error creando la venta");

      alert("Venta creada exitosamente");
      navigate("/seguimientos-vendedora");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="abrir-venta-container">
      <h1>Abrir Nueva Venta</h1>
      <p><strong>Prospecto ID:</strong> {id_prospecto}</p>

      <textarea
        placeholder="Objetivo de la venta"
        value={objetivo}
        onChange={(e) => setObjetivo(e.target.value)}
      />

      <button onClick={crearVenta}>Abrir Venta</button>

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default AbrirVenta;
