import React from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import "../styles/dashboardLeads.css";

// Colores de redes sociales
const COLORS = {
  Instagram: "#e1306c",
  Facebook: "#1877f2",
  TikTok: "#000000",
  LinkedIn: "#0a66c2",
};

// Datos "Quemados" (Dummy Data)
const mockKpis = {
  totalLeads: 1248,
  costoPorLead: "$1.85",
  tasaConversion: "14.2%",
  campanasActivas: 6,
};

// Nuevas métricas exactas que pidió el cliente
const marketingMetrics = [
  { 
    label: "ROAS", 
    value: "3.5x", 
    desc: "Mide cuánto dinero se genera por cada dólar invertido en publicidad.",
    colorClass: "blue"
  },
  { 
    label: "Tasa Conversión", 
    value: "14.2%", 
    desc: "Porcentaje de usuarios que realizan la acción deseada del total que visitan.",
    colorClass: "green"
  },
  { 
    label: "CPA", 
    value: "$1.85", 
    desc: "Costo por Adquisición. Cuánto cuesta conseguir una conversión o un lead.",
    colorClass: "purple"
  },
  { 
    label: "CTR", 
    value: "2.8%", 
    desc: "Click Through Rate. Porcentaje de personas que hacen clic en un anuncio.",
    colorClass: "orange"
  },
  { 
    label: "CAC", 
    value: "$15.40", 
    desc: "Costo de Adquisición de Clientes. Costo total para adquirir un nuevo cliente.",
    colorClass: "red"
  }
];

const mockLeadsPorRed = [
  { name: "Instagram", value: 540 },
  { name: "Facebook", value: 420 },
  { name: "TikTok", value: 210 },
  { name: "LinkedIn", value: 78 },
];

const mockEvolucion = [
  { fecha: "01 Mar", leads: 45 },
  { fecha: "02 Mar", leads: 52 },
  { fecha: "03 Mar", leads: 38 },
  { fecha: "04 Mar", leads: 65 },
  { fecha: "05 Mar", leads: 48 },
  { fecha: "06 Mar", leads: 80 },
  { fecha: "07 Mar", leads: 95 },
];

const mockLeadsRecientes = [
  { id: 1, nombre: "María Fernanda", red: "Instagram", campana: "Promo Verano 2026", estado: "Nuevo", fecha: "Hace 10 min" },
  { id: 2, nombre: "Carlos Ruiz", red: "Facebook", campana: "Retargeting Web", estado: "Contactado", fecha: "Hace 1 hora" },
  { id: 3, nombre: "Ana López", red: "TikTok", campana: "Video Viral", estado: "Nuevo", fecha: "Hace 2 horas" },
  { id: 4, nombre: "Empresa XYZ", red: "LinkedIn", campana: "B2B Corporativo", estado: "Calificado", fecha: "Ayer" },
  { id: 5, nombre: "Juan Pérez", red: "Instagram", campana: "Promo Verano 2026", estado: "Convertido", fecha: "Ayer" },
];

const DashboardLeads = () => {
  const navigate = useNavigate();

  return (
    <div className="dl-container">
      {/* HEADER */}
      <div className="dl-header">
        <div className="dl-header-titles">
          <button className="dl-btn-outline" onClick={() => navigate(-1)}>⬅️ Volver</button>
          <h1 className="dl-title">Social Media Leads</h1>
          <p className="dl-subtitle">Ejemplo visual del rendimiento de captación en redes sociales</p>
        </div>
        <div className="dl-header-actions">
          <span className="dl-badge-demo">MODO DEMO</span>
        </div>
      </div>

      {/* KPIs SUPERIORES GENERALES */}
      <div className="dl-stats-grid">
        <div className="dl-stat-card border-blue">
          <span className="dl-stat-label">Total Leads (Mes)</span>
          <span className="dl-stat-value">{mockKpis.totalLeads}</span>
          <span className="dl-stat-sub green">↑ 12% vs mes anterior</span>
        </div>
        <div className="dl-stat-card border-purple">
          <span className="dl-stat-label">Costo por Lead (CPL)</span>
          <span className="dl-stat-value">{mockKpis.costoPorLead}</span>
          <span className="dl-stat-sub green">↓ $0.15 menos que ayer</span>
        </div>
        <div className="dl-stat-card border-orange">
          <span className="dl-stat-label">Tasa de Conversión</span>
          <span className="dl-stat-value">{mockKpis.tasaConversion}</span>
          <span className="dl-stat-sub gray">Promedio global: 10%</span>
        </div>
        <div className="dl-stat-card border-green">
          <span className="dl-stat-label">Campañas Activas</span>
          <span className="dl-stat-value">{mockKpis.campanasActivas}</span>
          <span className="dl-stat-sub gray">En 4 plataformas</span>
        </div>
      </div>

      <div className="dl-main-grid">
        
        {/* Gráfico de Barras */}
        <div className="dl-card col-8">
          <h3 className="dl-card-title">Evolución de Leads (Últimos 7 días)</h3>
          <div className="dl-chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mockEvolucion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="leads" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Circular */}
        <div className="dl-card col-4">
          <h3 className="dl-card-title">Leads por Plataforma</h3>
          <div className="dl-chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={mockLeadsPorRed} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {mockLeadsPorRed.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🔥 NUEVA SECCIÓN: MÉTRICAS CLAVE DE MARKETING (Las 5 del cliente) */}
        <div className="dl-card col-12 dl-highlight-card">
          <div className="dl-card-header">
            <h3 className="dl-card-title">Métricas Clave de Marketing Digital</h3>
            <span className="dl-badge-info">Visión de Rentabilidad</span>
          </div>
          
          <div className="dl-marketing-grid">
            {marketingMetrics.map((metric, index) => (
              <div className="dl-mk-card" key={index}>
                <span className="dl-mk-label">{metric.label}</span>
                <span className={`dl-mk-value text-${metric.colorClass}`}>{metric.value}</span>
                <p className="dl-mk-desc">{metric.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla de Leads Recientes */}
        <div className="dl-card col-12">
          <div className="dl-card-header">
            <h3 className="dl-card-title">Leads Entrantes Recientes</h3>
            <button className="dl-btn-primary">Ver todos los leads</button>
          </div>
          <div className="dl-table-wrapper">
            <table className="dl-table">
              <thead>
                <tr>
                  <th>Nombre del Lead</th>
                  <th>Plataforma</th>
                  <th>Campaña Origen</th>
                  <th>Fecha de Ingreso</th>
                  <th>Estado Actual</th>
                  <th>Acción Rápida</th>
                </tr>
              </thead>
              <tbody>
                {mockLeadsRecientes.map((lead) => (
                  <tr key={lead.id}>
                    <td className="dl-font-bold">{lead.nombre}</td>
                    <td>
                      <span className="dl-social-tag" style={{ color: COLORS[lead.red], backgroundColor: `${COLORS[lead.red]}15` }}>
                        {lead.red}
                      </span>
                    </td>
                    <td>{lead.campana}</td>
                    <td className="dl-muted">{lead.fecha}</td>
                    <td>
                      <span className={`dl-status-badge ${lead.estado.toLowerCase()}`}>
                        {lead.estado}
                      </span>
                    </td>
                    <td>
                      <button className="dl-btn-action">Contactar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardLeads;