import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/abrirVenta.css";

const AbrirVenta = () => {
  const { id_prospecto } = useParams();
  const navigate = useNavigate();
  const [objetivo, setObjetivo] = useState("");
  const [id_categoria_venta, setIdCategoriaVenta] = useState(null);
  const [categoriasVenta, setCategoriasVenta] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
    const token = localStorage.getItem("token");
    fetch(`${baseUrl}/api/categorias-venta`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((raw) => {
        const list = Array.isArray(raw)
          ? raw
          : raw && Array.isArray(raw.data)
            ? raw.data
            : raw && Array.isArray(raw.categorias)
              ? raw.categorias
              : [];
        const normalizadas = list.map((c) => ({
          id_categoria_venta: c.id_categoria_venta ?? c.id,
          nombre: c.nombre ?? c.name ?? String(c.id_categoria_venta ?? c.id ?? ""),
        }));
        setCategoriasVenta(normalizadas);
      })
      .catch(() => setCategoriasVenta([]));
  }, []);

  const crearVenta = async () => {
    if (!objetivo.trim()) {
      setError("Por favor ingresa un objetivo para la prospección.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const body = {
        id_prospecto: Number(id_prospecto),
        objetivo: objetivo.trim(),
        estado: "Captación/ensayo",
      };
      if (id_categoria_venta != null) body.id_categoria_venta = id_categoria_venta;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Error creando la prospección");

      const data = await res.json();

      navigate(`/seguimientos-prospeccion/${data.id_venta}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="abrir-venta-container">
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

      <h1>Abrir Nueva Prospección</h1>

      <label>Objetivo de la prospección <span className="required">*</span></label>
      <textarea
        placeholder="Objetivo de la prospección"
        value={objetivo}
        onChange={(e) => {
          setObjetivo(e.target.value);
          setError("");
        }}
      />

      <label>Categoría de venta</label>
      <select
        value={id_categoria_venta ?? ""}
        onChange={(e) => setIdCategoriaVenta(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Seleccione categoría de venta...</option>
        {categoriasVenta.map((c) => (
          <option key={c.id_categoria_venta} value={c.id_categoria_venta}>
            {c.nombre}
          </option>
        ))}
      </select>

      <button onClick={crearVenta}>Abrir Prospección</button>

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default AbrirVenta;
