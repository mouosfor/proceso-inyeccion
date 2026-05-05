// ═══════════════════════════════════════════════════════════════
// MATCHMAKER VIEW V5 — Results panel completamente rediseñado
// Impactante, moderno, con tarjetas interactivas
// ═══════════════════════════════════════════════════════════════

const { fmt, fmtPct } = window;

// ─── Colores de estado ───
const C = {
  ok:    "#0d7a3a",
  warn:  "#d49100",
  high:  "#c92a2a",
  low:   "#5560d4",
  neutral: "#adb5bd",
};
const CBg = {
  ok:    "#e7f6ec",
  warn:  "#fff5e0",
  high:  "#fde8e8",
  low:   "#eef0fb",
  neutral: "#f1f3f5",
};

function BadgeDot({ status, size = 7 }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: C[status] || C.neutral, flexShrink: 0 }} />;
}

function MiniBadge({ status, children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px",
      borderRadius: 999, fontSize: 10, fontWeight: 600,
      background: CBg[status] || CBg.neutral, color: C[status] || C.neutral,
    }}>
      <BadgeDot status={status} size={5} />
      {children}
    </span>
  );
}

function ScoreRing({ score, size = 44 }) {
  const maxScore = 120;
  const normalized = Math.max(0, Math.min(100, ((score + 100) / (maxScore + 100)) * 100));
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (normalized / 100) * circ;
  const color = normalized > 70 ? "#059669" : normalized > 40 ? "#d49100" : "#c92a2a";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f6" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color,
      }}>
        {Math.round(normalized)}
      </div>
    </div>
  );
}

const val2K = (p, sec, formatter) => {
  if (p == null && sec == null) return "—";
  return `${p != null ? formatter(p) : "—"} / ${sec != null ? formatter(sec) : "—"}`;
};
const worstStatus = (...sts) => {
  const order = { high: 4, warn: 3, low: 2, ok: 1, neutral: 0 };
  return sts.reduce((w, x) => (order[x] || 0) > (order[w] || 0) ? x : w, "neutral");
};

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
function MatchmakerView({ s }) {
  const [compareIds, setCompareIds] = React.useState([]);
  const kFilter = s.tipoInyeccion;
  const setKFilter = s.setTipoInyeccion;
  const filtered = kFilter === "2K" ? s.resultados.filter(r => r.maquina.dosKa === "SI") : s.resultados;
  const sorted = [...filtered].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const [activeTab, setActiveTab] = React.useState("all");
  const [expandedId, setExpandedId] = React.useState(null);

  const toggleCompare = (key) => {
    setCompareIds(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key].slice(-2));
  };
  const compared = compareIds.map(id => sorted.find(x => x.maquina.maquina === id)).filter(Boolean);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "340px 1fr",
      minHeight: "calc(100vh - 56px)",
      background: "#f1f5f9",
      fontFamily: "Inter, sans-serif",
    }}>
      <Sidebar s={s} kFilter={kFilter} setKFilter={setKFilter} />

      <main style={{ overflowY: "auto", padding: "20px 24px" }}>
        {top && top.res.valid && s.pesoInyectadaN > 0 ? (
          <>
            <HeroCard top={top} s={s} />
            <ComparisonPanel compared={compared} toggleCompare={toggleCompare} />
            <MachineListPanel
              sorted={sorted}
              compareIds={compareIds}
              toggleCompare={toggleCompare}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR (sin cambios, se mantiene limpio)
// ═══════════════════════════════════════════════════════════════
function Sidebar({ s, kFilter, setKFilter }) {
  const baseInput = {
    padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
    fontSize: 13, background: "#fff", color: "#0f172a", outline: "none",
    fontFamily: "Inter, sans-serif", width: "100%",
  };
  const selStyle = {
    ...baseInput,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
    paddingRight: 28, fontWeight: 600,
  };
  const L = ({ children, suf }) => <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{children}{suf && <span style={{ fontWeight: 400, color: "#94a3b8" }}> · {suf}</span>}</div>;

  return (
    <aside style={{ background: "#fff", borderRight: "1px solid #e2e8f0", padding: "16px 16px 20px", overflowY: "auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Localización</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><L>Planta</L><select style={selStyle} value={s.ubicacion} onChange={e => s.setUbicacion(e.target.value)}>{window.UBICACIONES.map(u => <option key={u}>{u}</option>)}</select></div>
            <div><L>Sala</L><select style={selStyle} value={s.celula} onChange={e => s.setCelula(e.target.value)}>{window.CELULAS.map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
        </div>

        <div>
          <L>Tipo de inyección</L>
          <div style={{ display: "flex", gap: 6, background: "#f1f5f9", borderRadius: 8, padding: 3 }}>
            {[{ k: "1K", l: "1K · Simple" }, { k: "2K", l: "2K · Bi-material" }].map(o => {
              const a = kFilter === o.k;
              return <button key={o.k} onClick={() => setKFilter(o.k)} style={{
                flex: 1, padding: "7px", border: "none", borderRadius: 7,
                background: a ? "#fff" : "transparent", color: a ? "#0f172a" : "#64748b",
                fontSize: 12, fontWeight: a ? 700 : 500, cursor: "pointer",
                boxShadow: a ? "0 1px 4px -1px rgba(0,0,0,0.1)" : "none",
                transition: "all .15s ease",
              }}>{o.l}</button>;
            })}
          </div>
        </div>

        <div>
          <L suf="segundos">Tiempo de ciclo</L>
          <input style={baseInput} type="number" value={s.tCiclo} onChange={e => s.setTCiclo(e.target.value)} placeholder="0" />
          {s.tCicloEstimado != null && s.tCicloEstimado > 0 && (
            <div style={{
              marginTop: 6, padding: "7px 10px",
              background: "#fff", border: "1px dashed #c7d2fe", borderRadius: 8,
              fontSize: 11, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
            }}>
              <span style={{ color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>
                💡 estimado <b style={{ color: "#4f46e5" }}>{s.tCicloEstimado.toFixed(1)} s</b>
                <span style={{ color: "#94a3b8", marginLeft: 4 }}>· refrig {s.tRefrigUsado.toFixed(1)} s</span>
              </span>
              <button onClick={() => s.setTCiclo(s.tCicloEstimado.toFixed(1))} style={{
                padding: "3px 8px", background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#fff", border: "none", borderRadius: 6,
                fontSize: 9, fontWeight: 700, cursor: "pointer", letterSpacing: 0.4, whiteSpace: "nowrap",
              }}>USAR ↑</button>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid #eef2f6", paddingTop: 8 }}>
          <CForm title={kFilter === "2K" ? "Componente 1" : "Datos de pieza"} c="#6366f1"
            baseInput={baseInput} selStyle={selStyle} L={L}
            material={s.materialNombre} setMaterial={s.setMaterialNombre}
            vol={s.volumen} setVol={s.setVolumen} peso={s.c1.pesoInyectadaN}
            ancho={s.anchoPieza} setAncho={s.setAnchoPieza}
            largo={s.largoPieza} setLargo={s.setLargoPieza}
            cav={s.nCavidades} setCav={s.setNCavidades} readOnly={false}
            espesor={s.espesor} setEspesor={s.setEspesor}
            tRefrig={s.c1.tiempoRefrigeracion}
            dens={s.c1.densidad} tmax={s.c1.tiempoMaxMaterial} />
        </div>

        {kFilter === "2K" && <div><CForm title="Componente 2" c="#059669"
          baseInput={baseInput} selStyle={selStyle} L={L}
          material={s.materialNombre2} setMaterial={s.setMaterialNombre2}
          vol={s.volumen2} setVol={s.setVolumen2} peso={s.c2.pesoInyectadaN}
          ancho={s.anchoPieza2} setAncho={s.setAnchoPieza2}
          largo={s.largoPieza2} setLargo={s.setLargoPieza2}
          cav={s.nCavidades} setCav={s.setNCavidades} readOnly={true}
          espesor={s.espesor2} setEspesor={s.setEspesor2}
          tRefrig={s.c2.tiempoRefrigeracion}
          dens={s.c2.densidad} tmax={s.c2.tiempoMaxMaterial} /></div>}

        {/* Detalles del molde — afectan a la fuerza de cierre */}
        <details style={{ borderTop: "1px solid #eef2f6", paddingTop: 8 }}>
          <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6, listStyle: "none", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9 }}>▶</span> Detalles del molde
            <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 10, textTransform: "none", letterSpacing: 0 }}>· opcional</span>
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div><L suf="mm²">Sup. colada</L><input style={baseInput} type="number" value={s.superficieColada} onChange={e => s.setSuperficieColada(e.target.value)} placeholder="0" /></div>
              <div><L>Coef. seguridad</L><input style={baseInput} type="number" step="0.05" value={s.coefSeguridad} onChange={e => s.setCoefSeguridad(e.target.value)} placeholder="1.2" /></div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.4, textTransform: "uppercase", marginTop: 2 }}>Correderas</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              <div><L suf="mm²">Sup.</L><input style={baseInput} type="number" value={s.superficieCorredera} onChange={e => s.setSuperficieCorredera(e.target.value)} placeholder="0" /></div>
              <div><L>Nº</L><input style={baseInput} type="number" value={s.nCorrederas} onChange={e => s.setNCorrederas(e.target.value)} placeholder="0" /></div>
              <div><L suf="°">Ángulo</L><input style={baseInput} type="number" value={s.anguloCorredera} onChange={e => s.setAnguloCorredera(e.target.value)} placeholder="20" /></div>
            </div>
          </div>
        </details>

        <div style={{ background: "linear-gradient(135deg, #eef2ff, #fff)", borderRadius: 10, padding: "12px 14px", border: "1px solid #e0e7ff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><div style={{ fontSize: 9, fontWeight: 600, color: "#6366f1", letterSpacing: 0.6, textTransform: "uppercase" }}>Área proyectada</div><div style={{ fontSize: 15, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "#0f172a", marginTop: 2 }}>{s.areaPieza != null ? s.areaPieza.toFixed(1) : "—"} <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>cm²</span></div></div>
            <div><div style={{ fontSize: 9, fontWeight: 600, color: "#6366f1", letterSpacing: 0.6, textTransform: "uppercase" }}>Fuerza de cierre</div><div style={{ fontSize: 15, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "#0f172a", marginTop: 2 }}>{s.fuerzaCierre != null ? s.fuerzaCierre.toFixed(0) : "—"} <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>ton</span></div></div>
          </div>
          {s.fuerzaCierre != null && (s.fuerzaColada > 0 || s.fuerzaCorrederas > 0) && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #c7d2fe", fontSize: 10, color: "#64748b", fontFamily: "JetBrains Mono, monospace", display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span>pieza <b style={{ color: "#0f172a" }}>{s.fuerzaPieza.toFixed(1)}t</b></span>
              {s.fuerzaColada > 0 && <span>· colada <b style={{ color: "#0f172a" }}>{s.fuerzaColada.toFixed(1)}t</b></span>}
              {s.fuerzaCorrederas > 0 && <span>· correderas <b style={{ color: "#0f172a" }}>{s.fuerzaCorrederas.toFixed(1)}t</b></span>}
            </div>
          )}
        </div>

        <button onClick={() => {
          if (!s.pesoInyectadaN || s.pesoInyectadaN <= 0) {
            alert("Introduce primero los datos de la pieza (volumen, ancho, largo, cavidades) para generar el informe.");
            return;
          }
          window.print();
        }} style={{
          padding: "10px", width: "100%", background: "linear-gradient(135deg, #059669, #10b981)",
          color: "#fff", border: "none", borderRadius: 10,
          fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 0.6,
          boxShadow: "0 4px 12px -4px rgba(5,150,105,0.4)", transition: "all .2s ease",
        }} onMouseEnter={e => { e.target.style.transform = "translateY(-1px)"; }} onMouseLeave={e => { e.target.style.transform = ""; }}>Exportar PDF</button>
      </div>
    </aside>
  );
}

function CForm({ title, c, baseInput, selStyle, L, material, setMaterial, vol, setVol, peso, ancho, setAncho, largo, setLargo, cav, setCav, readOnly, espesor, setEspesor, tRefrig, dens, tmax }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: c, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div><L>Material</L><select style={selStyle} value={material} onChange={e => setMaterial(e.target.value)}>{window.MATERIALES.map(m => <option key={m.material}>{m.material}</option>)}</select></div>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ flex: 1, padding: "5px 8px", background: "#f8fafc", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono, monospace", border: "1px solid #eef2f6", display: "flex", alignItems: "center", gap: 4 }}><span style={{ color: "#94a3b8" }}>ρ</span><b style={{ color: "#0f172a", marginLeft: "auto" }}>{dens ? dens.toFixed(2) : "—"}</b></div>
          <div style={{ flex: 1, padding: "5px 8px", background: "#f8fafc", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono, monospace", border: "1px solid #eef2f6", display: "flex", alignItems: "center", gap: 4 }}><span style={{ color: "#94a3b8" }}>t.máx</span><b style={{ color: "#0f172a", marginLeft: "auto" }}>{tmax ?? "—"}m</b></div>
        </div>
        <div><L suf="cm³">Volumen</L><input style={baseInput} type="number" value={vol} onChange={e => setVol(e.target.value)} placeholder="0" /></div>
        <div><L suf="auto · g">Peso inyectada</L><input style={{ ...baseInput, color: "#94a3b8", background: "#f8fafc", border: "1px solid #eef2f6", fontWeight: 600 }} readOnly type="text" value={peso ? peso.toFixed(2) : ""} placeholder="—" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <div><L suf="mm">Ancho</L><input style={baseInput} type="number" value={ancho} onChange={e => setAncho(e.target.value)} placeholder="0" /></div>
          <div><L suf="mm">Largo</L><input style={baseInput} type="number" value={largo} onChange={e => setLargo(e.target.value)} placeholder="0" /></div>
        </div>
        <div><L>{readOnly ? "Cavidades · heredado" : "Cavidades"}</L>{readOnly ? <input style={{ ...baseInput, color: "#94a3b8", background: "#f8fafc", border: "1px solid #eef2f6" }} readOnly type="text" value={cav || ""} placeholder="—" /> : <input style={baseInput} type="number" value={cav} onChange={e => setCav(e.target.value)} placeholder="0" />}</div>
        {setEspesor && (
          <div>
            <L suf="mm">Espesor pared</L>
            <input style={baseInput} type="number" step="0.1" value={espesor} onChange={e => setEspesor(e.target.value)} placeholder="0" />
            {tRefrig != null && tRefrig > 0 && (
              <div style={{
                marginTop: 6, padding: "6px 9px",
                background: "#fff", border: `1px dashed ${c}40`, borderRadius: 6,
                fontSize: 10, fontFamily: "JetBrains Mono, monospace",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ color: "#64748b" }}>❄️ t.refrig</span>
                <b style={{ color: c }}>{tRefrig.toFixed(1)} s</b>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HERO CARD — MÁQUINA RECOMENDADA (versión impactante)
// ═══════════════════════════════════════════════════════════════
function HeroCard({ top, s }) {
  const r = top.res;
  const m = top.maquina;
  const is2K = r.mode === "2K";

  return (
    <div style={{
      borderRadius: 18, marginBottom: 18,
      background: "#fff",
      border: "1px solid #d1fae5",
      overflow: "hidden",
      boxShadow: "0 12px 40px -12px rgba(5,150,105,0.25)",
    }}>
      {/* Gradient header */}
      <div style={{
        background: "linear-gradient(135deg, #059669 0%, #10b981 40%, #059669 100%)",
        padding: "18px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -30, right: -20,
          width: 150, height: 150, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: "40%",
          width: 100, height: 100, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 12px", borderRadius: 999,
              background: "rgba(255,255,255,0.2)",
              color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: 1,
              marginBottom: 8,
            }}>
              ★ MÁQUINA RECOMENDADA
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginBottom: 2 }}>
              {m.ubicacion} · {m.marca}
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff", whiteSpace: "pre-line", lineHeight: 1.2 }}>
              {m.maquina}
            </h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>Tonelaje</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", fontFamily: "JetBrains Mono, monospace" }}>
              {m.tonelaje}<span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>t</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ padding: "18px 22px" }}>
        {is2K ? (
          <Hero2KTable top={top} s={s} />
        ) : (
          <>
            {/* Main 5 metrics row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              <MetricCard label="Utilización" value={fmtPct(r.porcentajeUtilizacion)} status={window.statusUtilizacion(r.porcentajeUtilizacion)} />
              <MetricCard label="Permanencia" value={`${fmt(r.tiempoPermanencia, 1)} min`} sub={`máx ${r.tiempoMaxMaterial}m`} status={window.statusPermanencia(r.tiempoPermanencia, r.tiempoMaxMaterial)} />
              <MetricCard label="L/D" value={fmt(r.ratioLD)} status={window.statusRatioLD(r.ratioLD)} />
              <MetricCard label="Dosis real" value={`${fmt(r.cm3DosisReal)} cm³`} />
              <MetricCard label="F.cierre/Tonelaje" value={fmtPct(r.relacionTonelaje)} status={window.statusTonelaje(r.relacionTonelaje)} />
            </div>

            {/* Extra details row */}
            <div style={{
              marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
              padding: "10px 14px", background: "#f8fafc", borderRadius: 10,
            }}>
              <MiniInfo label="Dosis máx" value={`${fmt(r.dosisMaxCm3)} cm³`} />
              <MiniInfo label="Gramos máx" value={`${fmt(r.gramosDosisMax)} g`} />
              <MiniInfo label="Carrera real" value={`${fmt(r.carreraReal)} mm`} />
              <MiniInfo label="Gramos real" value={`${fmt(r.gramosDosisReal)} g`} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, status, sub }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{label}</div>
      <div style={{
        fontSize: 20, fontWeight: 700, fontFamily: "JetBrains Mono, monospace",
        color: status ? (C[status] || "#0f172a") : "#0f172a",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {status && <BadgeDot status={status} size={8} />}
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "#0f172a", marginTop: 1 }}>{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════
function EmptyState() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "calc(100vh - 100px)",
    }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, margin: "0 auto 20px",
          boxShadow: "0 12px 28px -8px rgba(99,102,241,0.4)",
        }}>⚙️</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>Configura tu pieza</h3>
        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
          Introduce los datos en el panel lateral para que el sistema analice y recomiende la máquina de inyección óptima para tu pieza.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPARISON PANEL
// ═══════════════════════════════════════════════════════════════
function ComparisonPanel({ compared, toggleCompare }) {
  if (!compared.length) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#059669", letterSpacing: 0.6, textTransform: "uppercase" }}>Comparativa</span>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>({compared.length}/2)</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${compared.length}, 1fr)`, gap: 12 }}>
        {compared.map(item => {
          const r = item.res;
          const is2K = r.mode === "2K";
          return (
            <div key={item.maquina.maquina} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "pre-line" }}>{item.maquina.maquina}</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{item.maquina.marca} · {item.maquina.tonelaje}t</div>
                </div>
                <button onClick={() => toggleCompare(item.maquina.maquina)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 16, cursor: "pointer", padding: "0 4px" }}>×</button>
              </div>
              <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Cp label="Utilización" value={is2K ? val2K(r.resPrincipal?.porcentajeUtilizacion, r.resSecundario?.porcentajeUtilizacion, fmtPct) : fmtPct(r.porcentajeUtilizacion)} status={is2K ? worstStatus(window.statusUtilizacion(r.resPrincipal?.porcentajeUtilizacion), window.statusUtilizacion(r.resSecundario?.porcentajeUtilizacion)) : window.statusUtilizacion(r.porcentajeUtilizacion)} />
                <Cp label="Permanencia" value={is2K ? val2K(r.resPrincipal?.tiempoPermanencia, r.resSecundario?.tiempoPermanencia, v => `${fmt(v, 1)}m`) : `${fmt(r.tiempoPermanencia, 1)}m`} status={is2K ? worstStatus(window.statusPermanencia(r.resPrincipal?.tiempoPermanencia, r.resPrincipal?.tiempoMaxMaterial), window.statusPermanencia(r.resSecundario?.tiempoPermanencia, r.resSecundario?.tiempoMaxMaterial)) : window.statusPermanencia(r.tiempoPermanencia, r.tiempoMaxMaterial)} />
                <Cp label="L/D" value={is2K ? val2K(r.resPrincipal?.ratioLD, r.resSecundario?.ratioLD, v => fmt(v)) : fmt(r.ratioLD)} status={is2K ? worstStatus(window.statusRatioLD(r.resPrincipal?.ratioLD), window.statusRatioLD(r.resSecundario?.ratioLD)) : window.statusRatioLD(r.ratioLD)} />
                <Cp label="F.cierre" value={fmtPct(r.relacionTonelaje)} status={window.statusTonelaje(r.relacionTonelaje)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Cp({ label, value, status }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 600, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: status ? C[status] : "#0f172a", display: "flex", alignItems: "center", gap: 4 }}>
        {status && <BadgeDot status={status} size={5} />}
        {value}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MACHINE LIST PANEL
// ═══════════════════════════════════════════════════════════════
function MachineListPanel({ sorted, compareIds, toggleCompare, activeTab, setActiveTab, expandedId, setExpandedId }) {
  const CATS = [
    { key: "all", label: `Todas (${sorted.length})` },
    { key: "good", label: `Óptimas (${sorted.filter(x => x.score > 50).length})` },
  ];
  const display = activeTab === "all" ? sorted : sorted.filter(x => x.score > 50);

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {CATS.map(c => {
            const act = activeTab === c.key;
            return <button key={c.key} onClick={() => setActiveTab(c.key)} style={{
              padding: "5px 12px", borderRadius: 8, border: "none",
              background: act ? "#0f172a" : "#eef2f6",
              color: act ? "#fff" : "#475569",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              transition: "all .15s ease",
            }}>{c.label}</button>;
          })}
        </div>
        <div style={{ fontSize: 10, color: "#94a3b8" }}>Click para expandir detalles</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {display.map((item, idx) => {
          const r = item.res, m = item.maquina;
          const isCompared = compareIds.includes(m.maquina);
          const is2K = r.mode === "2K";
          const isExpanded = expandedId === m.maquina;
          const utilSt = is2K ? worstStatus(window.statusUtilizacion(r.resPrincipal?.porcentajeUtilizacion), window.statusUtilizacion(r.resSecundario?.porcentajeUtilizacion)) : window.statusUtilizacion(r.porcentajeUtilizacion);
          const permSt = is2K ? worstStatus(window.statusPermanencia(r.resPrincipal?.tiempoPermanencia, r.resPrincipal?.tiempoMaxMaterial), window.statusPermanencia(r.resSecundario?.tiempoPermanencia, r.resSecundario?.tiempoMaxMaterial)) : window.statusPermanencia(r.tiempoPermanencia, r.tiempoMaxMaterial);
          const ldSt = is2K ? worstStatus(window.statusRatioLD(r.resPrincipal?.ratioLD), window.statusRatioLD(r.resSecundario?.ratioLD)) : window.statusRatioLD(r.ratioLD);
          const tonSt = window.statusTonelaje(r.relacionTonelaje);
          const utilVal = is2K ? val2K(r.resPrincipal?.porcentajeUtilizacion, r.resSecundario?.porcentajeUtilizacion, fmtPct) : fmtPct(r.porcentajeUtilizacion);
          const permVal = is2K ? val2K(r.resPrincipal?.tiempoPermanencia, r.resSecundario?.tiempoPermanencia, v => `${fmt(v, 1)}m`) : `${fmt(r.tiempoPermanencia, 1)}m`;
          const ldVal = is2K ? val2K(r.resPrincipal?.ratioLD, r.resSecundario?.ratioLD, v => fmt(v)) : fmt(r.ratioLD);

          return (
            <div key={m.maquina} style={{
              background: isCompared ? "#ecfdf5" : "#fff",
              border: `1px solid ${isCompared ? "#a7f3d0" : "#eef2f6"}`,
              borderRadius: 10, overflow: "hidden",
              transition: "all .15s ease",
            }}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : m.maquina)}
                style={{
                  display: "grid", gridTemplateColumns: "40px 1fr 80px 90px 70px 80px 80px",
                  alignItems: "center", gap: 8, padding: "9px 14px", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <ScoreRing score={item.score} size={34} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "pre-line", lineHeight: 1.2 }}>{m.maquina}</div>
                  <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>{m.marca} · {m.tonelaje}t · Ø{m.diametroHusillo}{is2K ? `+Ø${m.diametroHusilloSecundario}` : ""}mm</div>
                </div>
                <MiniBadge status={utilSt}>{utilVal}</MiniBadge>
                <MiniBadge status={permSt}>{permVal}</MiniBadge>
                <MiniBadge status={ldSt}>{ldVal}</MiniBadge>
                <MiniBadge status={tonSt}>{fmtPct(r.relacionTonelaje)}</MiniBadge>
                <button onClick={e => { e.stopPropagation(); toggleCompare(m.maquina); }} style={{
                  padding: "4px 10px", borderRadius: 6, border: "none",
                  fontSize: 10, fontWeight: 700, cursor: "pointer",
                  background: isCompared ? "#10b981" : "#f1f5f9",
                  color: isCompared ? "#fff" : "#475569",
                  transition: "all .15s ease",
                }}>{isCompared ? "QUITAR" : "COMPARAR"}</button>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{
                  padding: "10px 14px 12px 54px",
                  borderTop: "1px solid #eef2f6",
                  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
                }}>
                  <MiniInfo label="Dosis máx" value={is2K ? val2K(r.resPrincipal?.dosisMaxCm3, r.resSecundario?.dosisMaxCm3, v => `${fmt(v)} cm³`) : `${fmt(r.dosisMaxCm3)} cm³`} />
                  <MiniInfo label="Gramos máx" value={is2K ? val2K(r.resPrincipal?.gramosDosisMax, r.resSecundario?.gramosDosisMax, v => `${fmt(v)} g`) : `${fmt(r.gramosDosisMax)} g`} />
                  <MiniInfo label="Carrera real" value={is2K ? val2K(r.resPrincipal?.carreraReal, r.resSecundario?.carreraReal, v => `${fmt(v)} mm`) : `${fmt(r.carreraReal)} mm`} />
                  <MiniInfo label="Gramos real" value={is2K ? val2K(r.resPrincipal?.gramosDosisReal, r.resSecundario?.gramosDosisReal, v => `${fmt(v)} g`) : `${fmt(r.gramosDosisReal)} g`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HERO 2K TABLE
// ═══════════════════════════════════════════════════════════════
function Hero2KTable({ top, s }) {
  const r = top.res, m = top.maquina;
  const P = r.resPrincipal, S_ = r.resSecundario;
  const stTon = window.statusTonelaje(r.relacionTonelaje);
  const matP = r.componentePrincipal === 1 ? s.materialNombre : s.materialNombre2;
  const matS = r.componenteSecundario === 1 ? s.materialNombre : s.materialNombre2;
  const volP = r.componentePrincipal === 1 ? s.c1.volumenN : s.c2.volumenN;
  const volS = r.componenteSecundario === 1 ? s.c1.volumenN : s.c2.volumenN;

  const rows = [
    { l: "Material", p: matP, s: matS },
    { l: "Volumen", p: volP > 0 ? `${fmt(volP)} cm³` : "—", s: volS > 0 ? `${fmt(volS)} cm³` : "—" },
    { l: "Utilización", p: fmtPct(P?.porcentajeUtilizacion), ps: window.statusUtilizacion(P?.porcentajeUtilizacion), s: fmtPct(S_?.porcentajeUtilizacion), ss: window.statusUtilizacion(S_?.porcentajeUtilizacion) },
    { l: "Permanencia", p: P?.tiempoPermanencia != null ? `${fmt(P.tiempoPermanencia, 1)} min` : "—", ps: window.statusPermanencia(P?.tiempoPermanencia, P?.tiempoMaxMaterial), s: S_?.tiempoPermanencia != null ? `${fmt(S_.tiempoPermanencia, 1)} min` : "—", ss: window.statusPermanencia(S_?.tiempoPermanencia, S_?.tiempoMaxMaterial), psub: P?.tiempoMaxMaterial != null ? `máx ${P.tiempoMaxMaterial}m` : null, ssub: S_?.tiempoMaxMaterial != null ? `máx ${S_.tiempoMaxMaterial}m` : null },
    { l: "L/D", p: fmt(P?.ratioLD), ps: window.statusRatioLD(P?.ratioLD), s: fmt(S_?.ratioLD), ss: window.statusRatioLD(S_?.ratioLD) },
    { l: "Dosis real", p: P?.cm3DosisReal != null ? `${fmt(P.cm3DosisReal)} cm³` : "—", s: S_?.cm3DosisReal != null ? `${fmt(S_.cm3DosisReal)} cm³` : "—" },
  ];

  return (
    <div>
      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr", gap: 14, paddingBottom: 8, borderBottom: "2px solid #d1fae5", marginBottom: 4 }}>
        <div />
        <div><div style={{ fontSize: 10, fontWeight: 700, color: "#059669", letterSpacing: 0.5 }}>Husillo principal</div><div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1, fontFamily: "JetBrains Mono, monospace" }}>Ø{m.diametroHusillo} mm · {m.dosisMaxHusillo} mm</div></div>
        <div><div style={{ fontSize: 10, fontWeight: 700, color: "#059669", letterSpacing: 0.5 }}>Husillo secundario</div><div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1, fontFamily: "JetBrains Mono, monospace" }}>Ø{m.diametroHusilloSecundario} mm · {m.dosisMaxHusilloSecundario} mm</div></div>
      </div>

      {rows.map((row, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr", gap: 14, padding: "7px 0", borderBottom: i < rows.length - 1 ? "1px solid #f1f5f9" : "none", alignItems: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>{row.l}</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: row.ps ? (C[row.ps] || "#0f172a") : "#0f172a", display: "flex", alignItems: "center", gap: 5 }}>
            {row.ps && <BadgeDot status={row.ps} size={6} />}{row.p}{row.psub && <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 400 }}>{row.psub}</span>}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: row.ss ? (C[row.ss] || "#0f172a") : "#0f172a", display: "flex", alignItems: "center", gap: 5 }}>
            {row.ss && <BadgeDot status={row.ss} size={6} />}{row.s}{row.ssub && <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 400 }}>{row.ssub}</span>}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={{ marginTop: 10, padding: "10px 14px", background: "#fff", borderRadius: 8, border: "1px solid #d1fae5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: 10, fontWeight: 600, color: "#475569" }}>Fuerza de cierre combinada</div><div style={{ fontSize: 11, color: "#0f172a", marginTop: 1 }}>Necesaria <b>{r.fuerzaCierreNecesaria != null ? r.fuerzaCierreNecesaria.toFixed(0) : "—"}t</b> · disponible <b>{m.tonelaje}t</b></div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BadgeDot status={stTon} size={10} />
          <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: C[stTon] || "#0f172a" }}>{fmtPct(r.relacionTonelaje)}</span>
        </div>
      </div>
    </div>
  );
}

window.MatchmakerView = MatchmakerView;