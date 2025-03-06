import Layout from "../components/Layout";
import { getRol } from "../utils/auth";  
const Home = () => {
  const rol = getRol();

  return (
    <Layout>
      <div className="home-container">
        <h1>Bienvenida, {rol === "vendedora" ? "Vendedora" : "Administradora"}</h1>
        <p>Selecciona una opción del menú para empezar.</p>
      </div>
    </Layout>
  );
};

export default Home;
