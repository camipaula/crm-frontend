import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import { logout } from "../utils/auth";
import "../styles/sidebar.css";

const Sidebar = ({ isOpen, toggleSidebar, rol }) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      {/* Botón para abrir/cerrar sidebar */}
      <button className="toggle-btn" onClick={toggleSidebar}>
        ☰
      </button>

      {/* Menú de navegación */}
      <ul className="sidebar-menu">
        {rol === "vendedora" ? (
          <>
            <li><NavLink to="/vendedora" className="nav-link">👩 <span className={isOpen ? "show" : "hide"}>home</span></NavLink></li>

            <li><NavLink to="/prospectos-vendedora" className="nav-link">📋 <span className={isOpen ? "show" : "hide"}>Prospectos</span></NavLink></li>
            <li><NavLink to="/seguimientos-vendedora" className="nav-link">🛠 <span className={isOpen ? "show" : "hide"}>Seguimientos</span></NavLink></li>
            {/* <li><NavLink to="/vendedora" className="nav-link">📦 <span className={isOpen ? "show" : "hide"}>Pedidos</span></NavLink></li>
            <li><NavLink to="/vendedora" className="nav-link">👥 <span className={isOpen ? "show" : "hide"}>Clientes</span></NavLink></li>*/}
            <li><NavLink to="/calendario-vendedora" className="nav-link">📅 <span className={isOpen ? "show" : "hide"}>Calendario</span></NavLink></li>
          </>
        ) : rol === "admin" ? (
          <>
            <li><NavLink to="/admin" className="nav-link">👩 <span className={isOpen ? "show" : "hide"}>home</span></NavLink></li>

            <li><NavLink to="/vendedoras-admin" className="nav-link">👩‍💼 <span className={isOpen ? "show" : "hide"}>Vendedoras</span></NavLink></li>
            <li><NavLink to="/prospectos-admin" className="nav-link">📋 <span className={isOpen ? "show" : "hide"}>Prospectos</span></NavLink></li>
            <li><NavLink to="/seguimientos-admin" className="nav-link"> 🛠 <span className={isOpen ? "show" : "hide"}>Seguimientos</span></NavLink></li>
            <li><NavLink to="/calendario-admin" className="nav-link">📅 <span className={isOpen ? "show" : "hide"}>Calendario Vendedoras</span></NavLink></li>

            {/*<li><NavLink to="/admin" className="nav-link">📦 <span className={isOpen ? "show" : "hide"}>Pedidos</span></NavLink></li>
            <li><NavLink to="/admin" className="nav-link">👥 <span className={isOpen ? "show" : "hide"}>Clientes</span></NavLink></li>*/}
          </>
        ) : null}
      </ul>

      {/* Botón de cerrar sesión */}
      <button className="logout-btn" onClick={logout}>
        <span className={isOpen ? "show" : "hide"}>Cerrar Sesión</span>
      </button>
    </div>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  rol: PropTypes.string.isRequired,
};

export default Sidebar;
