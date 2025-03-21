import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerCedulaDesdeToken } from "../utils/auth";
import "../styles/seguimientosVendedora.css";

const SeguimientosVendedora = () => {
  const navigate = useNavigate();
  const [prospecciones, setProspecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  useEffect(() => {
    buscarSeguimientos();
  }, [filtroEstado]);

  const buscarSeguimientos = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const cedulaVendedora = obtenerCedulaDesdeToken();

      let url = `${import.meta.env.VITE_API_URL}/api/ventas/prospecciones?cedula_vendedora=${cedulaVendedora}`;
      if (filtroEstado !== "todas") url += `&estado_prospeccion=${filtroEstado}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (!res.ok) throw new Error("Error obteniendo prospecciones");
      const data = await res.json();
      setProspecciones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      const cedulaVendedora = obtenerCedulaDesdeToken();
      let url = `${import.meta.env.VITE_API_URL}/api/seguimientos/exportar?cedula_vendedora=${cedulaVendedora}`;

      if (filtroEstado !== "todas") url += `&estado_prospeccion=${filtroEstado}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const contentType = res.headers.get("content-type");

      if (contentType.includes("application/json")) {
        const data = await res.json();
        alert(data.message);
        return;
      }

      if (!res.ok) throw new Error("Error al exportar seguimientos");

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "seguimientos.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al exportar:", error);
    }
  };

  return (
    <div className="seguimientos-container">
      <h1 className="title">Mis Seguimientos de Prospectos</h1>

      <button className="exportar-btn" onClick={exportarExcel}>
        📥 Exportar a Excel
      </button>

      <div className="filtros-container">
        <label>Filtrar por estado:</label>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todas">Todas</option>
          <option value="abiertas">Abiertas</option>
          <option value="cerradas">Cerradas</option>
        </select>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      <table className="seguimientos-table">
        <thead>
          <tr>
            <th>Prospecto</th>
            <th>Objetivo</th>
            <th>Estado del Prospecto</th>
            <th>Estado de la Venta</th>
            <th>Última Fecha</th>
            <th>Último Tipo</th>
            <th>Último Resultado</th>
            <th>Última Nota</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {prospecciones.map((p) => {
            const tieneSeguimientos = p.seguimientos && p.seguimientos.length > 0;
            const ultimoSeguimiento = tieneSeguimientos ? p.seguimientos[0] : null;

            return (
              <tr key={p.id_venta}>
                <td>{p.prospecto?.nombre || "Sin Prospecto"}</td>
                <td>{p.objetivo || "Sin Objetivo"}</td>
                <td>{p.prospecto?.estado || "No definido"}</td>
                <td>{p.abierta ? "Abierta" : "Cerrada"}</td>
                <td>{ultimoSeguimiento?.fecha_programada ? new Date(ultimoSeguimiento.fecha_programada).toLocaleDateString() : "No hay"}</td>
                <td>{ultimoSeguimiento?.tipo_seguimiento?.descripcion || "No registrado"}</td>
                <td>{ultimoSeguimiento?.resultado || "Pendiente"}</td>
                <td>{ultimoSeguimiento?.nota || "Sin nota"}</td>
                <td>
                  {!tieneSeguimientos ? (
                    <button
                      className="btn-agendar"
                      onClick={() => navigate(`/agendar-seguimiento/${p.id_venta}`)}
                    >
                      📅 Agendar Primer Seguimiento
                    </button>
                  ) : (
                    <button
                      className="btn-ver-seguimientos"
                      onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}
                    >
                      📜 Ver Seguimientos
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SeguimientosVendedora;
