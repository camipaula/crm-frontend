import { useNavigate, useLocation } from "react-router-dom";
import { logout, getNombreUsuario } from "../utils/auth";
import PropTypes from "prop-types";
import "../styles/navbar.css";

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const rutasSinFlecha = ["/admin", "/vendedora"];
  const mostrarFlecha = !rutasSinFlecha.includes(location.pathname);
  const nombreUsuario = getNombreUsuario();

  return (
    <nav className="navbar">
      {/* Izquierda: hamburger móvil + flecha back */}
      <div className="navbar-left">
        <button
          className="menu-toggle-btn"
          onClick={toggleSidebar}
          aria-label="Alternar menú"
          title="Menú"
        >
          ☰
        </button>

        {mostrarFlecha && (
          <button
            className="back-btn"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            title="Volver"
          >
            ⬅️
          </button>
        )}
      </div>

      {/* Centro: logo + nombre */}
      <div className="navbar-center">
        <div className="navbar-logo-mark">
          🏢
        </div>
        <span className="navbar-title">Santos Distribuidores</span>
      </div>

      {/* Derecha: bienvenida + logout */}
      <div className="navbar-right">
        {nombreUsuario && (
          <div className="navbar-user">
            <div className="navbar-user-avatar">
              {nombreUsuario.charAt(0).toUpperCase()}
            </div>
            <span className="navbar-user-name">
              {nombreUsuario}
            </span>
          </div>
        )}

        <button className="navbar-logout-btn" onClick={logout}>
          🚪 <span>Salir</span>
        </button>
      </div>
    </nav>
  );
};

Navbar.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
};

export default Navbar;