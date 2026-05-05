// Componentes compartidos UI para las 3 variaciones

const fmt = (n, dec = 2) => {
  if (n == null || !isFinite(n)) return "—";
  return n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });
};
const fmtPct = (n) => n == null || !isFinite(n) ? "—" : (n * 100).toFixed(1) + "%";

const STATUS_COLOR = {
  ok:   { bg: "#e7f6ec", fg: "#0d7a3a", dot: "#0d7a3a", soft: "rgba(13,122,58,0.12)" },
  warn: { bg: "#fff5e0", fg: "#a06400", dot: "#d49100", soft: "rgba(212,145,0,0.14)" },
  high: { bg: "#fde8e8", fg: "#a11212", dot: "#c92a2a", soft: "rgba(201,42,42,0.12)" },
  low:  { bg: "#eef0fb", fg: "#3a3aa3", dot: "#5560d4", soft: "rgba(85,96,212,0.12)" },
  neutral: { bg: "#f1f3f5", fg: "#6b7280", dot: "#adb5bd", soft: "rgba(173,181,189,0.18)" },
};

function StatusDot({ status, size = 8 }) {
  const c = STATUS_COLOR[status] || STATUS_COLOR.neutral;
  return <span style={{
    display: "inline-block", width: size, height: size, borderRadius: "50%",
    background: c.dot, flexShrink: 0,
  }} />;
}

function StatusPill({ status, children }) {
  const c = STATUS_COLOR[status] || STATUS_COLOR.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.fg, letterSpacing: 0.2,
    }}>
      <StatusDot status={status} size={6} />
      {children}
    </span>
  );
}

function StatusBar({ value, status, max = 1 }) {
  const c = STATUS_COLOR[status] || STATUS_COLOR.neutral;
  const pct = value == null ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{
      width: "100%", height: 6, borderRadius: 999, background: "#eef1f4", overflow: "hidden",
    }}>
      <div style={{ width: `${pct}%`, height: "100%", background: c.dot, transition: "width .3s" }} />
    </div>
  );
}

// Hook para estado del proceso
function useProcesoState() {
  const [ubicacion, setUbicacion] = React.useState("BARCELONA");
  const [celula, setCelula] = React.useState("SALA BLANCA");
  const [tipoInyeccion, setTipoInyeccion] = React.useState("1K"); // "1K" | "2K"
  const [tCiclo, setTCiclo] = React.useState("");

  // Componente 1
  const [materialNombre, setMaterialNombre] = React.useState("PMMA");
  const [volumen, setVolumen] = React.useState("");
  const [pesoInyectada, setPesoInyectada] = React.useState("");
  const [anchoPieza, setAnchoPieza] = React.useState("");
  const [largoPieza, setLargoPieza] = React.useState("");
  const [nCavidades, setNCavidades] = React.useState("");
  const [espesor, setEspesor] = React.useState("");

  // Componente 2 (solo se usa en 2K) — cavidades se hereda de componente 1
  const [materialNombre2, setMaterialNombre2] = React.useState("TPE");
  const [volumen2, setVolumen2] = React.useState("");
  const [pesoInyectada2, setPesoInyectada2] = React.useState("");
  const [anchoPieza2, setAnchoPieza2] = React.useState("");
  const [largoPieza2, setLargoPieza2] = React.useState("");
  const [espesor2, setEspesor2] = React.useState("");

  // Helper: tiempo de refrigeración (segundos) para un material y espesor (mm).
  // Fórmula del CSV: t = (s²/(π²·α)) · ln((4/π)·(T1-T2)/(T'2-T2)),  α = K/(ρ·Cp).
  const computeTRefrig = (m, espesorMm) => {
    if (!m || !(espesorMm > 0)) return null;
    const Cp = m.calorEspecifico, K = m.conductividadTermica;
    const T1 = m.tempResina, T2 = m.tempMolde, T2p = m.tempDistorsion;
    if (!Cp || !K || T1 == null || T2 == null || T2p == null || m.densidad == null) return null;
    const dT = T1 - T2, dT2 = T2p - T2;
    if (!(dT > 0) || !(dT2 > 0)) return null;
    const alpha = K / (m.densidad * Cp);
    if (!(alpha > 0)) return null;
    const sCm = espesorMm / 10;
    const ratio = (4 / Math.PI) * (dT / dT2);
    if (!(ratio > 0)) return null;
    return (sCm * sCm / (Math.PI * Math.PI * alpha)) * Math.log(ratio);
  };

  // Helper: deriva los números de un componente
  const computeComp = (matName, vol, peso, ancho, largo, cav, espesorMm) => {
    const m = window.MATERIALES.find(x => x.material === matName);
    const dens = m?.densidad ?? 0;
    const tmax = m?.tiempoMax ?? null;
    const press = m?.presionEspecifica ?? 375;
    const volN = parseFloat(vol) || 0;
    const pesoN = volN > 0 && dens ? volN * dens : (parseFloat(peso) || 0);
    const cavN = parseFloat(cav) || 0;
    const anchoN = parseFloat(ancho) || 0;
    const largoN = parseFloat(largo) || 0;
    const espN = parseFloat(espesorMm) || 0;
    const area = cavN > 0 ? ((anchoN * largoN) / 100) * cavN : null;
    const fuerza = area != null ? (area * press) / 1000 : null;
    const tRefrig = computeTRefrig(m, espN);
    return { material: m, densidad: dens, tiempoMaxMaterial: tmax, presionEspecifica: press,
      volumenN: volN, pesoInyectadaN: pesoN, nCavN: cavN, anchoN, largoN, espesorN: espN,
      areaPieza: area, fuerzaCierre: fuerza, tiempoRefrigeracion: tRefrig };
  };

  const c1 = computeComp(materialNombre, volumen, pesoInyectada, anchoPieza, largoPieza, nCavidades, espesor);
  // Componente 2 hereda nCavidades del componente 1 (mismo molde)
  const c2 = computeComp(materialNombre2, volumen2, pesoInyectada2, anchoPieza2, largoPieza2, nCavidades, espesor2);

  // Tiempo de refrigeración relevante: el más alto de los componentes activos
  // (la pieza no se desmoldea hasta que el material más lento haya enfriado).
  const tRefrigUsado = tipoInyeccion === "2K"
    ? Math.max(c1.tiempoRefrigeracion || 0, c2.tiempoRefrigeracion || 0) || null
    : c1.tiempoRefrigeracion;
  // Ciclo estimado: la refrigeración suele ocupar ~60% del ciclo
  const tCicloEstimado = tRefrigUsado != null && tRefrigUsado > 0 ? tRefrigUsado / 0.60 : null;

  const tCicloN = parseFloat(tCiclo) || 0;
  const is2K = tipoInyeccion === "2K";

  // Valores combinados (en 2K se suman; en 1K = componente 1)
  const pesoInyectadaN = is2K ? c1.pesoInyectadaN + c2.pesoInyectadaN : c1.pesoInyectadaN;
  const volumenN = is2K ? c1.volumenN + c2.volumenN : c1.volumenN;
  // En 2K, el molde sigue teniendo c1.nCavN cavidades (las dos componentes comparten cavidades)
  const nCavN = c1.nCavN;
  const areaPieza = is2K
    ? ((c1.areaPieza || 0) + (c2.areaPieza || 0)) || null
    : c1.areaPieza;
  // En 2K la fuerza de cierre es la suma de cada componente (ambos empujan a la vez)
  const fuerzaCierre = is2K
    ? (c1.fuerzaCierre || 0) + (c2.fuerzaCierre || 0) || null
    : c1.fuerzaCierre;
  // Densidad efectiva: ponderada por volumen
  const densidad = is2K && volumenN > 0
    ? (c1.volumenN * c1.densidad + c2.volumenN * c2.densidad) / volumenN
    : c1.densidad;
  // Tiempo máx: el más restrictivo (mín)
  const tiempoMaxMaterial = is2K
    ? (c1.tiempoMaxMaterial != null && c2.tiempoMaxMaterial != null
        ? Math.min(c1.tiempoMaxMaterial, c2.tiempoMaxMaterial)
        : (c1.tiempoMaxMaterial ?? c2.tiempoMaxMaterial))
    : c1.tiempoMaxMaterial;

  const ctx = {
    densidad, tiempoMaxMaterial,
    pesoInyectada: pesoInyectadaN, tCiclo: tCicloN,
    volumen: volumenN, nCavidades: nCavN,
    fuerzaCierreNecesaria: fuerzaCierre,
  };

  // En 2K cada componente se evalúa en su propio husillo
  const c1Ctx = {
    densidad: c1.densidad, tiempoMaxMaterial: c1.tiempoMaxMaterial,
    pesoInyectada: c1.pesoInyectadaN, tCiclo: tCicloN,
    volumen: c1.volumenN, nCavidades: c1.nCavN,
  };
  const c2Ctx = {
    densidad: c2.densidad, tiempoMaxMaterial: c2.tiempoMaxMaterial,
    pesoInyectada: c2.pesoInyectadaN, tCiclo: tCicloN,
    volumen: c2.volumenN, nCavidades: c1.nCavN, // cavidades heredadas
  };

  const inyectorasFiltradas = window.INYECTORAS.filter(
    m => m.ubicacion === ubicacion && m.celula === celula
  );

  const resultados = inyectorasFiltradas.map(maq => {
    if (is2K) {
      const res = window.calcularInyectora2K(maq, c1Ctx, c2Ctx, fuerzaCierre);
      return { maquina: maq, res, score: window.scoreMaquina2K(res) };
    }
    const res = window.calcularInyectora(maq, ctx);
    return { maquina: maq, res, score: window.scoreMaquina(res) };
  });

  let recomendadaIdx = -1;
  let bestScore = -Infinity;
  resultados.forEach((r, i) => {
    if (r.score > bestScore) { bestScore = r.score; recomendadaIdx = i; }
  });
  if (bestScore <= -Infinity || pesoInyectadaN <= 0) recomendadaIdx = -1;

  return {
    ubicacion, setUbicacion, celula, setCelula,
    tipoInyeccion, setTipoInyeccion,
    tCiclo, setTCiclo,
    // Componente 1
    materialNombre, setMaterialNombre,
    volumen, setVolumen, pesoInyectada, setPesoInyectada,
    anchoPieza, setAnchoPieza, largoPieza, setLargoPieza, nCavidades, setNCavidades,
    espesor, setEspesor,
    // Componente 2 (cavidades hereda del componente 1)
    materialNombre2, setMaterialNombre2,
    volumen2, setVolumen2, pesoInyectada2, setPesoInyectada2,
    anchoPieza2, setAnchoPieza2, largoPieza2, setLargoPieza2,
    espesor2, setEspesor2,
    // Datos derivados por componente
    c1, c2,
    // Combinados
    material: c1.material, densidad, tiempoMaxMaterial,
    pesoInyectadaN, tCicloN, volumenN, nCavN, areaPieza, fuerzaCierre,
    // Refrigeración / ciclo estimado
    tRefrigUsado, tCicloEstimado,
    inyectorasFiltradas, resultados, recomendadaIdx, ctx,
  };
}

Object.assign(window, {
  fmt, fmtPct, STATUS_COLOR, StatusDot, StatusPill, StatusBar, useProcesoState,
});
