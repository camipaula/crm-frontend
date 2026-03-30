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

    const savedSidebarState = localStorage.getItem("sidebarOpen");
    const isMobile = window.innerWidth <= 768;

    if (savedSidebarState !== null) {
      setIsSidebarOpen(isMobile ? false : savedSidebarState === "true");
    } else {
      setIsSidebarOpen(!isMobile);
    }

    setLoading(false);

    const handleResize = () => {
      const isMobileNow = window.innerWidth <= 768;
      const savedState = localStorage.getItem("sidebarOpen");
      if (isMobileNow) {
        setIsSidebarOpen(false);
      } else if (savedState !== null) {
        setIsSidebarOpen(savedState === "true");
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem("sidebarOpen", isSidebarOpen.toString());
    }
  }, [isSidebarOpen, loading]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  if (loading) {
    return (
      <div className="layout-loading">
        <div className="layout-loading-spinner" />
      </div>
    );
  }

  return (
    <div className="layout">
      <Navbar toggleSidebar={toggleSidebar} />

      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        rol={rol}
      />

      <main
        className={`main-container ${
          isSidebarOpen ? "sidebar-open" : "sidebar-closed"
        } ${extraClass || ""}`}
      >
        <div className="content">{children}</div>
      </main>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  extraClass: PropTypes.string,
};

export default Layout;