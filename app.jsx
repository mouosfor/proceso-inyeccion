function App() {
  const [tab, setTab] = React.useState("dashboard"); // dashboard | plano | maquina
  const s = window.useProcesoState();

  // Compute recommended machine for print
  const kFilter = s.tipoInyeccion;
  const filtered = kFilter === "2K" ? window.INYECTORAS.filter(m => m.dosKa === "SI") : window.INYECTORAS;
  const filteredResults = filtered
    .filter(m => m.ubicacion === s.ubicacion && m.celula === s.celula)
    .map(maq => {
      if (kFilter === "2K") {
        const c1Ctx = { densidad: s.c1.densidad, tiempoMaxMaterial: s.c1.tiempoMaxMaterial, pesoInyectada: s.c1.pesoInyectadaN, tCiclo: s.tCicloN, volumen: s.c1.volumenN, nCavidades: s.c1.nCavN };
        const c2Ctx = { densidad: s.c2.densidad, tiempoMaxMaterial: s.c2.tiempoMaxMaterial, pesoInyectada: s.c2.pesoInyectadaN, tCiclo: s.tCicloN, volumen: s.c2.volumenN, nCavidades: s.c1.nCavN };
        const res = window.calcularInyectora2K(maq, c1Ctx, c2Ctx, s.fuerzaCierre);
        return { maquina: maq, res, score: window.scoreMaquina2K(res) };
      }
      const ctx = { densidad: s.c1.densidad, tiempoMaxMaterial: s.c1.tiempoMaxMaterial, pesoInyectada: s.c1.pesoInyectadaN, tCiclo: s.tCicloN, volumen: s.c1.volumenN, nCavidades: s.c1.nCavN, fuerzaCierreNecesaria: s.fuerzaCierre };
      const res = window.calcularInyectora(maq, ctx);
      return { maquina: maq, res, score: window.scoreMaquina(res) };
    })
    .sort((a, b) => b.score - a.score);
  const top = filteredResults[0];

  const onApplyExtracted = (data) => {
    if (data.material && window.MATERIALES.find(m => m.material === data.material)) {
      s.setMaterialNombre(data.material);
    }
    if (data.ancho_mm != null) s.setAnchoPieza(String(data.ancho_mm));
    if (data.largo_mm != null) s.setLargoPieza(String(data.largo_mm));
    if (data.n_cavidades != null) s.setNCavidades(String(data.n_cavidades));
    if (data.tiempo_ciclo_seg != null) s.setTCiclo(String(data.tiempo_ciclo_seg));
    if (data.volumen_cm3 != null) s.setVolumen(String(data.volumen_cm3));
    if (data.peso_inyectada_g != null && (data.volumen_cm3 == null)) {
      s.setPesoInyectada(String(data.peso_inyectada_g));
    }
    setTab("maquina");
  };

  const tabBtn = (key, label) => (
    <button onClick={() => setTab(key)} style={{
      padding: "10px 20px", border: "none", background: "transparent",
      borderBottom: tab === key ? "2px solid #6366f1" : "2px solid transparent",
      color: tab === key ? "#0f172a" : "#64748b",
      fontSize: 13, fontWeight: tab === key ? 700 : 500,
      cursor: "pointer", letterSpacing: 0.3, marginBottom: -1,
      fontFamily: "Inter, sans-serif",
      transition: "all .15s ease",
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", flexDirection: "column" }}>
      <header style={{
        background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(229,232,236,0.6)",
        padding: "0 28px", display: "flex", alignItems: "center", gap: 24,
        height: 56, position: "sticky", top: 0, zIndex: 10,
      }} className="no-print">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setTab("dashboard")}>
            <img src="logo.png" alt="WalterPack" style={{ height: 30, width: "auto", borderRadius: 6 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>Proceso Inyección</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>Cumplimiento de máquina</div>
            </div>
          </div>
        <div style={{ display: "flex", gap: 0, marginLeft: 20, alignItems: "stretch", height: "100%" }}>
          {tabBtn("dashboard", "🏠 Inicio")}
          {tabBtn("plano", "📐 Plano")}
          {tabBtn("maquina", "⚙ Selector de máquina")}
        </div>
      </header>

      <main style={{ flex: 1, background: tab === "dashboard" ? "#f8fafc" : "transparent" }} className="no-print">
        {tab === "dashboard" && <window.DashboardHome onGoToMaquina={() => setTab("maquina")} />}
        {tab === "plano" && <window.PlanoTab onApply={onApplyExtracted} onGoToMaquina={() => setTab("maquina")} />}
        {tab === "maquina" && <window.MatchmakerView s={s} />}
      </main>

      {/* Print-only report */}
      <div id="print-report-container" style={{ display: "none" }}>
        {top && top.res.valid && top.res.valid !== false && s.pesoInyectadaN > 0 && (
          <window.PrintReport s={s} top={top} />
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);