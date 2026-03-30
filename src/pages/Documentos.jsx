import { useState, useEffect } from "react";
import { getRol } from "../utils/auth";
import "../styles/documentos.css";

const TIPOS_VALIDOS = [
  { value: "propuesta", label: "Propuesta" },
  { value: "contrato", label: "Contrato" },
  { value: "correo", label: "Correo" },
  { value: "formulario", label: "Formulario" },
  { value: "interno", label: "Interno" },
  { value: "otro", label: "Otro" },
];

const Documentos = () => {
  const rol = getRol();
  const puedeSubir = rol === "admin" || rol === "vendedora";

  const [documentos, setDocumentos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [descargandoId, setDescargandoId] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const [opciones, setOpciones] = useState({ general: null, prospectos: [] });
  const [loadingOpciones, setLoadingOpciones] = useState(true);

  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroAlcance, setFiltroAlcance] = useState("");
  const [filtroIdProspecto, setFiltroIdProspecto] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [mostrarForm, setMostrarForm] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [tipoSubir, setTipoSubir] = useState("otro");
  const [alcanceSubir, setAlcanceSubir] = useState("general");

  const baseUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const fetchOpciones = async () => {
    setLoadingOpciones(true);
    try {
      const res = await fetch(`${baseUrl}/api/documentos/opciones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar opciones");
      const data = await res.json();
      setOpciones({
        general: data.general ?? { value: "general", label: "General (visible para todos)" },
        prospectos: Array.isArray(data.prospectos) ? data.prospectos : [],
      });
    } catch (err) {
      setOpciones({
        general: { value: "general", label: "General (visible para todos)" },
        prospectos: [],
      });
    } finally {
      setLoadingOpciones(false);
    }
  };

  useEffect(() => {
    fetchOpciones();
  }, []);

  const fetchDocumentos = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (filtroTipo) params.set("tipo", filtroTipo);
      if (filtroAlcance === "general") params.set("alcance", "general");
      if (filtroAlcance === "prospecto" && filtroIdProspecto) {
        params.set("alcance", "prospecto");
        params.set("id_prospecto", filtroIdProspecto);
      }

      const res = await fetch(`${baseUrl}/api/documentos?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al listar documentos");
      }
      const data = await res.json();
      setDocumentos(data.documentos || []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err.message);
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentos();
  }, [page, filtroTipo, filtroAlcance, filtroIdProspecto]);

  const handleSubir = async (e) => {
    e.preventDefault();
    if (!archivo) {
      setMensaje("Selecciona un archivo.");
      return;
    }
    setSubiendo(true);
    setMensaje("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      formData.append("tipo", tipoSubir);

      const esGeneral = alcanceSubir === "general";
      formData.append("alcance", esGeneral ? "general" : "prospecto");

      if (!esGeneral && alcanceSubir.startsWith("prospecto-")) {
        const id = alcanceSubir.replace("prospecto-", "");
        if (id) formData.append("id_prospecto", id);
      }

      const res = await fetch(`${baseUrl}/api/documentos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Error al subir el documento");

      setMensaje("Documento subido correctamente.");
      setArchivo(null);
      setTipoSubir("otro");
      setAlcanceSubir("general");
      setMostrarForm(false);
      fetchDocumentos();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const handleDescargar = async (doc) => {
    setDescargandoId(doc.id_documento);
    setError("");

    try {
      const res = await fetch(`${baseUrl}/api/documentos/${doc.id_documento}/archivo`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al descargar");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.nombre || "documento";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      setError(err.message);
    } finally {
      setDescargandoId(null);
    }
  };

  const handleEliminar = async (id_documento) => {
    if (!window.confirm("¿Eliminar este documento?")) return;

    try {
      const res = await fetch(`${baseUrl}/api/documentos/${id_documento}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Error al eliminar");

      setMensaje("Documento eliminado.");
      fetchDocumentos();
    } catch (err) {
      setError(err.message);
    }
  };

  const totalPaginas = Math.ceil(total / limit) || 1;

  const formatBytes = (bytes) => {
    if (bytes == null) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatFecha = (str) => {
    if (!str) return "-";
    try {
      return new Date(str).toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return str;
    }
  };

  return (
    <div className="docs-container">
      <div className="docs-header">
        <div>
          <h1 className="docs-title">Gestión de documentos</h1>
          <p className="docs-subtitle">
            Consulta, descarga y administra archivos generales o asociados a prospectos.
          </p>
        </div>

        <div className="docs-header-actions">
          {puedeSubir && (
            <button
              type="button"
              className="docs-btn docs-btn-primary"
              onClick={() => setMostrarForm(!mostrarForm)}
            >
              {mostrarForm ? "Cancelar" : "Subir documento"}
            </button>
          )}
        </div>
      </div>

      {(mensaje || error) && (
        <div className="docs-alerts">
          {mensaje && <div className="docs-alert docs-alert-success">{mensaje}</div>}
          {error && <div className="docs-alert docs-alert-error">{error}</div>}
        </div>
      )}

      {mostrarForm && puedeSubir && (
        <form className="docs-card docs-form-card" onSubmit={handleSubir}>
          <div className="docs-section-head">
            <h3>Nuevo documento</h3>
            <span>Completa los datos para subir el archivo</span>
          </div>

          <div className="docs-form-grid">
            <div className="docs-field docs-field-full">
              <label>
                Archivo <span className="docs-required">*</span>
              </label>
              <input
                className="docs-input-file"
                type="file"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                accept="*/*"
              />
            </div>

            <div className="docs-field">
              <label>
                Tipo <span className="docs-required">*</span>
              </label>
              <select
                className="docs-select"
                value={tipoSubir}
                onChange={(e) => setTipoSubir(e.target.value)}
                required
              >
                {TIPOS_VALIDOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="docs-field">
              <label>
                Alcance (¿Para quién?) <span className="docs-required">*</span>
              </label>
              <select
                className="docs-select"
                value={alcanceSubir}
                onChange={(e) => setAlcanceSubir(e.target.value)}
                required
                disabled={loadingOpciones}
              >
                {opciones.general && (
                  <option value={opciones.general.value}>{opciones.general.label}</option>
                )}
                {opciones.prospectos.map((p) => (
                  <option key={p.id_prospecto} value={`prospecto-${p.id_prospecto}`}>
                    {p.nombre || `Prospecto ${p.id_prospecto}`}
                  </option>
                ))}
                {loadingOpciones && opciones.prospectos.length === 0 && !opciones.general && (
                  <option value="">Cargando…</option>
                )}
              </select>
            </div>
          </div>

          <div className="docs-form-actions">
            <button
              type="submit"
              className="docs-btn docs-btn-primary"
              disabled={subiendo}
            >
              {subiendo ? "Subiendo..." : "Guardar documento"}
            </button>
          </div>
        </form>
      )}

      <div className="docs-card docs-filters-card">
        <div className="docs-section-head">
          <h3>Filtros</h3>
          <span>Encuentra más rápido los documentos que necesitas</span>
        </div>

        <div className="docs-filters-grid">
          <div className="docs-field">
            <label>Tipo</label>
            <select
              className="docs-select"
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {TIPOS_VALIDOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="docs-field">
            <label>Alcance</label>
            <select
              className="docs-select"
              value={filtroAlcance}
              onChange={(e) => {
                setFiltroAlcance(e.target.value);
                if (e.target.value !== "prospecto") setFiltroIdProspecto("");
                setPage(1);
              }}
            >
              <option value="">Todos (generales + por prospecto)</option>
              <option value="general">Generales (visible para todos)</option>
              <option value="prospecto">Por prospecto</option>
            </select>
          </div>

          {filtroAlcance === "prospecto" && (
            <div className="docs-field">
              <label>Prospecto</label>
              <select
                className="docs-select"
                value={filtroIdProspecto}
                onChange={(e) => {
                  setFiltroIdProspecto(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Seleccionar prospecto</option>
                {opciones.prospectos.map((p) => (
                  <option key={p.id_prospecto} value={String(p.id_prospecto)}>
                    {p.nombre || `Prospecto ${p.id_prospecto}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="docs-field docs-field-actions">
            <label>&nbsp;</label>
            <button
              type="button"
              className="docs-btn docs-btn-secondary"
              onClick={() => {
                setFiltroTipo("");
                setFiltroAlcance("");
                setFiltroIdProspecto("");
                setPage(1);
              }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div className="docs-card docs-table-card">
        <div className="docs-section-head">
          <h3>Listado</h3>
          <span>
            Total: {total} documento{total !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="docs-empty-state">Cargando documentos...</div>
        ) : documentos.length === 0 ? (
          <div className="docs-empty-state">No hay documentos.</div>
        ) : (
          <>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Alcance</th>
                    <th>Prospecto</th>
                    <th>Venta</th>
                    <th>Tamaño</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((doc) => (
                    <tr key={doc.id_documento}>
                      <td className="docs-name-cell">{doc.nombre}</td>
                      <td>
                        <span className="docs-badge">{doc.tipo}</span>
                      </td>
                      <td>
                        {doc.alcance === "general" || doc.id_prospecto == null
                          ? "General"
                          : "Prospecto"}
                      </td>
                      <td>{doc.id_prospecto != null ? doc.nombre_prospecto || doc.id_prospecto : "-"}</td>
                      <td>{doc.id_venta ?? "-"}</td>
                      <td>{formatBytes(doc.tamanio)}</td>
                      <td>{formatFecha(doc.created_at)}</td>
                      <td>
                        <div className="docs-actions-cell">
                          <button
                            type="button"
                            className="docs-btn docs-btn-download docs-btn-sm"
                            onClick={() => handleDescargar(doc)}
                            disabled={descargandoId === doc.id_documento}
                            title="Descargar"
                          >
                            {descargandoId === doc.id_documento ? "..." : "Descargar"}
                          </button>

                          {puedeSubir && (
                            <button
                              type="button"
                              className="docs-btn docs-btn-danger docs-btn-sm"
                              onClick={() => handleEliminar(doc.id_documento)}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="docs-pagination">
                <button
                  type="button"
                  className="docs-btn docs-btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </button>

                <span className="docs-pagination-text">
                  Página {page} de {totalPaginas}
                </span>

                <button
                  type="button"
                  className="docs-btn docs-btn-secondary"
                  disabled={page >= totalPaginas}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Documentos;