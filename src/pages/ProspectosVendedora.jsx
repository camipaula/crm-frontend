import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { obtenerCedulaDesdeToken } from "../utils/auth";
import "../styles/prospectosVendedora.css";

const ProspectosVendedora = () => {
  const navigate = useNavigate();
  const [cedulaVendedora, setCedulaVendedora] = useState(null);
  const [prospectos, setProspectos] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Filtros
  const [estadoFiltro, setEstadoFiltro] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [sectorFiltro, setSectorFiltro] = useState(null);

  const opcionesEstado = [
    { value: "nuevo", label: "Nuevo" },
    { value: "contactar", label: "Contactar" },
    { value: "cita", label: "Cita" },
    { value: "visita", label: "Visita" },
    { value: "en_prueba", label: "En Prueba" },       
    { value: "proformado", label: "Proformado" },
    { value: "no_interesado", label: "No Interesado" }, 
    { value: "interesado", label: "Interesado" },
    { value: "ganado", label: "Ganado" },
    { value: "perdido", label: "Perdido" },
    { value: "archivado", label: "Archivado" },
  ];

  useEffect(() => {
    const cedula = obtenerCedulaDesdeToken();
    setCedulaVendedora(cedula);
    obtenerSectores();
    establecerFechasUltimos3Meses();
  }, []);

  // 🔹 Fechas de últimos 3 meses
  const establecerFechasUltimos3Meses = () => {
    const fechaActual = new Date();
    const fechaFin = fechaActual.toISOString().split("T")[0];

    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 3);
    const fechaInicioFormateada = fechaInicio.toISOString().split("T")[0];

    setFechaInicio(fechaInicioFormateada);
    setFechaFin(fechaFin);
  };

  useEffect(() => {
    if (cedulaVendedora && fechaInicio && fechaFin) {
      buscarProspectos();
    }
  }, [cedulaVendedora, estadoFiltro, fechaInicio, fechaFin, sectorFiltro]);

  const obtenerSectores = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/sectores`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error obteniendo sectores");
      const data = await res.json();
      setSectores(data.map((s) => ({ value: s, label: s })));
    } catch (err) {
      console.error("Error obteniendo sectores:", err);
    }
  };

  const eliminarProspecto = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error eliminando prospecto");
      setProspectos((prev) => prev.filter((p) => p.id_prospecto !== id));
    } catch (error) {
      setError(error.message);
    }
  };

  const buscarProspectos = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      let url = `${import.meta.env.VITE_API_URL}/api/prospectos?vendedora=${cedulaVendedora}`;

      if (estadoFiltro.length > 0) {
        estadoFiltro.forEach((estado) => {
          url += `&estado=${estado.value}`;
        });
      }
      if (fechaInicio) url += `&fechaInicio=${fechaInicio}`;
      if (fechaFin) url += `&fechaFin=${fechaFin}`;
      if (sectorFiltro) url += `&sector=${sectorFiltro.value}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error obteniendo prospectos");
      const data = await res.json();
      setProspectos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prospectos-container">
      <h1 className="title">Mis Prospectos</h1>

      {/* 🔹 Botón para crear prospecto */}
      <button className="nuevo-prospecto-btn" onClick={() => navigate("/crear-prospecto")}>
        ➕ Crear Prospecto
      </button>

      {/* 🔹 Filtros */}
      <div className="filtros-container">
        <Select
          options={opcionesEstado}
          isMulti
          placeholder="Seleccionar Estado(s)"
          className="select-estado"
          onChange={setEstadoFiltro}
        />

        <input
          type="date"
          name="fechaInicio"
          onChange={(e) => setFechaInicio(e.target.value)}
          value={fechaInicio}
        />
        <input
          type="date"
          name="fechaFin"
          onChange={(e) => setFechaFin(e.target.value)}
          value={fechaFin}
        />

        <Select
          options={sectores}
          placeholder="Seleccionar Sector"
          className="select-sector"
          onChange={setSectorFiltro}
          isClearable
        />

        <button onClick={buscarProspectos} disabled={loading}>
          {loading ? "Cargando..." : "Buscar"}
        </button>
      </div>

      {loading && <p>Cargando prospectos...</p>}
      {error && <p className="error">{error}</p>}

      {/* 🔹 Tabla de prospectos */}
      <table className="prospectos-table">
        <thead>
          <tr>
            <th>Prospecto</th>
            <th>Estado</th>
            <th>Próximo Contacto</th>
            <th>Última Nota</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {prospectos.map((p) => {
            const ultimaNota = p.ventas
              ?.flatMap((v) => v.seguimientos)
              .sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada))[0]?.nota ?? "Sin nota";

            const proximoContacto = p.ventas
              ?.flatMap((v) => v.seguimientos)
              .filter((s) => s.estado === "pendiente")
              .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0]?.fecha_programada;

            const proximoContactoFormateado = proximoContacto
              ? new Date(proximoContacto).toLocaleDateString("es-EC")
              : "Sin programar";

            const tieneVentas = p.ventas?.length > 0;

            return (
              <tr key={p.id_prospecto}>
                <td>{p.nombre}</td>
                <td>{p.estado}</td>
                <td>{proximoContactoFormateado}</td>
                <td>{ultimaNota}</td>
                <td>

                  {tieneVentas ? (
                    <button onClick={() => navigate(`/seguimientos-prospecto/${p.id_prospecto}`)}>
                      🔍 Ver Seguimientos
                    </button>
                  ) : (
                    <button onClick={() => navigate(`/abrir-venta/${p.id_prospecto}`)}>
                      ➕ Abrir Prospección
                    </button>
                  )}

                  <button onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}>
                    Editar
                  </button>



                  <button className="btn-eliminar" onClick={() => eliminarProspecto(p.id_prospecto)}>
                    Eliminar
                  </button>
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProspectosVendedora;
