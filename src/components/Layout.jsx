import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { getRol } from "../utils/auth";
import "../styles/layout.css";

const Layout = ({ children, extraClass }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userRol = getRol();
    setRol(userRol);

    // ✅ Restaurar estado del sidebar desde localStorage o establecer por defecto
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    const isMobile = window.innerWidth <= 768;
    
    if (savedSidebarState !== null) {
      // Si hay un estado guardado, usarlo (pero en móvil siempre cerrado)
      setIsSidebarOpen(isMobile ? false : savedSidebarState === 'true');
    } else {
      // Por defecto: abierto en escritorio, cerrado en móvil
      setIsSidebarOpen(!isMobile);
    }

    setLoading(false);

    // ✅ Manejar cambios de tamaño de ventana
    const handleResize = () => {
      const isMobileNow = window.innerWidth <= 768;
      const savedState = localStorage.getItem('sidebarOpen');
      
      // En móvil siempre cerrado, en escritorio restaurar estado guardado o abierto por defecto
      if (isMobileNow) {
        setIsSidebarOpen(false);
      } else if (savedState !== null) {
        setIsSidebarOpen(savedState === 'true');
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Guardar estado del sidebar cuando cambie
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('sidebarOpen', isSidebarOpen.toString());
    }
  }, [isSidebarOpen, loading]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="layout">
      <Navbar toggleSidebar={toggleSidebar} />

      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        rol={rol}
      />

<div className={`main-container ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"} ${extraClass || ""}`}>
        <div className="content">{children}</div>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  extraClass: PropTypes.string,
};


export default Layout;
