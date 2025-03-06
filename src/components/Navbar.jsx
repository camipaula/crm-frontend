import { logout } from "../utils/auth";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const rutasSinFlecha = ["/admin", "/vendedora"]; // Aquí defines las rutas donde NO quieres la flecha

  const mostrarFlecha = !rutasSinFlecha.includes(location.pathname);

  return (
    <nav className="navbar">
      {mostrarFlecha && (
        <button className="back-btn" onClick={() => navigate(-1)}>
          ⬅ 
        </button>
      )}
      <h2 className="navbar-title">CRM</h2>
      <div className="navbar-right">
        <button className="logout-btn" onClick={logout}>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
