import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import "../styles/seguimientosAdmin.css";

const SeguimientosAdmin = () => {
  const navigate = useNavigate();
  const [vendedoras, setVendedoras] = useState([]);
  const [vendedoraSeleccionada, setVendedoraSeleccionada] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]); // 🔹 Ventas después del filtro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ventasAbiertas, setVentasAbiertas] = useState({});
  const [filtroEstado, setFiltroEstado] = useState("todas"); // 🔹 Estado del filtro

  useEffect(() => {
    obtenerVendedoras();
  }, []);

  useEffect(() => {
    filtrarVentas(); // 🔹 Filtrar cuando cambie el estado
  }, [filtroEstado, ventas]);

  const obtenerVendedoras = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error obteniendo vendedoras");
      const data = await res.json();
      setVendedoras(data.map(v => ({ value: v.cedula_ruc, label: v.nombre })));
    } catch (err) {
      console.error(err);
    }
  };

  const buscarSeguimientos = async (cedula_ruc) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/vendedora/${cedula_ruc}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error obteniendo seguimientos");
      const data = await res.json();
      setVentas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtrarVentas = () => {
    if (filtroEstado === "todas") {
      setVentasFiltradas(ventas);
    } else {
      const abiertas = filtroEstado === "abiertas";
      setVentasFiltradas(ventas.filter(venta => venta.abierta === (abiertas ? 1 : 0)));
    }
  };

  const handleVendedoraChange = (selectedOption) => {
    setVendedoraSeleccionada(selectedOption);
    if (selectedOption) {
      buscarSeguimientos(selectedOption.value);
    } else {
      setVentas([]);
    }
  };

  const toggleTablaSeguimientos = (id_venta) => {
    setVentasAbiertas((prev) => ({
      ...prev,
      [id_venta]: !prev[id_venta],
    }));
  };

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem("token");

      let url = `${import.meta.env.VITE_API_URL}/api/seguimientos/exportar?`;

      if (vendedoraSeleccionada) url += `cedula_vendedora=${vendedoraSeleccionada.value}&`;
      if (filtroEstado === "abiertas" || filtroEstado === "cerradas") url += `estado_venta=${filtroEstado}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
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
      <h1 className="title">Seguimientos por Vendedora</h1>

      <button className="exportar-btn" onClick={exportarExcel}>
        📥 Exportar Seguimientos a Excel
      </button>

      {/* 🔹 Filtros */}
      <div className="filtros-container">
        <Select
          options={vendedoras}
          placeholder="Seleccionar Vendedora"
          onChange={handleVendedoraChange}
          isClearable
        />

        <label>Filtrar ventas:</label>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todas">Todas</option>
          <option value="abiertas">Abiertas</option>
          <option value="cerradas">Cerradas</option>
        </select>
      </div>

      {loading && <p>Cargando seguimientos...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && ventasFiltradas.length === 0 && vendedoraSeleccionada && (
        <p>No hay seguimientos para esta vendedora.</p>
      )}

      {ventasFiltradas.map((venta) => (
        <div key={venta.id_venta} className="venta-card">
          <div className="venta-header">
            <h2>📌 Prospecto: {venta.prospecto.nombre}</h2>
            <h3>🛒 Venta: {venta.objetivo}</h3>
            <p><strong>Estado:</strong> {venta.abierta ? "Abierta" : "Cerrada"}</p>
            <div className="venta-botones">
              <button
                className="btn-agendar"
                onClick={() => navigate(`/agendar-seguimiento/${venta.id_venta}`)}
              >
                ➕ Agendar Seguimiento
              </button>
              <button
                className="btn-abrir-venta"
                onClick={() => navigate(`/abrir-venta/${venta.prospecto.id_prospecto}`)}
              >
                🛒 Abrir Nueva Venta
              </button>
              <button
                className="btn-toggle-tabla"
                onClick={() => toggleTablaSeguimientos(venta.id_venta)}
              >
                {ventasAbiertas[venta.id_venta] ? "🔼 Ocultar Seguimientos" : "🔽 Ver Seguimientos"}
              </button>
            </div>
          </div>

          {ventasAbiertas[venta.id_venta] && (
            <table className="seguimientos-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Resultado</th>
                  <th>Nota</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {venta.seguimientos.map((s) => (
                  <tr key={s.id_seguimiento}>
                    <td>{new Date(s.fecha_programada).toLocaleDateString()}</td>
                    <td>{s.tipo_seguimiento.descripcion}</td>
                    <td>{s.estado}</td>
                    <td>{s.resultado ?? "Pendiente"}</td>
                    <td>{s.nota ?? "Sin nota"}</td>
                    <td>
                      <button
                        className="btn-resultado"
                        onClick={() => navigate(`/registrar-resultado/${s.id_seguimiento}`)}
                      >
                        ✍️ Registrar Resultado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
};

export default SeguimientosAdmin;
