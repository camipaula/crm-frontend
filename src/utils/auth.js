import { jwtDecode } from "jwt-decode";

// Verifica si el usuario está autenticado
export const isAuthenticated = () => {
  return localStorage.getItem("token") !== null;
};

// Obtiene el rol del usuario desde el token JWT
export const getRol = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.rol; // Aseguramos que siempre tomamos el rol correcto del token
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

// Cierra sesión eliminando los datos del usuario y redirigiendo al login
export const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "/"; // Redirigir al login
};
