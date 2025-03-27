import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/seguimientosVendedora.css";

const SeguimientosProspecto = () => {
  const { id_prospecto } = useParams();
  const navigate = useNavigate();
  const [prospecciones, setProspecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas"); // 🔹 Estado del filtro

  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [idVentaSeleccionada, setIdVentaSeleccionada] = useState(null);
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");


  useEffect(() => {
    buscarSeguimientos();
  }, [filtroEstado]);

  const buscarSeguimientos = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      let url = `${import.meta.env.VITE_API_URL}/api/ventas/prospecto/${id_prospecto}`;
      if (filtroEstado !== "todas") url += `?estado_prospeccion=${filtroEstado}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (!res.ok) throw new Error("Error obteniendo seguimientos del prospecto");
      const data = await res.json();

      if (data.length === 0) {
        //Si el prospecto no tiene ventas, redirigir a "AbrirVenta"
        navigate(`/abrir-venta/${id_prospecto}`);
        return;
      }

      setProspecciones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      buscarSeguimientos(); // Recargar la tabla
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
      buscarSeguimientos(); // Refrescar lista
    } catch (err) {
      alert("Error: " + err.message);
    }
  };


  return (
    <div className="seguimientos-container">

      <h1 className="title">Seguimientos del Prospecto</h1>
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

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

      <table className="tabla-seguimientos-prospecto">
        <thead>
          <tr>
            <th>Objetivo</th>
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
            const ultimoSeguimiento = p.seguimientos?.[0] || {};
            return (
              <tr key={p.id_venta}>
                <td>{p.objetivo || "Sin Objetivo"}</td>
                <td>{p.abierta ? "Abierta" : "Cerrada"}</td>
                <td>{ultimoSeguimiento.fecha_programada ? new Date(ultimoSeguimiento.fecha_programada).toLocaleDateString() : "No hay"}</td>
                <td>{ultimoSeguimiento.tipo_seguimiento?.descripcion || "No registrado"}</td>
                <td>{ultimoSeguimiento.resultado || "Pendiente"}</td>
                <td>{ultimoSeguimiento.nota || "Sin nota"}</td>
                <td>
                  <button
                    className="btn-ver-seguimientos"
                    onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}
                  >
                    📜 Ver Seguimientos
                  </button>
                  <button
                    className="btn-agendar"
                    onClick={() => navigate(`/agendar-seguimiento/${p.id_venta}`)}
                  >
                    ➕ Agendar Seguimiento
                  </button>
                  <button
                    className="btn-mini"
                    onClick={() => abrirModalEditar(p.id_venta, p.objetivo)}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-mini red"
                    onClick={() => abrirModalEliminar(p.id_venta)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="tarjetas-seguimientos-prospecto">
        {prospecciones.map((p) => {
          const s = p.seguimientos?.[0] || {};
          return (
            <div className="card-seguimiento" key={p.id_venta}>
              <h3>🎯 Objetivo: {p.objetivo || "No definido"}</h3>
              <p><strong>Estado Venta:</strong> {p.abierta ? "Abierta" : "Cerrada"}</p>
              <p><strong>Fecha:</strong> {s.fecha_programada ? new Date(s.fecha_programada).toLocaleDateString() : "Sin fecha"}</p>
              <p><strong>Tipo:</strong> {s.tipo_seguimiento?.descripcion || "No registrado"}</p>
              <p><strong>Resultado:</strong> {s.resultado || "Pendiente"}</p>
              <p><strong>Nota:</strong> {s.nota || "Sin nota"}</p>

              <div className="acciones">
                <button className="btn-ver-seguimientos" onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}>
                  📜 Ver
                </button>
                <button className="btn-agendar" onClick={() => navigate(`/agendar-seguimiento/${p.id_venta}`)}>
                  ➕ Agendar
                </button>
                <button className="btn-mini" onClick={() => abrirModalEditar(p.id_venta, p.objetivo)}>✏️</button>
                <button className="btn-mini red" onClick={() => abrirModalEliminar(p.id_venta)}>🗑️</button>


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

{/* 🟥 Modal Eliminar Venta */}
{modalEliminar && (
  <div className="modal-backdrop">
    <div className="modal-content">
      <h3>¿Eliminar esta venta?</h3>
      <p> 🟥 Se eliminarán también los seguimientos relacionados.</p>
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

export default SeguimientosProspecto;
