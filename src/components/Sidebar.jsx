import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import { logout, getNombreUsuario } from "../utils/auth";
import "../styles/sidebar.css";

const NAV_ITEMS = {
  vendedora: [
    { to: "/vendedora",              icon: "🏠", label: "Home", section: "principal" },
    /*{ to: "/vendedora-home-antiguo", icon: "🏠", label: "Home Clásico",    section: "principal" },*/
    { to: "/prospectos-vendedora",   icon: "📋", label: "Prospectos",      section: "principal", badge: null },
    { to: "/seguimientos-vendedora", icon: "🛠", label: "Seguimientos",    section: "principal" },
    { to: "/calendario-vendedora",   icon: "📅", label: "Calendario",      section: "herramientas" },
    { to: "/documentos",             icon: "📁", label: "Documentos",      section: "herramientas" },
     /*{ to: "/leads-demo", icon: "📱", label: "Leads Social", section: "principal" },*/
  ],
  admin: [
    { to: "/admin",                  icon: "🏠", label: "Home",       section: "principal" },
    /*{ to: "/admin-home-antiguo",     icon: "🏠", label: "Home Clásico",          section: "principal" },*/
    { to: "/vendedoras-admin",       icon: "👩‍💼", label: "Vendedoras",             section: "principal" },
    { to: "/prospectos-admin",       icon: "📋", label: "Prospectos",              section: "principal" },
    { to: "/seguimientos-admin",     icon: "🛠", label: "Seguimientos",            section: "principal" },
    { to: "/calendario-admin",       icon: "📅", label: "Calendario",              section: "herramientas" },
    { to: "/forecast-admin",         icon: "📊", label: "Forecast / Metas",        section: "herramientas" },
    { to: "/dashboard-meta-vs-real", icon: "📈", label: "Meta vs Real",            section: "herramientas" },
    { to: "/documentos",             icon: "📁", label: "Documentos",              section: "herramientas" },
    { to: "/mi-informacion",         icon: "🧍", label: "Mi Información",          section: "herramientas", adminOnly: true },
    /*{ to: "/leads-demo", icon: "📱", label: "Leads Social", section: "principal" },*/
  ],
};

const getRoleLabel = (role) => {
  if (role === "admin") return "Administrador";
  if (role === "lectura") return "Solo lectura";
  return "Vendedora";
};

const Sidebar = ({ isOpen, toggleSidebar, rol }) => {
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) toggleSidebar();
  };

  const effectiveRole = rol === "lectura" ? "admin" : rol;
  const items = NAV_ITEMS[effectiveRole] || [];

  const principalItems = items.filter(
    (i) => i.section === "principal" && (!i.adminOnly || rol === "admin")
  );
  const herramientasItems = items.filter(
    (i) => i.section === "herramientas" && (!i.adminOnly || rol === "admin")
  );

  const nombreUsuario = getNombreUsuario() || "Usuario";
  const inicialUsuario = nombreUsuario.charAt(0).toUpperCase();

  return (
    <>
      {isOpen && <div className="sb-overlay" onClick={toggleSidebar} />}

      <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
        <div className="sb-header">
          <div className="sb-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <span className="sb-brand">CRM Ventas</span>
        </div>

        <nav className="sb-nav">
          <div className="sb-section">
            <span className="sb-section-label">Principal</span>
            <ul>
              {principalItems.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={({ isActive }) => `sb-link ${isActive ? "active" : ""}`} onClick={handleLinkClick}>
                    <span className="sb-icon">{item.icon}</span>
                    <span className="sb-label">{item.label}</span>
                    {item.badge != null && <span className="sb-badge">{item.badge}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {herramientasItems.length > 0 && (
            <div className="sb-section">
              <span className="sb-section-label">Herramientas</span>
              <ul>
                {herramientasItems.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} className={({ isActive }) => `sb-link ${isActive ? "active" : ""}`} onClick={handleLinkClick}>
                      <span className="sb-icon">{item.icon}</span>
                      <span className="sb-label">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        <div className="sb-footer">
          <div className="sb-user">
            <div className={`sb-avatar sb-avatar--${effectiveRole}`}>
              {inicialUsuario}
            </div>
            <div className="sb-user-info">
              <span className="sb-user-name">{nombreUsuario}</span>
              <span className="sb-user-role">{getRoleLabel(rol)}</span>
            </div>
          </div>

          <button className="sb-logout" onClick={logout}>
            <span className="sb-icon">🚪</span>
            <span className="sb-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  rol: PropTypes.string.isRequired,
};

export default Sidebar;