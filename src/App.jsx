import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProspectosAdmin from "./pages/ProspectosAdmin";
import ProspectosVendedora from "./pages/ProspectosVendedora";
import CrearProspecto from "./pages/CrearProspecto";
import EditarProspecto from "./pages/EditarProspecto";
import CrearProspectoAdmin from "./pages/CrearProspectoAdmin";
import DetalleProspecto from "./pages/DetalleProspecto";
import CalendarioVendedora from "./pages/CalendarioVendedora";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import SeguimientosVendedora from "./pages/SeguimientosVendedora";
import HistorialVenta from "./pages/HistorialVenta";
import AgendarSeguimiento from "./pages/AgendarSeguimiento";
import RegistrarResultado from "./pages/RegistrarResultado";
import AbrirVenta from "./pages/AbrirVenta";
import SeguimientosProspecto from "./pages/SeguimientosProspecto";
import CrearVendedora from "./pages/CrearVendedora";
import VendedorasAdmin from "./pages/VendedorasAdmin";
import EditarVendedora from "./pages/EditarVendedora";
import SeguimientosAdmin from "./pages/SeguimientosAdmin";


const App = () => {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");

      console.log("Verificando autenticación...");
      console.log("Token actual:", token);

      if (token) {
        setIsAuth(true);
      } else {
        setIsAuth(false);
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  if (isAuth === null) {
    return <div>Cargando...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Rutas para ADMINISTRADORA */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<Layout><Home /></Layout>} />
          <Route path="/prospectos-admin" element={<Layout><ProspectosAdmin /></Layout>} />
          <Route path="/crear-prospecto-admin" element={<Layout><CrearProspectoAdmin /></Layout>} />
          <Route path="/crear-vendedora" element={<Layout><CrearVendedora /></Layout>} />
          <Route path="/vendedoras-admin" element={<Layout><VendedorasAdmin /></Layout>}/>
          <Route path="/editar-vendedora/:cedula_ruc" element={<Layout><EditarVendedora /></Layout>}/>
          <Route path="/seguimientos-admin" element={<Layout><SeguimientosAdmin /></Layout>} />

        </Route>

        {/* Rutas para VENDEDORA */}
        <Route element={<ProtectedRoute allowedRoles={["vendedora"]} />}>
          <Route path="/vendedora" element={<Layout><Home /></Layout>} />
          <Route path="/prospectos-vendedora" element={<Layout><ProspectosVendedora /></Layout>} />
          <Route path="/seguimientos-vendedora" element={<Layout><SeguimientosVendedora /></Layout>} />
          <Route path="/calendario-vendedora" element={<Layout><CalendarioVendedora /></Layout>} />
          <Route path="/historial-venta/:id_venta" element={<Layout><HistorialVenta /></Layout>} />
        </Route>

        {/* Rutas comunes */}
        <Route element={<ProtectedRoute allowedRoles={["admin", "vendedora"]} />}>
          <Route path="/crear-prospecto" element={<Layout><CrearProspecto /></Layout>} />
          <Route path="/editar-prospecto/:id_prospecto" element={<Layout><EditarProspecto /></Layout>} />
          <Route path="/detalle-prospecto/:id_prospecto" element={<Layout><DetalleProspecto /></Layout>} />
          <Route path="/agendar-seguimiento/:id_venta" element={<Layout><AgendarSeguimiento /></Layout>} />
          <Route path="/registrar-resultado/:id_seguimiento" element={<Layout><RegistrarResultado /></Layout>} />
          <Route path="/abrir-venta/:id_prospecto" element={<Layout><AbrirVenta /></Layout>}/>
          <Route path="/seguimientos-prospecto/:id_prospecto" element={<Layout><SeguimientosProspecto /></Layout>} />
        </Route>

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
