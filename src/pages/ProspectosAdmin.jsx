import { useState, useEffect } from "react";
import Select from "react-select";
import "../styles/prospectosAdmin.css";
import { useNavigate } from "react-router-dom";

const ProspectosAdmin = () => {
  const navigate = useNavigate();
  const [prospectos, setProspectos] = useState([]);
  const [vendedoras, setVendedoras] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [categorias, setCategorias] = useState([]); 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [cedulaVendedora, setCedulaVendedora] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [sectorFiltro, setSectorFiltro] = useState(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
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
    obtenerVendedoras();
    obtenerSectores();
    obtenerCategorias();
    establecerFechasUltimos3Meses();
  }, []);

  // Establece automáticamente las fechas del mes actual
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
    if (fechaInicio && fechaFin) {
      buscarProspectos();
    }
  }, [cedulaVendedora, estadoFiltro, fechaInicio, fechaFin, sectorFiltro,categoriaFiltro]);

  const obtenerVendedoras = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`);
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/sectores`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(" ");
      const data = await res.json();
      setSectores(data.map((s) => ({ value: s, label: s })));
    } catch (error) {
      //console.error(":", error);
      setError(error.message);
    }
  };

  const obtenerCategorias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`);
      if (!res.ok) throw new Error("Error cargando categorías");
      setCategorias((await res.json()).map((c) => ({ value: c.id_categoria, label: c.nombre })));
    } catch (err) {
      setError(err.message);
    }
  };

  const buscarProspectos = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      let url = `${import.meta.env.VITE_API_URL}/api/prospectos?`;

      if (cedulaVendedora) url += `cedula_vendedora=${cedulaVendedora}&`;
      if (estadoFiltro.length > 0) {
        estadoFiltro.forEach((estado) => {
          url += `estado=${estado.value}&`;
        });
      }
      if (fechaInicio) url += `fechaInicio=${fechaInicio}&`;
      if (fechaFin) url += `fechaFin=${fechaFin}&`;
      if (sectorFiltro) url += `sector=${sectorFiltro.value}&`;
      if (categoriaFiltro) url += `id_categoria=${categoriaFiltro.value}&`;

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

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem("token");
  
      let url = `${import.meta.env.VITE_API_URL}/api/prospectos/exportar?`;
  
      if (cedulaVendedora) url += `cedula_vendedora=${cedulaVendedora}&`;
      if (estadoFiltro.length > 0) {
        estadoFiltro.forEach((estado) => {
          url += `estado=${estado.value}&`;
        });
      }
      if (fechaInicio) url += `fechaInicio=${fechaInicio}&`;
      if (fechaFin) url += `fechaFin=${fechaFin}&`;
      if (sectorFiltro) url += `sector=${sectorFiltro.value}&`;
      if (categoriaFiltro) url += `id_categoria=${categoriaFiltro.value}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const contentType = res.headers.get("content-type");
  
      // 🔹 Si la respuesta es JSON en lugar de un archivo, significa que no hay prospectos
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        alert(data.message);
        return;
      }
  
      if (!res.ok) throw new Error("Error al exportar prospectos");
  
      // Convertir la respuesta en un blob y descargar el archivo
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "prospectos.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al exportar:", error);
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
        <Select
          options={categorias}
          placeholder="Seleccionar Categoría"
          className="select-categoria"
          onChange={setCategoriaFiltro}
          isClearable
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

        <button className="exportar-btn" onClick={exportarExcel}>
        📥 Exportar Prospectos a Excel
      </button>

      </div>
      <button className="nuevo-prospecto-btn" onClick={() => navigate("/crear-prospecto-admin")}>
        ➕ Crear Prospecto
      </button>
      <table className="prospectos-table">
        <thead>
          <tr>
            <th>Prospecto</th>
            <th>Vendedora</th>
            <th>Estado</th>
            <th>Próximo Contacto</th>
            <th>Última Nota</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
  {prospectos.length > 0 ? (
    prospectos.map((p) => {
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

      const tieneVentas = p.ventas?.length > 0; // Verifica si el prospecto tiene ventas

      return (
        <tr key={p.id_prospecto}>
          <td>{p.nombre}</td>
          <td>{p.vendedora_prospecto?.nombre ?? "Sin asignar"}</td>
          <td>{p.estado}</td>
          <td>{proximoContactoFormateado}</td>
          <td>{ultimaNota}</td>
          <td>
            {/* 🔹 Botón dinámico según si tiene ventas o no */}
            {tieneVentas ? (
              <button className="btn-seguimientos" onClick={() => navigate(`/seguimientos-prospecto/${p.id_prospecto}`)}>
                🔍 Ver Seguimientos
              </button>
            ) : (
              <button className="btn-abrir-prospeccion" onClick={() => navigate(`/abrir-venta/${p.id_prospecto}`)}>
                ➕ Abrir Prospección
              </button>
            )}

            <button className="btn-editar" onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}>
              Información del Prospecto
            </button>

            <button className="btn-eliminar" onClick={() => eliminarProspecto(p.id_prospecto)}>
              Eliminar
            </button>
          </td>
        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan="6" style={{ textAlign: "center", padding: "20px", fontWeight: "bold" }}>
        No hay prospectos disponibles
      </td>
    </tr>
  )}
</tbody>



      </table>

      <button type="button" className="btn-cerrar" onClick={() => navigate(-1)}>Cerrar</button>
    </div>
  );
};

export default ProspectosAdmin;
