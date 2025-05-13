import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRol } from "../utils/auth";

import "../styles/vendedorasAdmin.css";

const VendedorasAdmin = () => {
  const [vendedoras, setVendedoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const navigate = useNavigate();
  const rol = getRol(); 
  const esSoloLectura = rol === "lectura";


  useEffect(() => {
    obtenerVendedoras();
  }, [filtroEstado]);

  const obtenerVendedoras = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al obtener vendedoras");
      const data = await res.json();

      // Filtrar según estado: "todas", 1 (activa), 0 (inactiva)
      const filtradas =
        filtroEstado === "todas" ? data : data.filter((v) => v.estado === parseInt(filtroEstado, 10));

      setVendedoras(filtradas);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="content">
      <div className="vendedoras-container">
        <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

        <h1 className="title">Vendedor/a</h1>

        <div className="filtros">
          <label>Filtrar por estado:</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="1">Activas</option>
            <option value="0">Inactivas</option>
          </select>
        </div>

        {!esSoloLectura && (
          <button className="btn-crear" onClick={() => navigate("/crear-vendedora")}>
            ➕ Crear Vendedor/a
          </button>
        )}


        {loading && <p>Cargando vendedoras...</p>}
        {error && <p className="error">{error}</p>}

        <table className="vendedoras-table">
          <thead>
            <tr>
              <th>Cédula</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vendedoras.map((v) => (
              <tr key={v.cedula_ruc}>
                <td>{v.cedula_ruc}</td>
                <td>{v.nombre}</td>
                <td>{v.email}</td>
                <td>{v.estado === 1 ? "✅ Activa" : "❌ Inactiva"}</td>
                <td>
                  <button className="btn-editar" onClick={() => navigate(`/editar-vendedora/${v.cedula_ruc}`)}>
                    ✏️ Editar
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 🔹 Tarjetas para móviles */}
        <div className="cards-mobile">
          {vendedoras.map((v) => (
            <div className="vendedora-card" key={v.cedula_ruc}>
              <div className="info">
                <h3>{v.nombre}</h3>
                <p><strong>Cédula:</strong> {v.cedula_ruc}</p>
                <p><strong>Email:</strong> {v.email}</p>
                <p><strong>Estado:</strong> {v.estado === 1 ? "✅ Activa" : "❌ Inactiva"}</p>
              </div>
              <div className="acciones">
                <button className="btn-editar" onClick={() => navigate(`/editar-vendedora/${v.cedula_ruc}`)}>
                  ✏️
                </button>
              </div>
            </div>
          ))}
        </div>


        {vendedoras.length === 0 && !loading && (
          <p>No hay vendedoras {filtroEstado === "1" ? "activas" : filtroEstado === "0" ? "inactivas" : "registradas"}.</p>
        )}
      </div>
    </div>
  );
};

export default VendedorasAdmin;
