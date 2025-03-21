import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/vendedorasAdmin.css";

const VendedorasAdmin = () => {
  const [vendedoras, setVendedoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas"); // ✅ Por defecto, "todas"
  const navigate = useNavigate();

  useEffect(() => {
    obtenerVendedoras();
  }, [filtroEstado]); // ✅ Recargar lista al cambiar filtro

  const obtenerVendedoras = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al obtener vendedoras");
      const data = await res.json();

      // ✅ Filtrar según estado: "todas", 1 (activa), 0 (inactiva)
      const filtradas =
        filtroEstado === "todas" ? data : data.filter((v) => v.estado === parseInt(filtroEstado, 10));
      
      setVendedoras(filtradas);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarVendedora = async (cedula_ruc) => {
    try {
      const confirmar = window.confirm("¿Estás seguro de eliminar a esta vendedora?");
      if (!confirmar) return;

      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras/${cedula_ruc}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al eliminar vendedora");

      alert("Vendedora eliminada correctamente");
      obtenerVendedoras();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="content">
      <div className="vendedoras-container">
        <h1 className="title">Vendedoras</h1>

        <div className="filtros">
          <label>Filtrar por estado:</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="1">Activas</option>
            <option value="0">Inactivas</option>
          </select>
        </div>

        <button className="btn-crear" onClick={() => navigate("/crear-vendedora")}>
          ➕ Crear Vendedora
        </button>

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
                  <button className="btn-eliminar" onClick={() => eliminarVendedora(v.cedula_ruc)}>
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {vendedoras.length === 0 && !loading && (
          <p>No hay vendedoras {filtroEstado === "1" ? "activas" : filtroEstado === "0" ? "inactivas" : "registradas"}.</p>
        )}
      </div>
    </div>
  );
};

export default VendedorasAdmin;
