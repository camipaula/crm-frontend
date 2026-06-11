import { useState, useEffect } from "react";
import Select from "react-select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

// 👇 IMPORTAMOS EL NUEVO ESTILO
import "../styles/indicadores.css"; 

const MESES_OPCIONES = [
  { value: 1, label: "ENERO" },
  { value: 2, label: "FEBRERO" },
  { value: 3, label: "MARZO" },
  { value: 4, label: "ABRIL" },
  { value: 5, label: "MAYO" },
  { value: 6, label: "JUNIO" },
  { value: 7, label: "JULIO" },
  { value: 8, label: "AGOSTO" },
  { value: 9, label: "SEPTIEMBRE" },
  { value: 10, label: "OCTUBRE" },
  { value: 11, label: "NOVIEMBRE" },
  { value: 12, label: "DICIEMBRE" }
];

const IndicadoresCrm = () => {
  const actual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;

  const [anio, setAnio] = useState(actual);
  const [mesesFiltro, setMesesFiltro] = useState([MESES_OPCIONES[mesActual - 1]]);
  const [inversionMarketing, setInversionMarketing] = useState(600);
  
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);

  const base = () => (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");
  const token = () => localStorage.getItem("token");
  const auth = () => ({ Authorization: `Bearer ${token()}` });

  const cargarIndicadores = async () => {
    if (mesesFiltro.length === 0) {
      alert("⚠️ DEBES SELECCIONAR AL MENOS UN MES.");
      return;
    }

    setLoading(true);
    try {
      const mesesStr = mesesFiltro.map(m => m.value).join(",");

      const res = await fetch(`${base()}/api/indicadores?anio=${anio}&meses=${mesesStr}&inversionMarketing=${inversionMarketing}`, {
        headers: auth()
      });
      const data = await res.json();
      if (res.ok) {
        setDatos(data);
      } else {
        alert("ERROR: " + data.message.toUpperCase());
      }
    } catch (error) {
      alert("❌ ERROR AL CONECTAR CON EL SERVIDOR.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarIndicadores();
  }, []);

  const dataDinero = datos ? [
    { name: "RENTABILIDAD DEL CLIENTE ($)", CAC: datos.cac, CLV: datos.clv }
  ] : [];

  const dataPorcentajes = datos ? [
    { name: "EFECTIVIDAD (%)", "CONVERSIÓN": datos.tasaConversion, "RETENCIÓN": datos.tasaRetencion }
  ] : [];

  return (
    <div className="indicadores-container">
      <h1 className="indicadores-title">INDICADORES DE RENDIMIENTO (KPIS)</h1>
      <p className="indicadores-subtitle">MÉTRICAS CLAVE DEL CRM - SANTOS 2026</p>

      {/* BARRA DE CONTROLES */}
      <div className="indicadores-filtros">
        <label>
          AÑO:
          <select value={anio} onChange={e => setAnio(Number(e.target.value))}>
            {[actual - 1, actual, actual + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>

        <label style={{ minWidth: "280px", zIndex: 100 }}>
          MESES:
          <Select 
            isMulti
            options={MESES_OPCIONES}
            value={mesesFiltro}
            onChange={setMesesFiltro}
            placeholder="SELECCIONAR MESES..."
            styles={{
              control: (b) => ({ ...b, minHeight: '42px', borderRadius: '8px', textTransform: 'uppercase', borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }),
              menu: (b) => ({ ...b, zIndex: 999, textTransform: 'uppercase' })
            }}
          />
        </label>

        <label>
          INVERSIÓN MKT ($):
          <input 
            type="number" 
            value={inversionMarketing} 
            onChange={e => setInversionMarketing(e.target.value)}
          />
        </label>

        <button className="btn-calcular" onClick={cargarIndicadores}>
          🔄 CALCULAR KPIS
        </button>
      </div>

      {loading ? (
        <p className="loading-msg">CARGANDO MÉTRICAS...</p>
      ) : datos ? (
        <>
          {/* TARJETAS DE RESUMEN SUPERIORES */}
          <div className="indicadores-kpis-grid">
            <div className="indicadores-kpi-card">
              <span className="kpi-label">TOTAL LEADS</span>
              <span className="kpi-value">{datos.totalLeads}</span>
              <span className="kpi-sub">PROSPECTOS CAPTADOS</span>
            </div>

            <div className="indicadores-kpi-card ok">
              <span className="kpi-label">CLIENTES NUEVOS</span>
              <span className="kpi-value ok">{datos.totalClientesNuevos}</span>
              <span className="kpi-sub">VENTAS CERRADAS GANADAS</span>
            </div>

            <div className="indicadores-kpi-card destacado">
              <span className="kpi-label">SATISFACCIÓN (CSAT)</span>
              <span className="kpi-value star">5.0 ⭐</span>
              <span className="kpi-sub">SE VINCULARÁ AUTOMÁTICAMENTE CON FORMS</span>
            </div>
          </div>

          {/* GRÁFICAS */}
          <div className="indicadores-charts-grid">
            
            {/* GRÁFICA 1: CAC VS CLV */}
            <div className="indicadores-chart-card">
              <p className="chart-title">COSTO VS VALOR DE VIDA (USD)</p>
              <p className="kpi-sub" style={{ marginBottom: "20px" }}>COMPARA CUÁNTO CUESTA UN CLIENTE VS LO QUE DEJA EN DINERO</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dataDinero} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `$${value}`} cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, marginTop: "10px" }} />
                  <Bar dataKey="CAC" name="COSTO DE ADQUISICIÓN (CAC)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="CLV" name="VALOR DE VIDA (CLV)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* GRÁFICA 2: TASAS DE PORCENTAJES */}
            <div className="indicadores-chart-card">
              <p className="chart-title">TASAS DE EFECTIVIDAD (%)</p>
              <p className="kpi-sub" style={{ marginBottom: "20px" }}>RENDIMIENTO EN CONVERSIÓN Y RETENCIÓN</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dataPorcentajes} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, marginTop: "10px" }} />
                  <Bar dataKey="CONVERSIÓN" name="TASA DE CONVERSIÓN" fill="#1a73e8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="RETENCIÓN" name="TASA DE RETENCIÓN" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
};

export default IndicadoresCrm;