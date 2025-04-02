import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import "../styles/seguimientosAdmin.css";
import React from "react";

const SeguimientosAdmin = () => {
  const navigate = useNavigate();
  const [vendedoras, setVendedoras] = useState([]);
  const [vendedoraSeleccionada, setVendedoraSeleccionada] = useState(null);
  const [prospecciones, setProspecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [idVentaSeleccionada, setIdVentaSeleccionada] = useState(null);
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");


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

  const buscarSeguimientos = async (cedula_ruc = "", estado = filtroEstado) => {

    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      let url = `${import.meta.env.VITE_API_URL}/api/ventas/prospecciones?`;
      if (cedula_ruc) url += `cedula_vendedora=${cedula_ruc}&`;
      if (estado !== "todas") url += `estado_prospeccion=${estado}`;

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
      buscarSeguimientos(vendedoraSeleccionada?.value || "");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const abrirModalEliminar = (id_venta) => {
    setIdVentaSeleccionada(id_venta);
    setModalEliminar(true);
  };

  const confirmarEliminar = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${idVentaSeleccionada}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al eliminar venta");
      alert("Venta eliminada correctamente");
      setModalEliminar(false);
      buscarSeguimientos(vendedoraSeleccionada?.value || "");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };


  return (
    <div className="seguimientos-container">
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

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

        <label>Filtrar por estado de prospección:</label>
        <select
  value={filtroEstado}
  onChange={(e) => {
    const nuevoEstado = e.target.value;
    setFiltroEstado(nuevoEstado);
    buscarSeguimientos(vendedoraSeleccionada?.value || "", nuevoEstado);
  }}
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
            const siguienteSeguimiento = p.seguimientos
            ?.filter((s) => s.estado === "pendiente")
            .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

            return (
              <React.Fragment key={p.id_venta}>

              <tr key={p.id_venta}>
                <td>{p.prospecto?.nombre || "Sin Prospecto"}</td>
                <td>{p.objetivo || "Sin Objetivo"}</td>
                <td>{p.prospecto?.estado_prospecto?.nombre || "No definido"}</td>
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

                  {/* Botón pequeño Editar */}
                  <button className="btn-mini" onClick={() => abrirModalEditar(p.id_venta, p.objetivo)}>✏️</button>


                  {/* Botón pequeño Eliminar */}
                  <button className="btn-mini red" onClick={() => abrirModalEliminar(p.id_venta)}>🗑️</button>
                </td>
              </tr>
              {/* 🔽 Nueva fila con la siguiente fecha y motivo */}
              <tr className="fila-info-extra">
                  <td colSpan="9" style={{ fontStyle: "italic", color: "#555", backgroundColor:"#c9edec"}}>
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


      {/* Vista en móviles - tarjetas compactas */}
      <div className="seguimientos-cards">
        {prospecciones.map((p) => {
          const tieneSeguimientos = p.seguimientos && p.seguimientos.length > 0;
          const ultimo = tieneSeguimientos ? p.seguimientos[0] : null;
          const siguienteSeguimiento = p.seguimientos
          ?.filter((s) => s.estado === "pendiente")
          .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];
          
          return (
            <div className="seguimiento-card" key={p.id_venta}>
              <h3>{p.prospecto?.nombre || "Sin Prospecto"}</h3>
              <p><strong>Objetivo:</strong> {p.objetivo || "No definido"}</p>
              <p><strong>Estado del Prospecto:</strong> {p.prospecto?.estado_prospecto?.nombre || "No definido"}</p>
              <p><strong>Estado de la Venta:</strong> {p.abierta ? "Abierta" : "Cerrada"}</p>
              <p><strong>Última Fecha:</strong> {ultimo?.fecha_programada ? new Date(ultimo.fecha_programada).toLocaleDateString() : "No hay"}</p>
              <p><strong>Tipo:</strong> {ultimo?.tipo_seguimiento?.descripcion || "No registrado"}</p>
              <p><strong>Resultado:</strong> {ultimo?.resultado || "Pendiente"}</p>
              <p><strong>Nota:</strong> {ultimo?.nota || "Sin nota"}</p>

              <div className="acciones">
                {!tieneSeguimientos ? (
                  <button className="btn-agendar" onClick={() => navigate(`/agendar-seguimiento/${p.id_venta}`)}>
                    📅 Agendar
                  </button>
                ) : (
                  <button className="btn-ver-seguimientos" onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}>
                    📜 Ver
                  </button>
                )}
                {/* 👉 Botón pequeño para editar */}
                <button
                  className="btn-mini"
                  onClick={() => abrirModalEditar(p.id_venta, p.objetivo)}
                >
                  ✏️
                </button>


                {/* 👉 Botón pequeño para eliminar */}
                <button
                  className="btn-mini red"
                  onClick={() => abrirModalEliminar(p.id_venta)}
                >
                  🗑️
                </button>

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
      {/* 🟩 Modal para editar objetivo */}
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

      {/* 🟥 Modal para confirmar eliminación */}
      {modalEliminar && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>¿Eliminar esta venta?</h3>
            <p>🟥 Se eliminarán también los seguimientos relacionados.</p>
            <div className="modal-buttons">
              <button className="btn-mini red" onClick={confirmarEliminar}>Eliminar</button>
              <button onClick={() => setModalEliminar(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

};

export default SeguimientosAdmin;
