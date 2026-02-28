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
      setOpciones({ general: { value: "general", label: "General (visible para todos)" }, prospectos: [] });
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
    <div className="documentos-page">
      <h1 className="documentos-title">📁 Documentos</h1>

      {mensaje && <div className="documentos-mensaje success">{mensaje}</div>}
      {error && <div className="documentos-mensaje error">{error}</div>}

      <div className="documentos-actions">
        {puedeSubir && (
          <button
            type="button"
            className="btn-documentos btn-primary"
            onClick={() => setMostrarForm(!mostrarForm)}
          >
            {mostrarForm ? "✖ Cancelar" : "📤 Subir documento"}
          </button>
        )}
      </div>

      {mostrarForm && puedeSubir && (
        <form className="documentos-form" onSubmit={handleSubir}>
          <h3>Subir nuevo documento</h3>
          <div className="form-row">
            <label>
              Archivo <span className="required">*</span>
            </label>
            <input
              type="file"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              accept="*/*"
            />
          </div>
          <div className="form-row">
            <label>
              Tipo <span className="required">*</span>
            </label>
            <select value={tipoSubir} onChange={(e) => setTipoSubir(e.target.value)} required>
              {TIPOS_VALIDOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Alcance (¿Para quién?) <span className="required">*</span></label>
            <select
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
          <button type="submit" className="btn-documentos btn-submit" disabled={subiendo}>
            {subiendo ? "Subiendo…" : "Subir"}
          </button>
        </form>
      )}

      <div className="documentos-filtros">
        <div className="filtro-grupo">
          <label>Tipo</label>
          <select
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
        <div className="filtro-grupo">
          <label>Alcance</label>
          <select
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
          <div className="filtro-grupo">
            <label>Prospecto</label>
            <select
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
        <button
          type="button"
          className="btn-documentos btn-secondary"
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

      <div className="documentos-list-wrap">
        {loading ? (
          <p className="documentos-loading">Cargando documentos…</p>
        ) : documentos.length === 0 ? (
          <p className="documentos-empty">No hay documentos.</p>
        ) : (
          <>
            <p className="documentos-total">
              Total: {total} documento{total !== 1 ? "s" : ""}
            </p>
            <div className="documentos-table-wrap">
              <table className="documentos-table">
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
                      <td>{doc.nombre}</td>
                      <td>
                        <span className="badge-tipo">{doc.tipo}</span>
                      </td>
                      <td>{doc.alcance === "general" || doc.id_prospecto == null ? "General" : "Prospecto"}</td>
                      <td>{doc.id_prospecto != null ? doc.nombre_prospecto || doc.id_prospecto : "-"}</td>
                      <td>{doc.id_venta ?? "-"}</td>
                      <td>{formatBytes(doc.tamanio)}</td>
                      <td>{formatFecha(doc.created_at)}</td>
                      <td>
                        <div className="documentos-acciones-celda">
                          <button
                            type="button"
                            className="btn-documentos btn-download btn-sm"
                            onClick={() => handleDescargar(doc)}
                            disabled={descargandoId === doc.id_documento}
                            title="Descargar"
                          >
                            {descargandoId === doc.id_documento ? "…" : "⬇ Descargar"}
                          </button>
                          {puedeSubir && (
                            <button
                              type="button"
                              className="btn-documentos btn-danger btn-sm"
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
              <div className="documentos-paginacion">
                <button
                  type="button"
                  className="btn-documentos btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </button>
                <span>
                  Página {page} de {totalPaginas}
                </span>
                <button
                  type="button"
                  className="btn-documentos btn-secondary"
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
