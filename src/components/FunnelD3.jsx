import { useEffect, useRef } from "react";
import D3Funnel from "d3-funnel";
import PropTypes from "prop-types";

// ACTUALIZADO PARA HACER MATCH CON LA BASE DE DATOS
const coloresFases = {
  "Captación": "#9e9e9e",            // Gris
  "Citas": "#03a9f4",                // Azul claro
  "Cotizaciones/ensayo": "#9c27b0",  // Morado
  "Seguimiento": "#ff9800",          // Naranja
  "Cierre de venta": "#4caf50",      // Verde
  "Prospección declinada": "#f44336" // Rojo (NUEVO)
};

const FunnelD3 = ({ data }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    containerRef.current.innerHTML = "";

    const funnelData = data.map((item) => [
      item.estado.toUpperCase(),
      item.cantidad,
      coloresFases[item.estado] || "#cccccc", 
    ]);

    const chart = new D3Funnel(containerRef.current);

    chart.draw(funnelData, {
      chart: {
        bottomWidth: 1 / 3,
        curve: { enabled: true },
        animate: 300,
        width: containerRef.current.offsetWidth || 350,
        height: 320,
      },
      block: {
        dynamicHeight: true,
        minHeight: 25, 
        highlight: true,
      },
      label: {
        fontSize: "12px",
        fill: "#fff",
        format: "{l}: {f}", 
      },
      tooltip: {
        enabled: true,
        format: "{l}: {f} prospectos", 
      },
    });
  }, [data]);

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: "400px",
          margin: "0 auto",
        }}
      ></div>

      {/* Leyenda Inferior */}
      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {data.map((fase, idx) => (
          <div
            key={idx}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  backgroundColor: coloresFases[fase.estado] || "#cccccc",
                  marginRight: "10px",
                  borderRadius: "3px",
                }}
              ></div>
              <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>
                {fase.estado}
              </span>
            </div>
            <span style={{ fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>
              {fase.cantidad} <span style={{ color: "#64748b", fontWeight: "400", fontSize: "12px" }}>({fase.porcentaje}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

FunnelD3.propTypes = {
  data: PropTypes.array.isRequired,
};

export default FunnelD3;