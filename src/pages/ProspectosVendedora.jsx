import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { obtenerCedulaDesdeToken } from "../utils/auth";
import "../styles/prospectosVendedora3.css";

const ProspectosVendedora = () => {
  const navigate = useNavigate();
  const [cedulaVendedora, setCedulaVendedora] = useState(null);
  const [prospectos, setProspectos] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [estadoFiltro, setEstadoFiltro] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [sectorFiltro, setSectorFiltro] = useState(null);
  const [estados, setEstados] = useState([]);

  const [busquedaNombre, setBusquedaNombre] = useState("");
const [filtrosInicializados, setFiltrosInicializados] = useState(false);


  useEffect(() => {
    const cedula = obtenerCedulaDesdeToken();
    setCedulaVendedora(cedula);
    obtenerSectores();
    obtenerEstados();
    establecerFechasUltimos3Meses();
    const filtrosGuardados = localStorage.getItem("filtros_prospectos_vendedora");
if (filtrosGuardados) {
  try {
    const filtros = JSON.parse(filtrosGuardados);
    if (filtros.estadoFiltro) setEstadoFiltro(filtros.estadoFiltro);
    if (filtros.fechaInicio) setFechaInicio(filtros.fechaInicio);
    if (filtros.fechaFin) setFechaFin(filtros.fechaFin);
    if (filtros.sectorFiltro) setSectorFiltro(filtros.sectorFiltro);
    if (filtros.busquedaNombre) setBusquedaNombre(filtros.busquedaNombre);
  } catch (e) {
    console.error("Error al cargar filtros guardados", e);
  }
}
setFiltrosInicializados(true);

  }, []);

  useEffect(() => {
    if (!filtrosInicializados) return;
  
    const filtros = {
      estadoFiltro,
      fechaInicio,
      fechaFin,
      sectorFiltro,
      busquedaNombre,
    };
    localStorage.setItem("filtros_prospectos_vendedora", JSON.stringify(filtros));
  }, [estadoFiltro, fechaInicio, fechaFin, sectorFiltro, busquedaNombre, filtrosInicializados]);
  

  const obtenerEstados = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/estados`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
            const data = await res.json();
  
      if (!Array.isArray(data)) {
        throw new Error("La respuesta no es una lista de estados");
      }
  
      const opciones = data.map((e) => ({
        value: e.id_estado,
        label: e.nombre.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      }));
      setEstados(opciones);
    } catch (err) {
      console.error("Error cargando estados:", err);
      setError("No se pudieron cargar los estados");
    }
  };
  
  

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
setProspectos(
  data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const prospectosFiltrados = prospectos.filter((p) =>
    p.nombre.toLowerCase().includes(busquedaNombre.toLowerCase())
  );
  

  return (
    <div className="vendedora-prospectos-page">
      <h1 className="vendedora-prospectos-title">Mis Prospectos</h1>
      <button className="vendedora-btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

      <button className="vendedora-btn-nuevo-prospecto" onClick={() => navigate("/crear-prospecto")}>
        ➕ Crear Prospecto
      </button>

      <div className="vendedora-filtros">
        <Select
          options={estados}
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

<input
  type="text"
  placeholder="Buscar por nombre..."
  value={busquedaNombre}
  onChange={(e) => setBusquedaNombre(e.target.value)}
  className="input-busqueda-nombre"
/>

        <button onClick={buscarProspectos} disabled={loading}>
          {loading ? "Cargando..." : "Buscar"}
        </button>
      </div>

      {loading && <p>Cargando prospectos...</p>}
      {error && <p className="error">{error}</p>}

      <table className="vendedora-prospectos-table">
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
          {prospectosFiltrados.map((p) => {
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
                <td>{p.estado_prospecto?.nombre || "Sin estado"}</td>
                <td>{proximoContactoFormateado}</td>
                <td>{ultimaNota}</td>
                <td>
                  {tieneVentas ? (
                    <button className="vendedora-btn-seguimientos" onClick={() => navigate(`/seguimientos-prospecto/${p.id_prospecto}`)}>
                      🔍 Ver Seguimientos
                    </button>
                  ) : (
                    <button className="vendedora-btn-abrir-prospeccion" onClick={() => navigate(`/abrir-venta/${p.id_prospecto}`)}>
                      ➕ Abrir Prospección
                    </button>
                  )}
                  <button className="vendedora-btn-editar" onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}>
                    Ver Información

                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="vendedora-cards-mobile">
        {prospectosFiltrados.map((p) => {
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
            <div className="vendedora-prospecto-card" key={p.id_prospecto}>
              <h3>{p.nombre}</h3>
              <p><strong>Estado:</strong> {p.estado_prospecto?.nombre || "Sin estado"}</p>
              <p><strong>Próximo Contacto:</strong> {proximoContactoFormateado}</p>
              <p><strong>Última Nota:</strong> {ultimaNota}</p>
              <div className="acciones">
                {tieneVentas ? (
                  <button className="vendedora-btn-seguimientos" onClick={() => navigate(`/seguimientos-prospecto/${p.id_prospecto}`)}>
                    Ver Seguimientos
                  </button>
                ) : (
                  <button className="vendedora-btn-abrir-prospeccion" onClick={() => navigate(`/abrir-venta/${p.id_prospecto}`)}>
                    Abrir Prospección
                  </button>
                )}
                <button className="vendedora-btn-editar" onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}>
                  Ver Información
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProspectosVendedora;
