import { useState, useEffect } from "react";
import Select from "react-select";
import "../styles/prospectosAdmin.css";
import { useNavigate } from "react-router-dom";

const ProspectosAdmin = () => {
  const navigate = useNavigate();
  const [prospectos, setProspectos] = useState([]);
  const [vendedoras, setVendedoras] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [cedulaVendedora, setCedulaVendedora] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [sectorFiltro, setSectorFiltro] = useState(null);

  const opcionesEstado = [
    { value: "nuevo", label: "Nuevo" },
    { value: "interesado", label: "Interesado" },
    { value: "ganado", label: "Ganado" },
    { value: "archivado", label: "Archivado" },
    { value: "perdido", label: "Perdido" },
  ];

  useEffect(() => {
    obtenerVendedoras();
    obtenerSectores();
  }, []);

  useEffect(() => {
    buscarProspectos();
  }, [cedulaVendedora, estadoFiltro, fechaInicio, fechaFin, sectorFiltro]);

  const obtenerVendedoras = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/usuarios/vendedoras");
      if (!res.ok) throw new Error("Error cargando vendedoras");
      const data = await res.json();
      setVendedoras(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const obtenerSectores = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/prospectos/sectores", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error obteniendo sectores");
      const data = await res.json();
      setSectores(data.map((s) => ({ value: s, label: s })));
    } catch (error) {
      console.error("Error obteniendo sectores:", error);
      setError(error.message);
    }
  };


  const buscarProspectos = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      let url = `http://localhost:5000/api/prospectos?`;

      if (cedulaVendedora) url += `cedula_vendedora=${cedulaVendedora}&`;
      if (estadoFiltro.length > 0) {
        estadoFiltro.forEach((estado) => {
          url += `estado=${estado.value}&`;
        });
      }
      if (fechaInicio) url += `fechaInicio=${fechaInicio}&`;
      if (fechaFin) url += `fechaFin=${fechaFin}&`;
      if (sectorFiltro) url += `sector=${sectorFiltro.value}&`;

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

  const eliminarProspecto = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/prospectos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error eliminando prospecto");
      setProspectos((prev) => prev.filter((p) => p.id_prospecto !== id));
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="prospectos-admin-container">
      <h1 className="title">Gestión de Prospectos</h1>
      {error && <p className="error">{error}</p>}

      <div className="filtros-container">
        <select
          name="cedula_vendedora"
          onChange={(e) => setCedulaVendedora(e.target.value)}
          value={cedulaVendedora}
        >
          <option value="">Todas las vendedoras</option>
          {vendedoras.map((v) => (
            <option key={v.cedula_ruc} value={v.cedula_ruc}>
              {v.nombre}
            </option>
          ))}
        </select>

        <Select
          options={opcionesEstado}
          isMulti
          placeholder="Seleccionar Estado(s)"
          className="select-estado"
          classNamePrefix="select"
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
          classNamePrefix="select"
          onChange={setSectorFiltro}
          isClearable
        />

        <button onClick={buscarProspectos} disabled={loading}>
          {loading ? "Cargando..." : "Buscar"}
        </button>
      </div>

      <table className="prospectos-table">
        <thead>
          <tr>
            <th>Vendedora</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Sector</th>
            <th>Estado</th>
            <th>Última Nota</th>
            <th>Próximo Contacto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {prospectos.map((p) => {
            const ultimaNota = p.ventas
              ?.flatMap((v) => v.seguimientos)
              .sort(
                (a, b) =>
                  new Date(b.fecha_programada) - new Date(a.fecha_programada)
              )[0]?.nota ?? "Sin nota";

            const proximoContacto = p.ventas
              ?.flatMap((v) => v.seguimientos)
              .filter((s) => s.estado === "pendiente")
              .sort(
                (a, b) =>
                  new Date(a.fecha_programada) - new Date(b.fecha_programada)
              )[0]?.fecha_programada;

            const proximoContactoFormateado = proximoContacto
              ? new Date(proximoContacto).toLocaleDateString("es-EC")
              : "Sin programar";

            return (
              <tr key={p.id_prospecto}>
                <td>{p.vendedora_prospecto?.nombre ?? "Sin asignar"}</td>
                <td>{p.nombre}</td>
                <td>{p.correo}</td>
                <td>{p.telefono}</td>
                <td>{p.sector ?? "No registrado"}</td>
                <td>{p.estado}</td>
                <td>{ultimaNota}</td>
                <td>{proximoContactoFormateado}</td>
                <td>
                  <button
                    className="btn-detalle"
                    onClick={() =>
                      navigate(`/detalle-prospecto/${p.id_prospecto}`)
                    }
                  >
                    Ver Detalles
                  </button>
                  <button
                    className="btn-editar"
                    onClick={() =>
                      navigate(`/editar-prospecto/${p.id_prospecto}`)
                    }
                  >
                    Editar
                  </button>
                  <button
                    className="btn-eliminar"
                    onClick={() => eliminarProspecto(p.id_prospecto)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        type="button"
        className="btn-cerrar"
        onClick={() => navigate("/admin")}
      >
        Cerrar
      </button>
    </div>
  );
};

export default ProspectosAdmin;
