import { useEffect, useRef } from "react";
import D3Funnel from "d3-funnel";
import PropTypes from "prop-types";

const ordenFases = [
  "Captación",
  "Citas",
  "Cotizaciones/ensayo",
  "Seguimiento",
  "Cierre de venta",
  "Prospección declinada",
];

const colores = [
  "#9e9e9e",  // Captación
  "#03a9f4",  // Citas
  "#9c27b0",  // Cotizaciones/ensayo
  "#4caf50",  // Seguimiento
  "#2e7d32",  // Cierre de venta
  "#f44336",  // Prospección declinada
];

const FunnelD3 = ({ data }) => {
  const containerRef = useRef(null);

  // Helper para buscar el índice ignorando mayúsculas/minúsculas
  const getIndex = (estado) => {
    const idx = ordenFases.findIndex(
      (f) => f.toLowerCase() === (estado || "").toLowerCase()
    );
    return idx !== -1 ? idx : 99; // Si no lo encuentra, lo manda al final
  };

  const dataOrdenada = [...data].sort((a, b) => getIndex(a.estado) - getIndex(b.estado));

  useEffect(() => {
    if (!data || data.length === 0) return;

    containerRef.current.innerHTML = "";

    // Mapeamos los datos y le inyectamos el color EXACTO como tercer parámetro
    const funnelData = dataOrdenada.map((item) => {
      const index = getIndex(item.estado);
      const colorElegido = index !== 99 ? colores[index] : "#cccccc"; // Gris por defecto

      return [
        item.estado.toUpperCase(), // Label
        item.cantidad,             // Value
        colorElegido               // Color específico mágico para d3-funnel ✨
      ];
    });

    const chart = new D3Funnel(containerRef.current);

    chart.draw(funnelData, {
      chart: {
        bottomWidth: 1 / 3,
        curve: { enabled: true },
        animate: 200,
        width: containerRef.current.offsetWidth || 350,
        height: 300,
      },
      block: {
        dynamicHeight: true,
        minHeight: 15,
        highlight: true,
        // Eliminamos el fill: { scale: colores } de aquí para que use el color que le mandamos arriba
      },
      label: {
        fontSize: "14px",
        color: "#000",
        format: (label) => label,
      },
    });
  }, [data, dataOrdenada]);

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <h3>📌 FASES DE PROSPECCIÓN</h3>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: "350px",
          margin: "0 auto",
        }}
      ></div>

      {/* Leyenda */}
      <div style={{ marginTop: "10px" }}>
        {dataOrdenada.map((fase, idx) => {
          const index = getIndex(fase.estado);
          const colorFase = index !== 99 ? colores[index] : "#cccccc";

          return (
            <div
              key={idx}
              style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: colorFase,
                  marginRight: "8px",
                  borderRadius: "2px",
                }}
              ></div>
              <span style={{ fontSize: "13px", color: "#333" }}>
                {fase.estado.toUpperCase()}: {fase.cantidad} ({fase.porcentaje}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

FunnelD3.propTypes = {
  data: PropTypes.array.isRequired,
};

export default FunnelD3;