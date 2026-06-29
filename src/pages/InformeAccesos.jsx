import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/vendedorasAdmin.css"; 

const InformeAccesos = () => {
  const [accesos, setAccesos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerAccesos = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/logs/acceso`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error al obtener accesos");
        
        const data = await res.json();
        setAccesos(data.accesos); 
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    obtenerAccesos();
  }, []);

  const obtenerTimestamp = (fechaInput) => {
    if (!fechaInput) return null;
    if (fechaInput instanceof Date) return fechaInput.getTime();
    
    const stringFecha = fechaInput.toString().trim().replace(" ", "T");
    const d = new Date(stringFecha);
    return isNaN(d.getTime()) ? null : d.getTime();
  };

  // Le pasamos toda la lista de accesos para que pueda comparar
  const renderSalida = (log, todosLosAccesos) => {
    // 1. Si cerró sesión correctamente con el botón
    if (log.fecha_salida) {
      const timeSalida = obtenerTimestamp(log.fecha_salida);
      return (
        <span style={{ color: "#dc3545" }}>
          Salió: {timeSalida ? new Date(timeSalida).toLocaleString("es-EC") : "Desconexión"}
        </span>
      );
    }

    // 2. 👇 NUEVA INTELIGENCIA: Buscamos si esta es realmente su última sesión
    // Como la lista viene ordenada de más nueva a más vieja, el primer `.find` nos da su ingreso más reciente
    const sesionMasRecienteDelUsuario = todosLosAccesos.find(a => a.cedula_usuario === log.cedula_usuario);
    const esLaMasReciente = sesionMasRecienteDelUsuario.id_log === log.id_log;

    if (!esLaMasReciente) {
      return (
        <span style={{ color: "#6c757d", fontStyle: "italic" }}>
          Abandonada (Nueva sesión abierta)
        </span>
      );
    }

    // 3. Validaciones de tiempo (por si expiró el token)
    const timeIngreso = obtenerTimestamp(log.fecha_ingreso);
    const timeAhora = new Date().getTime();

    if (!timeIngreso) {
      return (
        <span style={{ color: "#6c757d", fontStyle: "italic" }}>
          Sesión finalizada (Histórico)
        </span>
      );
    }

    const diferenciaHoras = (timeAhora - timeIngreso) / (1000 * 60 * 60);

    if (isNaN(diferenciaHoras) || diferenciaHoras > 12 || diferenciaHoras < 0) {
      return (
        <span style={{ color: "#6c757d", fontStyle: "italic" }}>
          Cierre sin botón / Expirada
        </span>
      );
    }

    // 4. Si pasó todos los filtros, realmente está en la oficina trabajando
    return (
      <span style={{ color: "#28a745", fontWeight: "bold" }}>
        En línea / Sesión activa
      </span>
    );
  };

  return (
    <div className="va-wrapper">
      <div className="va-header">
        <div>
          <h1 className="va-title">Historial de Accesos</h1>
          <p className="va-subtitle">Registro de inicios y cierres de sesión del equipo</p>
        </div>
      </div>

      {loading ? (
        <div className="va-loading">
          <div className="va-spinner"></div>
          <p>Cargando historial...</p>
        </div>
      ) : (
        <div className="va-card">
          <div className="va-table-container">
            <table className="va-table">
              <thead>
                <tr>
                  <th>Fecha Ingreso</th>
                  <th>Fecha Salida</th>
                  <th>Cédula</th>
                  <th>Nombre</th>
                  <th>Dispositivo / IP</th>
                </tr>
              </thead>
              <tbody>
                {accesos.map((log) => {
                  const timestampIngreso = obtenerTimestamp(log.fecha_ingreso);
                  return (
                    <tr key={log.id_log}>
                      <td className="va-td-bold">
                        {timestampIngreso 
                          ? new Date(timestampIngreso).toLocaleString("es-EC")
                          : "-"}
                      </td>
                      <td>
                        {/* Le pasamos el log actual y el arreglo completo */}
                        {renderSalida(log, accesos)}
                      </td>
                      <td className="va-td-light">{log.cedula_usuario}</td>
                      <td>{log.usuario ? log.usuario.nombre : "Desconocido"}</td>
                      <td className="va-td-light" style={{ fontSize: "12px" }}>
                        IP: {log.ip || "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {accesos.length === 0 && <div className="va-empty">No hay accesos registrados aún.</div>}
        </div>
      )}
    </div>
  );
};

export default InformeAccesos;