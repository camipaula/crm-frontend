import { logout } from "../utils/auth";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import "../styles/navbar.css";

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const rutasSinFlecha = ["/admin", "/vendedora"];
  const mostrarFlecha = !rutasSinFlecha.includes(location.pathname);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {/* ☰ Solo en móviles */}
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          ☰
        </button>

        {/* ⬅️ Solo si aplica */}
        {mostrarFlecha && (
          <button className="back-btn" onClick={() => navigate(-1)}>
            ⬅
          </button>
        )}
      </div>

      <h2 className="navbar-title">Santos Distribuidores</h2>

      <div className="navbar-right">
        <button className="logout-btn" onClick={logout}>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

Navbar.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
};

export default Navbar;
