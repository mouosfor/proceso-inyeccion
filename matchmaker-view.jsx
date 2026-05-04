// V3 view: tema claro match-maker. Recibe state como prop.

const { fmt, fmtPct, STATUS_COLOR, StatusDot, StatusBar } = window;

// Combina dos valores en formato "P / S" para mostrar en 2K
const val2K = (p, sec, formatter) => {
  if (p == null && sec == null) return "—";
  const pf = p != null ? formatter(p) : "—";
  const sf = sec != null ? formatter(sec) : "—";
  return `${pf} / ${sf}`;
};
// Devuelve el estado más desfavorable entre los pasados
const worstStatus = (...sts) => {
  const order = { high: 4, warn: 3, low: 2, ok: 1, neutral: 0 };
  return sts.reduce((w, x) => (order[x] || 0) > (order[w] || 0) ? x : w, "neutral");
};

function MatchmakerView({ s }) {
  const [compareIds, setCompareIds] = React.useState([]);
  const kFilter = s.tipoInyeccion;
  const setKFilter = s.setTipoInyeccion;
  const filtered = kFilter === "2K" ? s.resultados.filter(r => r.maquina.dosKa === "SI") : s.resultados;
  const sorted = [...filtered].sort((a, b) => b.score - a.score);
  const top = sorted[0];

  const toggleCompare = (key) => {
    setCompareIds(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key].slice(-2));
  };

  const inputStyle = {
    padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 10,
    fontSize: 13, background: "#fff", color: "#0f172a", outline: "none",
    fontFamily: "Inter, sans-serif", boxSizing: "border-box", width: "100%",
    transition: "border-color .2s ease, box-shadow .2s ease",
  };
  const inputFocusStyle = "border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12);";

  const Field = ({ label, children, suffix, icon }) => (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: 0.4, marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
        {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
        {label}
        {suffix && <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 10, marginLeft: 2 }}>· {suffix}</span>}
      </div>
      {children}
    </div>
  );

  const SectionLabel = ({ icon, label, step }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 0 2px",
      borderTop: "1px solid #eef2f6",
      marginTop: 6, paddingTop: 14,
    }}>
      {step != null && (
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 18, height: 18, borderRadius: 999,
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          color: "#fff", fontSize: 9, fontWeight: 800,
          flexShrink: 0,
        }}>{step}</span>
      )}
      <span style={{ fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: 0.5 }}>{icon} {label}</span>
    </div>
  );

  const OptionChip = ({ active, onClick, children, color = "#6366f1" }) => (
    <button onClick={onClick} style={{
      padding: "10px 8px", flex: 1,
      background: active ? "#fff" : "transparent",
      color: active ? color : "#64748b",
      border: active ? `1.5px solid ${color}30` : "1.5px solid transparent",
      borderRadius: 10,
      fontSize: 13, fontWeight: 700, letterSpacing: 0.3,
      cursor: "pointer",
      boxShadow: active ? "0 4px 12px -4px rgba(0,0,0,0.08), 0 1px 3px -1px rgba(0,0,0,0.04)" : "none",
      transition: "all .2s ease",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    }}>{children}</button>
  );

  const labeledSelectStyle = {
    ...inputStyle,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 32,
    fontWeight: 600,
    color: "#0f172a",
  };

  const LOCATION_ICONS = { BARCELONA: "🏛", IGORRE: "🏘", MEXICO: "🌵", ALICANTE: "☀️" };

  const compared = compareIds.map(id => sorted.find(x => x.maquina.maquina === id)).filter(Boolean);

  return (
    <div style={{ background: "transparent", color: "#0f172a", display: "grid", gridTemplateColumns: "368px 1fr", minHeight: "calc(100vh - 56px)" }}>
      <aside style={{
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRight: "1px solid #eef2f6",
        padding: "20px 20px 24px",
        overflowY: "auto",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* ── STEP 1: Location ── */}
          <SectionLabel icon="📍" label="Localización" step={1} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{
              background: "#f8fafc", borderRadius: 12, padding: "10px 12px",
              border: "1px solid #eef2f6",
            }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 }}>Planta</div>
              <select style={labeledSelectStyle} value={s.ubicacion} onChange={e => s.setUbicacion(e.target.value)}>
                {window.UBICACIONES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div style={{
              background: "#f8fafc", borderRadius: 12, padding: "10px 12px",
              border: "1px solid #eef2f6",
            }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 }}>Sala</div>
              <select style={labeledSelectStyle} value={s.celula} onChange={e => s.setCelula(e.target.value)}>
                {window.CELULAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* ── STEP 2: Cycle & Type ── */}
          <SectionLabel icon="⚙️" label="Configuración de inyección" step={2} />
          <div style={{
            background: "#f8fafc", borderRadius: 12, padding: "12px 12px 14px",
            border: "1px solid #eef2f6",
          }}>
            <Field label="Tipo de inyección">
              <div style={{ display: "flex", gap: 6, padding: 3, background: "#f1f5f9", borderRadius: 10 }}>
                <OptionChip active={kFilter === "1K"} onClick={() => setKFilter("1K")} color="#6366f1">
                  <span style={{ fontSize: 16, lineHeight: 1 }}>🧩</span> 1K · Un material
                </OptionChip>
                <OptionChip active={kFilter === "2K"} onClick={() => setKFilter("2K")} color="#059669">
                  <span style={{ fontSize: 16, lineHeight: 1 }}>🧩🧩</span> 2K · Bi-material
                </OptionChip>
              </div>
            </Field>
            <div style={{ marginTop: 10 }}>
              <Field label="Tiempo de ciclo" suffix="segundos">
                <div style={{ position: "relative" }}>
                  <input style={inputStyle} type="number" value={s.tCiclo} onChange={e => s.setTCiclo(e.target.value)} placeholder="0" />
                </div>
              </Field>
            </div>
          </div>

          {/* ── STEP 3: Component data ── */}
          <SectionLabel icon="📐" label="Datos de la pieza" step={3} />

          <ComponenteBlock
            titulo={kFilter === "2K" ? "Componente 1" : "Componente"}
            accent="#4f46e5"
            inputStyle={inputStyle}
            Field={Field}
            material={s.materialNombre} setMaterial={s.setMaterialNombre}
            volumen={s.volumen} setVolumen={s.setVolumen}
            pesoN={s.c1.pesoInyectadaN}
            ancho={s.anchoPieza} setAncho={s.setAnchoPieza}
            largo={s.largoPieza} setLargo={s.setLargoPieza}
            cavidades={s.nCavidades} setCavidades={s.setNCavidades}
            densidad={s.c1.densidad} tiempoMax={s.c1.tiempoMaxMaterial}
          />

          {kFilter === "2K" && (
            <ComponenteBlock
              titulo="Componente 2"
              accent="#059669"
              inputStyle={inputStyle}
              Field={Field}
              material={s.materialNombre2} setMaterial={s.setMaterialNombre2}
              volumen={s.volumen2} setVolumen={s.setVolumen2}
              pesoN={s.c2.pesoInyectadaN}
              ancho={s.anchoPieza2} setAncho={s.setAnchoPieza2}
              largo={s.largoPieza2} setLargo={s.setLargoPieza2}
              cavidades={s.nCavidades}
              cavidadesReadOnly
              densidad={s.c2.densidad} tiempoMax={s.c2.tiempoMaxMaterial}
            />
          )}

          {/* ── Summary card ── */}
          <div style={{
            marginTop: 8,
            background: "linear-gradient(135deg, #eef2ff 0%, #fff 100%)",
            borderRadius: 14, padding: "14px 16px",
            border: "1px solid #e0e7ff",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
          }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#6366f1", letterSpacing: 0.8, textTransform: "uppercase" }}>Área proyectada</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "#0f172a", marginTop: 2 }}>
                {s.areaPieza != null ? s.areaPieza.toFixed(1) : "—"} <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>cm²</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#6366f1", letterSpacing: 0.8, textTransform: "uppercase" }}>Fuerza de cierre</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "#0f172a", marginTop: 2 }}>
                {s.fuerzaCierre != null ? s.fuerzaCierre.toFixed(0) : "—"} <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>ton</span>
              </div>
            </div>
          </div>

          {/* ── Export button ── */}
          <button onClick={() => window.print()} style={{
            marginTop: 6, padding: "12px 14px",
            background: "linear-gradient(135deg, #059669, #10b981)",
            color: "#fff", border: "none", borderRadius: 12,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            letterSpacing: 0.8,
            boxShadow: "0 6px 16px -6px rgba(5,150,105,0.45)",
            transition: "transform .2s ease, box-shadow .2s ease",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
          onMouseEnter={e => { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 10px 24px -8px rgba(5,150,105,0.55)"; }}
          onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = "0 6px 16px -6px rgba(5,150,105,0.45)"; }}
          >
            EXPORTAR PDF
          </button>
        </div>
      </aside>

      <main style={{ overflowY: "auto", padding: "24px 28px" }}>
        {top && top.res.valid && s.pesoInyectadaN > 0 ? (
          <div style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 60%)", border: "1px solid #a7f3d0", borderRadius: 14, padding: 22, marginBottom: 18, position: "relative", overflow: "hidden", boxShadow: "0 8px 30px -12px rgba(5,150,105,0.25)" }}>
            <div style={{ position: "absolute", top: 12, right: 14, fontSize: 10, color: "#059669", fontWeight: 700, letterSpacing: 1.4 }}>★ MÁQUINA RECOMENDADA</div>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 0.6 }}>{top.maquina.ubicacion} · {top.maquina.marca}</div>
            <h2 style={{ margin: "6px 0 14px 0", fontSize: 22, fontWeight: 700, whiteSpace: "pre-line", lineHeight: 1.2, color: "#0f172a" }}>{top.maquina.maquina}</h2>
            {top.res.mode === "2K" ? (
              <Hero2KTable top={top} s={s} />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
                <HeroStat3 label="% utilización" value={fmtPct(top.res.porcentajeUtilizacion)} accent />
                <HeroStat3 label="Permanencia" value={`${fmt(top.res.tiempoPermanencia, 1)} min`} sub={`máx ${top.res.tiempoMaxMaterial}m`} />
                <HeroStat3 label="Relación L/D" value={fmt(top.res.ratioLD)} />
                <HeroStat3 label="Dosis real" value={`${fmt(top.res.cm3DosisReal)} cm³`} />
                <HeroStat3
                  label="F.cierre / Tonelaje"
                  value={fmtPct(top.res.relacionTonelaje)}
                  sub={`${top.res.fuerzaCierreNecesaria != null ? top.res.fuerzaCierreNecesaria.toFixed(0) : "—"}t / ${top.maquina.tonelaje}t`}
                  status={window.statusTonelaje(top.res.relacionTonelaje)}
                />
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 14, padding: 32, marginBottom: 18, textAlign: "center", color: "#64748b", fontSize: 13 }}>Introduce el volumen y tiempo de ciclo, o sube un plano para ver la máquina recomendada</div>
        )}

        {compared.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>Comparativa ({compared.length}/2)</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${compared.length}, 1fr)`, gap: 12 }}>
              {compared.map(item => {
                const r = item.res;
                const is2K = r.mode === "2K";
                const utilVal = is2K
                  ? val2K(r.resPrincipal.porcentajeUtilizacion, r.resSecundario.porcentajeUtilizacion, fmtPct)
                  : fmtPct(r.porcentajeUtilizacion);
                const utilSt = is2K
                  ? worstStatus(window.statusUtilizacion(r.resPrincipal.porcentajeUtilizacion), window.statusUtilizacion(r.resSecundario.porcentajeUtilizacion))
                  : window.statusUtilizacion(r.porcentajeUtilizacion);
                const permVal = is2K
                  ? val2K(r.resPrincipal.tiempoPermanencia, r.resSecundario.tiempoPermanencia, v => `${fmt(v, 1)}m`)
                  : `${fmt(r.tiempoPermanencia, 1)}m`;
                const permSt = is2K
                  ? worstStatus(
                      window.statusPermanencia(r.resPrincipal.tiempoPermanencia, r.resPrincipal.tiempoMaxMaterial),
                      window.statusPermanencia(r.resSecundario.tiempoPermanencia, r.resSecundario.tiempoMaxMaterial),
                    )
                  : window.statusPermanencia(r.tiempoPermanencia, r.tiempoMaxMaterial);
                const ldVal = is2K
                  ? val2K(r.resPrincipal.ratioLD, r.resSecundario.ratioLD, v => fmt(v))
                  : fmt(r.ratioLD);
                const ldSt = is2K
                  ? worstStatus(window.statusRatioLD(r.resPrincipal.ratioLD), window.statusRatioLD(r.resSecundario.ratioLD))
                  : window.statusRatioLD(r.ratioLD);
                return (
                  <div key={item.maquina.maquina} style={{ background: "#fff", border: "1px solid #e5e8ec", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "pre-line" }}>{item.maquina.maquina}</div>
                      <button onClick={() => toggleCompare(item.maquina.maquina)} style={{ background: "none", border: "1px solid #e5e8ec", color: "#64748b", borderRadius: 4, padding: "2px 6px", fontSize: 10, cursor: "pointer" }}>×</button>
                    </div>
                    <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <DarkStat3 label={is2K ? "% util P/S" : "% utiliz."} value={utilVal} status={utilSt} />
                      <DarkStat3 label={is2K ? "perm P/S" : "permanencia"} value={permVal} status={permSt} />
                      <DarkStat3 label={is2K ? "L/D P/S" : "L/D"} value={ldVal} status={ldSt} />
                      <DarkStat3 label="F.cierre" value={fmtPct(r.relacionTonelaje)} status={window.statusTonelaje(r.relacionTonelaje)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.4, textTransform: "uppercase" }}>Todas las máquinas · ordenadas por idoneidad</div>
          {kFilter === "2K" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 10, color: "#475569" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>P</span> = husillo principal
              </span>
              <span style={{ color: "#cbd5e1" }}>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>S</span> = husillo secundario
              </span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sorted.map((item, idx) => {
            const r = item.res; const m = item.maquina;
            const isCompared = compareIds.includes(m.maquina);
            const is2K = r.mode === "2K";
            return (
              <div key={idx} style={{ background: isCompared ? "#ecfdf5" : "#fff", border: `1px solid ${isCompared ? "#a7f3d0" : "#e5e8ec"}`, borderRadius: 8, padding: "12px 14px", display: "grid", gridTemplateColumns: is2K ? "32px 1fr 90px 110px 70px 90px 80px" : "32px 1fr 80px 100px 80px 90px 80px", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: idx === 0 ? "#059669" : "#94a3b8", fontFamily: "JetBrains Mono, monospace" }}>#{idx + 1}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "pre-line", lineHeight: 1.3, color: "#0f172a" }}>{m.maquina}</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                    {m.marca} · {m.tonelaje}tn
                    {is2K ? (
                      <>
                        {" · "}
                        <span style={{ color: "#475569", fontWeight: 600 }}>P</span>{" "}Ø{m.diametroHusillo}
                        {" + "}
                        <span style={{ color: "#475569", fontWeight: 600 }}>S</span>{" "}Ø{m.diametroHusilloSecundario}
                      </>
                    ) : ` · Ø${m.diametroHusillo}mm`}
                  </div>
                </div>
                {is2K ? (
                  <>
                    <DarkStat2K label="utilización"
                      valP={fmtPct(r.resPrincipal.porcentajeUtilizacion)}
                      stP={window.statusUtilizacion(r.resPrincipal.porcentajeUtilizacion)}
                      valS={fmtPct(r.resSecundario.porcentajeUtilizacion)}
                      stS={window.statusUtilizacion(r.resSecundario.porcentajeUtilizacion)}
                    />
                    <DarkStat2K label="permanencia"
                      valP={`${fmt(r.resPrincipal.tiempoPermanencia, 1)}m`}
                      stP={window.statusPermanencia(r.resPrincipal.tiempoPermanencia, r.resPrincipal.tiempoMaxMaterial)}
                      valS={`${fmt(r.resSecundario.tiempoPermanencia, 1)}m`}
                      stS={window.statusPermanencia(r.resSecundario.tiempoPermanencia, r.resSecundario.tiempoMaxMaterial)}
                    />
                    <DarkStat2K label="L/D"
                      valP={fmt(r.resPrincipal.ratioLD)}
                      stP={window.statusRatioLD(r.resPrincipal.ratioLD)}
                      valS={fmt(r.resSecundario.ratioLD)}
                      stS={window.statusRatioLD(r.resSecundario.ratioLD)}
                    />
                  </>
                ) : (
                  <>
                    <DarkStat3 label="utilización" value={fmtPct(r.porcentajeUtilizacion)} status={window.statusUtilizacion(r.porcentajeUtilizacion)} compact />
                    <DarkStat3 label="permanencia" value={`${fmt(r.tiempoPermanencia, 1)}m`} status={window.statusPermanencia(r.tiempoPermanencia, r.tiempoMaxMaterial)} compact />
                    <DarkStat3 label="L/D" value={fmt(r.ratioLD)} status={window.statusRatioLD(r.ratioLD)} compact />
                  </>
                )}
                <DarkStat3 label="F.cierre" value={fmtPct(r.relacionTonelaje)} status={window.statusTonelaje(r.relacionTonelaje)} compact />
                <button onClick={() => toggleCompare(m.maquina)} style={{ background: isCompared ? "#10b981" : "transparent", border: `1px solid ${isCompared ? "#10b981" : "#cbd5e1"}`, color: isCompared ? "#fff" : "#64748b", borderRadius: 4, padding: "5px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: 0.6 }}>{isCompared ? "QUITAR" : "COMPARAR"}</button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function Hero2KTable({ top, s }) {
  const r = top.res;
  const m = top.maquina;
  const P = r.resPrincipal, S_ = r.resSecundario;
  const stTon = window.statusTonelaje(r.relacionTonelaje);
  const tonColor = STATUS_COLOR[stTon]?.dot || "#0f172a";

  // Asignación automática: el componente con mayor volumen va al husillo principal
  const matPrincipal = r.componentePrincipal === 1 ? s.materialNombre : s.materialNombre2;
  const matSecundario = r.componenteSecundario === 1 ? s.materialNombre : s.materialNombre2;
  const volPrincipal = r.componentePrincipal === 1 ? s.c1.volumenN : s.c2.volumenN;
  const volSecundario = r.componenteSecundario === 1 ? s.c1.volumenN : s.c2.volumenN;

  const rows = [
    { label: "Material", pVal: matPrincipal, sVal: matSecundario },
    { label: "Volumen inyectado", pVal: volPrincipal > 0 ? `${fmt(volPrincipal)} cm³` : "—", sVal: volSecundario > 0 ? `${fmt(volSecundario)} cm³` : "—" },
    {
      label: "Utilización del husillo",
      pVal: fmtPct(P.porcentajeUtilizacion),
      pStatus: window.statusUtilizacion(P.porcentajeUtilizacion),
      sVal: fmtPct(S_.porcentajeUtilizacion),
      sStatus: window.statusUtilizacion(S_.porcentajeUtilizacion),
    },
    {
      label: "Tiempo permanencia",
      pVal: P.tiempoPermanencia != null ? `${fmt(P.tiempoPermanencia, 1)} min` : "—",
      pSub: P.tiempoMaxMaterial != null ? `máx ${P.tiempoMaxMaterial} min` : null,
      pStatus: window.statusPermanencia(P.tiempoPermanencia, P.tiempoMaxMaterial),
      sVal: S_.tiempoPermanencia != null ? `${fmt(S_.tiempoPermanencia, 1)} min` : "—",
      sSub: S_.tiempoMaxMaterial != null ? `máx ${S_.tiempoMaxMaterial} min` : null,
      sStatus: window.statusPermanencia(S_.tiempoPermanencia, S_.tiempoMaxMaterial),
    },
    {
      label: "Relación L/D",
      pVal: fmt(P.ratioLD),
      pStatus: window.statusRatioLD(P.ratioLD),
      sVal: fmt(S_.ratioLD),
      sStatus: window.statusRatioLD(S_.ratioLD),
    },
    {
      label: "Dosis real",
      pVal: P.cm3DosisReal != null ? `${fmt(P.cm3DosisReal)} cm³` : "—",
      sVal: S_.cm3DosisReal != null ? `${fmt(S_.cm3DosisReal)} cm³` : "—",
    },
  ];

  return (
    <div>
      {/* Cabecera de columnas */}
      <div style={{
        display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: 24,
        paddingBottom: 10, borderBottom: "2px solid #d1fae5", marginBottom: 4,
      }}>
        <div />
        <Hero2KColHeader
          titulo="Husillo principal"
          componente={r.componentePrincipal}
          diametro={m.diametroHusillo}
          carrera={m.dosisMaxHusillo}
        />
        <Hero2KColHeader
          titulo="Husillo secundario"
          componente={r.componenteSecundario}
          diametro={m.diametroHusilloSecundario}
          carrera={m.dosisMaxHusilloSecundario}
        />
      </div>

      {/* Filas de métricas */}
      {rows.map((row, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: 24,
          padding: "12px 0",
          borderBottom: i < rows.length - 1 ? "1px solid #f1f5f9" : "none",
          alignItems: "center",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.4, textTransform: "uppercase" }}>{row.label}</div>
          <Hero2KCell value={row.pVal} status={row.pStatus} sub={row.pSub} />
          <Hero2KCell value={row.sVal} status={row.sStatus} sub={row.sSub} />
        </div>
      ))}

      {/* Footer: F.cierre / Tonelaje (combinada, atraviesa toda la fila) */}
      <div style={{
        marginTop: 14, padding: "14px 16px",
        background: "rgba(255,255,255,0.6)", border: "1px solid #d1fae5", borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1.2, textTransform: "uppercase" }}>
            Fuerza de cierre · combinada
          </div>
          <div style={{ fontSize: 14, color: "#0f172a", marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>
            Necesaria <b>{r.fuerzaCierreNecesaria != null ? r.fuerzaCierreNecesaria.toFixed(0) : "—"} t</b> · disponible <b>{m.tonelaje} t</b>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StatusDot status={stTon} size={12} />
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: tonColor, lineHeight: 1 }}>
            {fmtPct(r.relacionTonelaje)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat compacto 2K: apila P y S verticalmente con su propio dot semáforo
function DarkStat2K({ label, valP, stP, valS, stS }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <DarkStat2KRow letter="P" value={valP} status={stP} />
      <DarkStat2KRow letter="S" value={valS} status={stS} />
    </div>
  );
}
function DarkStat2KRow({ letter, value, status }) {
  const c = status && status !== "neutral" ? STATUS_COLOR[status] : null;
  const color = c ? c.dot : "#0f172a";
  return (
    <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color, display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: 9, color: "#94a3b8", minWidth: 8 }}>{letter}</span>
      {c && <StatusDot status={status} size={5} />}
      {value}
    </div>
  );
}

function Hero2KColHeader({ titulo, componente, diametro, carrera }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#059669", letterSpacing: 1.4, textTransform: "uppercase" }}>{titulo}</div>
        {componente != null && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 8px", borderRadius: 999,
            background: componente === 1 ? "rgba(99,102,241,0.12)" : "rgba(5,150,105,0.12)",
            color: componente === 1 ? "#4f46e5" : "#059669",
            fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
          }}>
            ← Componente {componente}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontFamily: "JetBrains Mono, monospace" }}>
        Ø{diametro} mm · carrera máx {carrera} mm
      </div>
    </div>
  );
}

function Hero2KCell({ value, status, sub }) {
  const c = status && status !== "neutral" ? STATUS_COLOR[status] : null;
  const color = c ? c.dot : "#0f172a";
  return (
    <div>
      <div style={{ fontSize: 19, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color, display: "flex", alignItems: "center", gap: 8, lineHeight: 1.1 }}>
        {c && <StatusDot status={status} size={9} />}
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function HeroStat3({ label, value, sub, accent, status }) {
  const c = status && status !== "neutral" ? STATUS_COLOR[status] : null;
  const color = c ? c.dot : (accent ? "#059669" : "#0f172a");
  return (
    <div>
      <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
        {c && <StatusDot status={status} size={9} />}
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function DarkStat3({ label, value, status, compact }) {
  const c = STATUS_COLOR[status];
  return (
    <div>
      {!compact && <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>{label}</div>}
      <div style={{ fontSize: compact ? 13 : 15, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: status === "neutral" ? "#0f172a" : c.dot, display: "flex", alignItems: "center", gap: 5 }}>
        {status !== "neutral" && <StatusDot status={status} size={6} />}
        {value}
      </div>
    </div>
  );
}

function ComponenteBlock({ titulo, accent, inputStyle, Field, material, setMaterial, volumen, setVolumen, pesoN, ancho, setAncho, largo, setLargo, cavidades, setCavidades, cavidadesReadOnly, densidad, tiempoMax }) {
  const labeledSelectStyle = {
    ...inputStyle,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 32,
    fontWeight: 600,
    color: "#0f172a",
  };
  return (
    <div style={{
      background: "#f8fafc",
      borderRadius: 14,
      padding: "14px 14px 16px",
      display: "flex", flexDirection: "column", gap: 12,
      border: `1px solid ${accent}28`,
    }}>
      {/* Header with accent stripe */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 2,
      }}>
        <div style={{
          width: 3, height: 20,
          background: accent,
          borderRadius: 999,
          flexShrink: 0,
        }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: 0.5, textTransform: "uppercase" }}>
          {titulo}
        </div>
      </div>

      {/* Material selector */}
      <div style={{
        background: "#fff", borderRadius: 10, padding: "10px 12px",
        border: "1px solid #eef2f6",
      }}>
        <Field label="Material">
          <select style={labeledSelectStyle} value={material} onChange={e => setMaterial(e.target.value)}>
            {window.MATERIALES.map(m => <option key={m.material}>{m.material}</option>)}
          </select>
        </Field>
      </div>

      {/* Density & time badge */}
      <div style={{
        display: "flex", gap: 6,
      }}>
        <div style={{
          flex: 1, padding: "6px 10px", background: "#fff", borderRadius: 8,
          border: "1px solid #eef2f6",
          fontSize: 11, fontFamily: "JetBrains Mono, monospace",
          display: "flex", alignItems: "center", gap: 4,
        }}>

          <span style={{ color: "#64748b" }}>ρ</span>
          <b style={{ color: "#0f172a", marginLeft: "auto" }}>{densidad ? densidad.toFixed(2) : "—"}</b>
        </div>
        <div style={{
          flex: 1, padding: "6px 10px", background: "#fff", borderRadius: 8,
          border: "1px solid #eef2f6",
          fontSize: 11, fontFamily: "JetBrains Mono, monospace",
          display: "flex", alignItems: "center", gap: 4,
        }}>

          <span style={{ color: "#64748b" }}>t.máx</span>
          <b style={{ color: "#0f172a", marginLeft: "auto" }}>{tiempoMax ?? "—"}m</b>
        </div>
      </div>

      {/* Volume */}
      <Field label="Volumen material" suffix="cm³">
        <div style={{ position: "relative" }}>
          <input style={inputStyle} type="number" value={volumen} onChange={e => setVolumen(e.target.value)} placeholder="0" />
        </div>
      </Field>

      {/* Weight (auto-calculated) */}
      <Field label="Peso inyectada" suffix="auto · g">
        <input style={{ ...inputStyle, color: "#94a3b8", background: "#f1f5f9", fontWeight: 600, border: "1px solid #eef2f6" }} readOnly type="text" value={pesoN ? pesoN.toFixed(2) : ""} placeholder="—" />
      </Field>

      {/* Width & Length side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field label="Ancho" suffix="mm">
          <input style={inputStyle} type="number" value={ancho} onChange={e => setAncho(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Largo" suffix="mm">
          <input style={inputStyle} type="number" value={largo} onChange={e => setLargo(e.target.value)} placeholder="0" />
        </Field>
      </div>

      {/* Cavities */}
      <Field label={cavidadesReadOnly ? "Cavidades · heredado" : "Cavidades"}>
        {cavidadesReadOnly ? (
          <input style={{ ...inputStyle, color: "#94a3b8", background: "#f1f5f9", border: "1px solid #eef2f6" }} readOnly type="text" value={cavidades || ""} placeholder="—" />
        ) : (
          <input style={inputStyle} type="number" value={cavidades} onChange={e => setCavidades(e.target.value)} placeholder="0" />
        )}
      </Field>
    </div>
  );
}

window.MatchmakerView = MatchmakerView;
