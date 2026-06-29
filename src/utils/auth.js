import { jwtDecode } from "jwt-decode";

// Verifica si el usuario está autenticado y si el token no ha expirado
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000; // tiempo actual en segundos

    if (decoded.exp < now) {
      alert("Tu sesión ha expirado. Por favor inicia sesión de nuevo.");
      logout();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error al verificar token:", error);
    logout();
    return false;
  }
};

// Obtiene el rol del usuario desde el token JWT
export const getRol = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.rol; // Toma el rol del payload del token
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return null;
  }
};

// Extrae la cédula desde el token JWT
export const obtenerCedulaDesdeToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded.cedula_ruc; // Devuelve la cédula del usuario
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return null;
  }
};

// Obtiene el nombre completo del usuario desde el token JWT
export const getNombreUsuario = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded.nombre;
  } catch (error) {
    console.error("Error al decodificar token:", error);
    return null;
  }
};

// Cierra sesión notificando al servidor para apagar el indicador verde en tiempo real
export const logout = async () => {
  const token = localStorage.getItem("token");

  if (token) {
    try {
      // Apunta exactamente a tu ruta de autenticación del backend
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}` 
        },
      });
    } catch (error) {
      console.error("No se pudo notificar el logout al servidor:", error);
    }
  }

  // Limpieza total del almacenamiento local del navegador
  localStorage.removeItem("token");

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("filtros_")) {
      localStorage.removeItem(key);
    }
  });

  window.location.href = "/"; // Redirigir al inicio/login
};