import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerCedulaDesdeToken } from "../utils/auth";
import "../styles/seguimientosProspecto.css";
import React from "react";

const SeguimientosVendedora = () => {
  const navigate = useNavigate();
  const [prospecciones, setProspecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  const [modalEditar, setModalEditar] = useState(false);
  const [idVentaSeleccionada, setIdVentaSeleccionada] = useState(null);
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");

  useEffect(() => {
    buscarSeguimientos();
  }, [filtroEstado]);

  const formatearFechaVisual = (fechaStr) => {
    const fecha = new Date(fechaStr.replace("Z", ""));
    return fecha.toLocaleString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

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

  const abrirModalEditar = (id_venta, objetivoActual) => {
    setIdVentaSeleccionada(id_venta);
    setNuevoObjetivo(objetivoActual);
    setModalEditar(true);
  };

  const guardarObjetivo = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${idVentaSeleccionada}/objetivo`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ objetivo: nuevoObjetivo }),
      });

      if (!res.ok) throw new Error("Error actualizando objetivo");
      alert("Objetivo actualizado correctamente");
      setModalEditar(false);
      buscarSeguimientos(); // Recargar
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="seguimientos-container">

      <h1 className="title">Mis Seguimientos de Prospectos</h1>
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

      <button className="exportar-btn" onClick={exportarExcel}>
        📥 Exportar a Excel
      </button>

      <div className="filtros-container">
        <label>Filtrar por estado de prospección:</label>
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
      <div className="seguimientos-table-vendedora-wrapper">

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
 const siguienteSeguimiento = p.seguimientos
            ?.filter((s) => s.estado === "pendiente")
            .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

              return (
                <React.Fragment key={p.id_venta}>


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

                    <button className="btn-mini" onClick={() => abrirModalEditar(p.id_venta, p.objetivo)}>✏️</button>

                  </td>
                </tr>

                {/* 🔽 Nueva fila con la siguiente fecha y motivo */}
              <tr className="fila-info-extra">
                  <td colSpan="7" style={{ fontStyle: "italic", color: "#555", backgroundColor:"#c9edec" }}>
                    <strong>Siguiente fecha programada:</strong>{" "}
                    {siguienteSeguimiento
                      ? formatearFechaVisual(siguienteSeguimiento.fecha_programada)

                      : "No se ha agendado un seguimiento."}
                    {siguienteSeguimiento && (
                      <>
                        {"  —  "}
                        <strong>Motivo:</strong> {siguienteSeguimiento.motivo || "Sin motivo"}
                      </>
                    )}
                  </td>
                </tr>
                </React.Fragment>

            );
          })}
          </tbody>
        </table>
      </div>
      <div className="tarjetas-seguimientos-vendedora">
        {prospecciones.map((p) => {
          const tieneSeguimientos = p.seguimientos?.length > 0;
          const ultimoSeguimiento = tieneSeguimientos ? p.seguimientos[0] : null;
          const siguienteSeguimiento = p.seguimientos
          ?.filter((s) => s.estado === "pendiente")
          .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];
          
          return (
            <div key={p.id_venta} className="card-seguimiento">
              <h3>{p.prospecto?.nombre || "Sin Prospecto"}</h3>
              <p><strong>Objetivo:</strong> {p.objetivo || "Sin objetivo"}</p>
              <p><strong>Estado del Prospecto:</strong> {p.prospecto?.estado || "No definido"}</p>
              <p><strong>Estado de la Venta:</strong> {p.abierta ? "Abierta" : "Cerrada"}</p>
              <p><strong>Última Fecha:</strong> {ultimoSeguimiento?.fecha_programada ? new Date(ultimoSeguimiento.fecha_programada).toLocaleDateString() : "No hay"}</p>
              <p><strong>Último Tipo:</strong> {ultimoSeguimiento?.tipo_seguimiento?.descripcion || "No registrado"}</p>
              <p><strong>Último Resultado:</strong> {ultimoSeguimiento?.resultado || "Pendiente"}</p>
              <p><strong>Última Nota:</strong> {ultimoSeguimiento?.nota || "Sin nota"}</p>
              <div className="acciones">
                {!tieneSeguimientos ? (
                  <button className="btn-agendar" onClick={() => navigate(`/agendar-seguimiento/${p.id_venta}`)}>📅 Agendar Primer Seguimiento</button>
                ) : (
                  <button className="btn-ver-seguimientos" onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}>📜 Ver Seguimientos</button>
                )}

                <button className="btn-mini" onClick={() => abrirModalEditar(p.id_venta, p.objetivo)}>✏️</button>
                <p style={{ fontStyle: "italic", marginTop: "10px" }}>
                  <strong>Siguiente fecha programada:</strong>{" "}
                  {siguienteSeguimiento
                    ? formatearFechaVisual(siguienteSeguimiento.fecha_programada)
                    : "No se ha agendado un seguimiento."}
                  {siguienteSeguimiento && (
                    <>
                      {"  —  "}
                      <strong>Motivo:</strong> {siguienteSeguimiento.motivo || "Sin motivo"}
                    </>
                  )}
                </p>
                
              </div>
            </div>
          );
        })}
      </div>
      {/* 🟩 Modal Editar Objetivo */}
      {modalEditar && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Editar Objetivo</h3>
            <textarea
              value={nuevoObjetivo}
              onChange={(e) => setNuevoObjetivo(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={guardarObjetivo}>Guardar</button>
              <button onClick={() => setModalEditar(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SeguimientosVendedora;
