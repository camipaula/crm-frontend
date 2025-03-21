import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import "../styles/seguimientosAdmin.css";

const SeguimientosAdmin = () => {
  const navigate = useNavigate();
  const [vendedoras, setVendedoras] = useState([]);
  const [vendedoraSeleccionada, setVendedoraSeleccionada] = useState(null);
  const [prospecciones, setProspecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  useEffect(() => {
    obtenerVendedoras();
    buscarSeguimientos();
  }, []);

  const obtenerVendedoras = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error obteniendo vendedoras");
      const data = await res.json();
      setVendedoras([{ value: "", label: "Todas las vendedoras" }, ...data.map(v => ({ value: v.cedula_ruc, label: v.nombre }))]);
    } catch (err) {
      setError(err.message);
    }
  };

  const buscarSeguimientos = async (cedula_ruc = "") => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      let url = `${import.meta.env.VITE_API_URL}/api/ventas/prospecciones?`;
      if (cedula_ruc) url += `cedula_vendedora=${cedula_ruc}&`;
      if (filtroEstado !== "todas") url += `estado_prospeccion=${filtroEstado}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error obteniendo prospecciones");
      const data = await res.json();
      setProspecciones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVendedoraChange = (selectedOption) => {
    setVendedoraSeleccionada(selectedOption);
    buscarSeguimientos(selectedOption?.value || "");
  };

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = `${import.meta.env.VITE_API_URL}/api/seguimientos/exportar?`;

      if (vendedoraSeleccionada && vendedoraSeleccionada.value) url += `cedula_vendedora=${vendedoraSeleccionada.value}&`;
      if (filtroEstado !== "todas") url += `estado_prospeccion=${filtroEstado}&`;

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
      <h1 className="title">Seguimientos de Prospecciones</h1>

      <button className="exportar-btn" onClick={exportarExcel}>
        📥 Exportar a Excel
      </button>

      <div className="filtros-container">
        <Select
          options={vendedoras}
          placeholder="Seleccionar Vendedora"
          onChange={handleVendedoraChange}
          isClearable
          value={vendedoraSeleccionada}
        />

        <label>Filtrar por estado:</label>
        <select value={filtroEstado} onChange={(e) => {
          setFiltroEstado(e.target.value);
          buscarSeguimientos(vendedoraSeleccionada?.value || "");
        }}>
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
            <th>Estado del Prospecto</th> {/* 🔹 Nuevo campo */}
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
            const ultimoSeguimiento = tieneSeguimientos ? p.seguimientos[0] : null; // 🔹 Obtener el más reciente

            return (
              <tr key={p.id_venta}>
                <td>{p.prospecto?.nombre || "Sin Prospecto"}</td>
                <td>{p.objetivo || "Sin Objetivo"}</td>
                <td>{p.prospecto?.estado || "No definido"}</td> {/* 🔹 Estado del prospecto */}
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

export default SeguimientosAdmin;
