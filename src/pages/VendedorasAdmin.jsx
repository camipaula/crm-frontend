import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/vendedorasAdmin.css";

const VendedorasAdmin = () => {
  const [vendedoras, setVendedoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    obtenerVendedoras();
  }, []);

  const obtenerVendedoras = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al obtener vendedoras");
      const data = await res.json();
      setVendedoras(data);
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

        <button
          className="btn-crear"
          onClick={() => navigate("/crear-vendedora")}
        >
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vendedoras.map((v) => (
              <tr key={v.cedula_ruc}>
                <td>{v.cedula_ruc}</td>
                <td>{v.nombre}</td>
                <td>{v.email}</td>
                <td>
                  <button
                    className="btn-editar"
                    onClick={() => navigate(`/editar-vendedora/${v.cedula_ruc}`)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn-eliminar"
                    onClick={() => eliminarVendedora(v.cedula_ruc)}
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendedorasAdmin;
