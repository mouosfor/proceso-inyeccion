function App() {
  const [tab, setTab] = React.useState("plano"); // plano | maquina
  const s = window.useProcesoState();

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
      borderBottom: tab === key ? "2px solid #0f172a" : "2px solid transparent",
      color: tab === key ? "#0f172a" : "#64748b",
      fontSize: 13, fontWeight: tab === key ? 700 : 500,
      cursor: "pointer", letterSpacing: 0.3, marginBottom: -1,
      fontFamily: "Inter, sans-serif",
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", flexDirection: "column" }}>
      <header style={{
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(229,232,236,0.6)",
        padding: "0 28px", display: "flex", alignItems: "center", gap: 24,
        height: 56, position: "sticky", top: 0, zIndex: 10,
      }} className="no-print">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="logo.png" alt="WalterPack" style={{ height: 30, width: "auto", borderRadius: 6 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>Proceso Inyección</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>Cumplimiento de máquina</div>
            </div>
          </div>
        <div style={{ display: "flex", gap: 0, marginLeft: 20, alignItems: "stretch", height: "100%" }}>
          {tabBtn("plano", "📐 Plano")}
          {tabBtn("maquina", "⚙ Selector de máquina")}
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {tab === "plano" && <window.PlanoTab onApply={onApplyExtracted} onGoToMaquina={() => setTab("maquina")} />}
        {tab === "maquina" && <window.MatchmakerView s={s} />}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
