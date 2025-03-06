import { useState, useEffect } from "react";
import Select from "react-select";
import { obtenerCedulaDesdeToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import "../styles/prospectosVendedora.css";

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

  const opcionesEstado = [
    { value: "nuevo", label: "Nuevo" },
    { value: "interesado", label: "Interesado" },
    { value: "ganado", label: "Ganado" },
    { value: "archivado", label: "Archivado" },
    { value: "perdido", label: "Perdido" },
  ];

  useEffect(() => {
    const cedula = obtenerCedulaDesdeToken();
    setCedulaVendedora(cedula);
    obtenerSectores();
  }, []);

  useEffect(() => {
    if (cedulaVendedora) {
      buscarProspectos();
    }
  }, [cedulaVendedora, estadoFiltro, fechaInicio, fechaFin, sectorFiltro]);

  const obtenerSectores = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/prospectos/sectores", {
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
      let url = `http://localhost:5000/api/prospectos?vendedora=${cedulaVendedora}`;

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

  const eliminarProspecto = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/prospectos/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error eliminando prospecto");
      setProspectos((prev) => prev.filter((p) => p.id_prospecto !== id));
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="prospectos-container">
      <h1 className="title">Mis Prospectos</h1>
      {loading && <p>Cargando prospectos...</p>}
      {error && <p className="error">{error}</p>}

      {/* 🔹 Filtros intactos */}
      <div className="filtros-container">
        <Select
          options={opcionesEstado}
          isMulti
          placeholder="Seleccionar Estado(s)"
          className="select-estado"
          classNamePrefix="select"
          onChange={setEstadoFiltro}
        />

        <input type="date" name="fechaInicio" onChange={(e) => setFechaInicio(e.target.value)} value={fechaInicio} />
        <input type="date" name="fechaFin" onChange={(e) => setFechaFin(e.target.value)} value={fechaFin} />

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
            <th>Nombre</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Sector</th>
            <th>Dirección</th>
            <th>Estado</th>
            <th>Última Nota</th>
            <th>Próximo Contacto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {prospectos.map((p) => {
            const ultimaNota = p.contactos?.[0]?.nota ?? "Sin nota";

            // Buscar la fecha del próximo contacto (estado pendiente)
            const proximoContacto = p.ventas
              ?.flatMap((venta) => venta.seguimientos || [])
              .filter((s) => s.estado === "pendiente")
              .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0]
              ?.fecha_programada;

            // Formatear la fecha a 2/1/2024
            const proximoContactoFormateado = proximoContacto
              ? new Date(proximoContacto).toLocaleDateString("es-EC")
              : "Sin programar";

            const tieneVentas = p.ventas?.length > 0;

            return (
              <tr key={p.id_prospecto}>
                <td>{p.nombre}</td>
                <td>{p.correo ?? "No registrado"}</td>
                <td>{p.telefono}</td>
                <td>{p.sector ?? "No registrado"}</td>
                <td>{p.direccion ?? "No registrada"}</td>
                <td>{p.estado}</td>
                <td>{ultimaNota}</td>
                <td>{proximoContactoFormateado}</td>
                <td className="acciones">
                  <div className="botones-principales">
                    <button
                      className="btn-detalles"
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
                  </div>
                  <div className="botones-secundarios">
                    {tieneVentas ? (
                      <button
                        className="btn-ventas"
                        onClick={() =>
                          navigate(`/seguimientos-prospecto/${p.id_prospecto}`)
                        }
                      >
                        🔍 Ver Seguimientos
                      </button>
                    ) : (
                      <button
                        className="btn-crear-venta"
                        onClick={() =>
                          navigate(`/abrir-venta/${p.id_prospecto}`)
                        }
                      >
                        ➕ Crear Venta
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>

      </table>

      {/* 🔹 Botón para Crear un Nuevo Prospecto */}
      <button className="nuevo-prospecto-btn" onClick={() => navigate("/crear-prospecto")}>
        ➕ Crear Prospecto
      </button>
    </div>
  );
};

export default ProspectosVendedora;
