import { logout } from "../utils/auth";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const rutasSinFlecha = ["/admin", "/vendedora"]; //sin flecha

  const mostrarFlecha = !rutasSinFlecha.includes(location.pathname);

  return (
    <nav className="navbar">
      {mostrarFlecha && (
        <button className="back-btn" onClick={() => navigate(-1)}>
          ⬅ 
        </button>
      )}
      <h2 className="navbar-title">Santos Distibuidores</h2>
      <div className="navbar-right">
        <button className="logout-btn" onClick={logout}>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
