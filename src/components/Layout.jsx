import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { getRol } from "../utils/auth";
import "../styles/layout.css";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userRol = getRol();
    setRol(userRol);
    setLoading(false);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Para que el sidebar esta bien 
  if (loading) {
    return <div className="loading">Cargando...</div>;
  }  

  return (
    <div className="layout">
      <Navbar />
      {rol && (
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          rol={rol}
        />
      )}
      <div className="main-container">
        <div className="content">{children}</div>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
