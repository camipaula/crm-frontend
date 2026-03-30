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
    <div className="va-wrapper">
      <button className="va-btn-volver" onClick={() => navigate(-1)}>
        ⬅ Volver
      </button>

      <div className="va-header">
        <div>
          <h1 className="va-title">Gestión de Vendedoras</h1>
          <p className="va-subtitle">Administra los accesos y estados de tu equipo</p>
        </div>

        {!esSoloLectura && (
          <button className="va-btn-crear" onClick={() => navigate("/crear-vendedora")}>
            + Crear Vendedora
          </button>
        )}
      </div>

      <div className="va-toolbar">
        <div className="va-filtros">
          <label>Estado:</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="1">Activas</option>
            <option value="0">Inactivas</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="va-loading">
          <div className="va-spinner"></div>
          <p>Cargando equipo...</p>
        </div>
      )}
      
      {error && <div className="va-error">{error}</div>}

      {!loading && !error && (
        <div className="va-card">
          {/* TABLA ESCRITORIO */}
          <div className="va-table-container">
            <table className="va-table">
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
                    <td className="va-td-light">{v.cedula_ruc}</td>
                    <td className="va-td-bold">{v.nombre.toUpperCase()}</td>
                    <td className="va-td-light">{v.email.toLowerCase()}</td>
                    <td>
                      <span className={`va-badge ${v.estado === 1 ? "va-badge-activa" : "va-badge-inactiva"}`}>
                        {v.estado === 1 ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td>
                      <button className="va-btn-editar" onClick={() => navigate(`/editar-vendedora/${v.cedula_ruc}`)}>
                        ✏️ Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TARJETAS MÓVIL */}
          <div className="va-mobile-cards">
            {vendedoras.map((v) => (
              <div className="va-m-card" key={v.cedula_ruc}>
                <div className="va-m-header">
                  <span className="va-td-bold">{v.nombre.toUpperCase()}</span>
                  <span className={`va-badge ${v.estado === 1 ? "va-badge-activa" : "va-badge-inactiva"}`}>
                    {v.estado === 1 ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <div className="va-m-body">
                  <p><span>C.I:</span> {v.cedula_ruc}</p>
                  <p><span>Email:</span> {v.email.toLowerCase()}</p>
                </div>
                <button className="va-btn-editar va-btn-full" onClick={() => navigate(`/editar-vendedora/${v.cedula_ruc}`)}>
                  ✏️ Editar Perfil
                </button>
              </div>
            ))}
          </div>

          {vendedoras.length === 0 && (
            <div className="va-empty">
              No hay vendedoras {filtroEstado === "1" ? "activas" : filtroEstado === "0" ? "inactivas" : "registradas"}.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VendedorasAdmin;