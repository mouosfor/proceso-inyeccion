// ═══════════════════════════════════════════════════════════════
// PRINT REPORT — Plantilla PDF profesional
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

function getStatusColor(status) {
  return C[status] || "#0f172a";
}

function hasWarning(r) {
  const utilSt = window.statusUtilizacion(r.porcentajeUtilizacion);
  const permSt = window.statusPermanencia(r.tiempoPermanencia, r.tiempoMaxMaterial);
  const ldSt = window.statusRatioLD(r.ratioLD);
  const tonSt = window.statusTonelaje(r.relacionTonelaje);
  return [utilSt, permSt, ldSt, tonSt].some(s => s === "high" || s === "warn");
}

// ─── SVG: Husillo de inyección ───
function ScrewSVG({ width = 180, height = 50 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 180 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Barrel */}
      <rect x="10" y="18" width="160" height="14" rx="3" fill="#94a3b8" opacity="0.3" stroke="#64748b" strokeWidth="0.8" />
      {/* Screw flights */}
      {[20,32,44,56,68,80,92,104,116,128,140,152].map((x, i) => (
        <path key={i} d={`M${x},18 L${x+8},10 L${x+12},18`} fill={i < 4 ? "#94a3b8" : i < 8 ? "#64748b" : "#475569"} opacity={0.6 + (i/20)} />
      ))}
      {/* Screw tip (nozzle) */}
      <path d="M168,22 L178,22 L178,28 L168,28 Z" fill="#475569" />
      <path d="M178,21 L180,23 L180,27 L178,29 Z" fill="#334155" />
      {/* Screw shaft */}
      <rect x="20" y="23" width="148" height="4" rx="1" fill="#64748b" opacity="0.5" />
      {/* Material flow indication */}
      <circle cx="22" cy="14" r="3" fill="#10b981" opacity="0.4" />
      <circle cx="34" cy="12" r="2.5" fill="#10b981" opacity="0.3" />
      <circle cx="46" cy="11" r="2" fill="#10b981" opacity="0.2" />
    </svg>
  );
}

// ─── SVG: Molde ───
function MoldSVG({ width = 140, height = 100 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Mold base */}
      <rect x="10" y="10" width="120" height="80" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Cavity */}
      <rect x="35" y="25" width="70" height="50" rx="6" fill="#f1f5f9" stroke="#64748b" strokeWidth="1" strokeDasharray="4 3" />
      {/* Part shape inside cavity */}
      <path d="M52,35 Q60,30 70,35 L75,50 Q70,60 60,60 L50,50 Z" fill="#6366f140" stroke="#6366f1" strokeWidth="0.8" />
      <path d="M78,40 Q85,35 90,42 L88,52 Q82,56 78,50 Z" fill="#05966940" stroke="#059669" strokeWidth="0.8" />
      {/* Ejector pins */}
      {[45, 95].map((x, i) => (
        <circle key={i} cx={x} cy="80" r="2.5" fill="#94a3b8" />
      ))}
      {/* Sprue / Gate */}
      <path d="M70,10 L70,20" stroke="#64748b" strokeWidth="2" />
      <circle cx="70" cy="8" r="3" fill="#64748b" />
      {/* Cooling lines */}
      <line x1="15" y1="30" x2="30" y2="30" stroke="#93c5fd" strokeWidth="1.5" opacity="0.6" />
      <line x1="15" y1="50" x2="30" y2="50" stroke="#93c5fd" strokeWidth="1.5" opacity="0.6" />
      <line x1="110" y1="30" x2="125" y2="30" stroke="#93c5fd" strokeWidth="1.5" opacity="0.6" />
      <line x1="110" y1="50" x2="125" y2="50" stroke="#93c5fd" strokeWidth="1.5" opacity="0.6" />
      {/* Label */}
      <text x="70" y="95" textAnchor="middle" fontSize="7" fill="#64748b" fontWeight="600">MOLDE</text>
    </svg>
  );
}

// ─── SVG: Husillo 2K (doble) ───
function Screw2KSVG({ width = 180, height = 80, diamP = "?", diamS = "?", strokeP = "?", strokeS = "?" }) {
  return (
    <svg width={width} height={height} viewBox="0 0 180 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Primary screw */}
      <rect x="10" y="10" width="150" height="12" rx="2" fill="#94a3b830" stroke="#64748b" strokeWidth="0.8" />
      {[20,32,44,56,68,80,92,104,116,128,140].map((x, i) => (
        <path key={`p${i}`} d={`M${x},10 L${x+7},4 L${x+11},10`} fill={i < 3 ? "#94a3b8" : i < 6 ? "#64748b" : "#475569"} opacity={0.5 + (i/20)} />
      ))}
      <rect x="20" y="14" width="138" height="4" rx="1" fill="#64748b" opacity="0.4" />
      <text x="90" y="32" textAnchor="middle" fontSize="7" fill="#059669" fontWeight="700">HUSILLO PRINCIPAL · Ø{diamP}mm</text>

      {/* Secondary screw */}
      <rect x="10" y="44" width="130" height="10" rx="2" fill="#94a3b830" stroke="#64748b" strokeWidth="0.8" />
      {[20,30,40,50,60,70,80,90,100,110,120].map((x, i) => (
        <path key={`s${i}`} d={`M${x},44 L${x+6},39 L${x+9},44`} fill={i < 3 ? "#94a3b8" : i < 6 ? "#64748b" : "#475569"} opacity={0.5 + (i/20)} />
      ))}
      <rect x="20" y="47" width="118" height="3" rx="1" fill="#64748b" opacity="0.4" />
      <text x="85" y="64" textAnchor="middle" fontSize="7" fill="#059669" fontWeight="700">HUSILLO SECUNDARIO · Ø{diamS}mm</text>
    </svg>
  );
}

// ─── Explicación de por qué se eligió la máquina ───
function generateExplanation(top, s) {
  const r = top.res;
  const m = top.maquina;
  const is2K = r.mode === "2K";
  const parts = [];
  let hasWarning = false;

  // Utilización
  const util = r.mode === "2K"
    ? Math.max(r.resPrincipal?.porcentajeUtilizacion || 0, r.resSecundario?.porcentajeUtilizacion || 0)
    : r.porcentajeUtilizacion || 0;
  const utilPct = (util * 100).toFixed(0);

  if (util >= 0.35 && util <= 0.8) {
    parts.push(`La utilización del husillo es del ${utilPct}%, dentro del rango óptimo (35-80%), lo que garantiza un aprovechamiento eficiente del material.`);
  } else if (util < 0.35) {
    hasWarning = true;
    if (util < 0.2) {
      parts.push(`⚠ La utilización del husillo es del ${utilPct}%, muy por debajo del rango óptimo (35-80%). La pieza es demasiado pequeña para el husillo de esta máquina.`);
    } else {
      parts.push(`⚠ La utilización del husillo es del ${utilPct}%, por debajo del rango óptimo (35-80%). Se recomienda considerar una máquina con husillo de menor diámetro.`);
    }
  } else {
    hasWarning = true;
    parts.push(`⚠ La utilización del husillo es del ${utilPct}%, por encima del rango óptimo (35-80%). Existe riesgo de degradación del material por cizalla excesiva.`);
  }

  // Permanencia
  const perm = r.mode === "2K"
    ? Math.min(r.resPrincipal?.tiempoPermanencia || Infinity, r.resSecundario?.tiempoPermanencia || Infinity)
    : r.tiempoPermanencia;
  const tMax = r.mode === "2K"
    ? Math.min(r.resPrincipal?.tiempoMaxMaterial || Infinity, r.resSecundario?.tiempoMaxMaterial || Infinity)
    : r.tiempoMaxMaterial;

  if (perm != null && tMax != null) {
    if (perm <= tMax) {
      parts.push(`El tiempo de permanencia (${fmt(perm, 1)} min) no supera el máximo recomendado para el material (${tMax} min), asegurando la integridad del polímero.`);
    } else if (perm <= tMax * 1.2) {
      hasWarning = true;
      parts.push(`⚠ El tiempo de permanencia (${fmt(perm, 1)} min) supera ligeramente el máximo recomendado (${tMax} min). Se recomienda monitorizar el proceso.`);
    } else {
      hasWarning = true;
      parts.push(`✖ El tiempo de permanencia (${fmt(perm, 1)} min) supera significativamente el máximo recomendado (${tMax} min). Riesgo de degradación térmica del material.`);
    }
  }

  // L/D
  const ld = r.mode === "2K"
    ? Math.min(r.resPrincipal?.ratioLD || 0, r.resSecundario?.ratioLD || 0)
    : r.ratioLD;
  if (ld != null) {
    if (ld >= 1 && ld <= 3) {
      parts.push(`La relación L/D (${fmt(ld)}) está dentro del rango óptimo (1-3), garantizando una correcta plastificación y homogeneidad del fundido.`);
    } else if (ld >= 0.5 && ld <= 4) {
      hasWarning = true;
      parts.push(`⚠ La relación L/D (${fmt(ld)}) está fuera del rango óptimo (1-3). La plastificación puede verse afectada.`);
    } else {
      hasWarning = true;
      parts.push(`✖ La relación L/D (${fmt(ld)}) está muy fuera del rango recomendado (1-3). La calidad de plastificación puede ser deficiente.`);
    }
  }

  // Tonelaje
  const tonRel = r.relacionTonelaje;
  if (tonRel != null) {
    const tonPct = (tonRel * 100).toFixed(0);
    if (tonRel > 1) {
      hasWarning = true;
      parts.push(`✖ La fuerza de cierre necesaria (${r.fuerzaCierreNecesaria != null ? r.fuerzaCierreNecesaria.toFixed(0) : "—"} t) supera la capacidad de la máquina (${m.tonelaje} t). ¡La máquina NO puede cerrar el molde!`);
    } else if (tonRel > 0.9) {
      hasWarning = true;
      parts.push(`⚠ La fuerza de cierre necesaria (${r.fuerzaCierreNecesaria != null ? r.fuerzaCierreNecesaria.toFixed(0) : "—"} t) está muy ajustada (${tonPct}% de ${m.tonelaje} t). Riesgo de rebabas.`);
    } else if (tonRel >= 0.5) {
      parts.push(`La fuerza de cierre necesaria (${r.fuerzaCierreNecesaria != null ? r.fuerzaCierreNecesaria.toFixed(0) : "—"} t) representa un ${tonPct}% de la capacidad de la máquina (${m.tonelaje} t), con suficiente margen de seguridad.`);
    } else {
      parts.push(`La fuerza de cierre necesaria (${r.fuerzaCierreNecesaria != null ? r.fuerzaCierreNecesaria.toFixed(0) : "—"} t) solo utiliza un ${tonPct}% de la capacidad de la máquina (${m.tonelaje} t). La máquina está sobredimensionada.`);
    }
  }

  // 2K specific
  if (is2K) {
    parts.push(`La máquina dispone de dos husillos independientes (${m.diametroHusillo} mm y ${m.diametroHusilloSecundario} mm), permitiendo el procesamiento simultáneo de dos materiales diferentes en un mismo ciclo.`);
  }

  return { text: parts.length > 0 ? parts.join(" ") : "La máquina seleccionada cumple con los requisitos de capacidad, dimensionales y de proceso para la pieza especificada.", hasWarning };
}

// ═══════════════════════════════════════════════════════════════
// PRINT REPORT COMPONENT
// ═══════════════════════════════════════════════════════════════
function PrintReport({ s, top }) {
  if (!top || !top.res.valid) return null;
  const r = top.res;
  const m = top.maquina;
  const is2K = r.mode === "2K";
  const { text: explanation, hasWarning: explHasWarning } = generateExplanation(top, s);
  const date = new Date().toLocaleDateString("es-ES", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  // Status para cada métrica 1K
  const utilSt = is2K ? null : window.statusUtilizacion(r.porcentajeUtilizacion);
  const permSt = is2K ? null : window.statusPermanencia(r.tiempoPermanencia, r.tiempoMaxMaterial);
  const ldSt = is2K ? null : window.statusRatioLD(r.ratioLD);
  const tonSt = is2K ? null : window.statusTonelaje(r.relacionTonelaje);
  const anyWarning = explHasWarning;

  return (
    <div id="print-report" style={{
      fontFamily: "Inter, -apple-system, sans-serif",
      color: "#0f172a", background: "#fff",
      padding: 0, maxWidth: 800, margin: "0 auto",
    }}>
        <style>{`
        @media print {
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 15mm; }
        }
        .print-header { display: flex; align-items: center; justify-content: space-between; padding: 24px 32px; border-bottom: 2px solid #059669; }
        .print-body { padding: 24px 32px; }
        .print-footer { padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
        .info-label { font-size: 9px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px; }
        .machine-title { font-size: 18px; font-weight: 700; color: #059669; }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <div className="print-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="logo.png" alt="WalterPack" style={{ height: 32, width: "auto" }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Proceso Inyección</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Cumplimiento de máquina</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Informe técnico</div>
          <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{date}</div>
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="print-body">
        {/* ── Info Grid ── */}
        <div className="info-grid">
          <div className="info-box">
            <div className="info-label">Planta</div>
            <div className="info-value">{s.ubicacion}</div>
          </div>
          <div className="info-box">
            <div className="info-label">Sala</div>
            <div className="info-value">{s.celula}</div>
          </div>
          <div className="info-box">
            <div className="info-label">Tipo de inyección</div>
            <div className="info-value">{is2K ? "2K · Bi-material" : "1K · Material único"}</div>
          </div>
          <div className="info-box">
            <div className="info-label">Tiempo de ciclo</div>
            <div className="info-value">{s.tCicloN > 0 ? `${s.tCicloN} seg` : "—"}</div>
          </div>
        </div>

        {/* ── Material & Weight ── */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
            Datos de la pieza
          </div>

          {is2K ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Componente 1 */}
              <div style={{ border: "1px solid #e0e7ff", borderRadius: 8, padding: "12px 14px", borderLeft: "3px solid #6366f1" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", marginBottom: 6 }}>Componente 1</div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Material: </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{s.materialNombre}</span>
                </div>
                <div>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Peso: </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: "JetBrains Mono, monospace" }}>{s.c1.pesoInyectadaN ? `${s.c1.pesoInyectadaN.toFixed(2)} g` : "—"}</span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Volumen: </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: "JetBrains Mono, monospace" }}>{s.c1.volumenN ? `${s.c1.volumenN.toFixed(2)} cm³` : "—"}</span>
                </div>
              </div>
              {/* Componente 2 */}
              <div style={{ border: "1px solid #d1fae5", borderRadius: 8, padding: "12px 14px", borderLeft: "3px solid #059669" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", textTransform: "uppercase", marginBottom: 6 }}>Componente 2</div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Material: </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{s.materialNombre2}</span>
                </div>
                <div>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Peso: </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: "JetBrains Mono, monospace" }}>{s.c2.pesoInyectadaN ? `${s.c2.pesoInyectadaN.toFixed(2)} g` : "—"}</span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Volumen: </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: "JetBrains Mono, monospace" }}>{s.c2.volumenN ? `${s.c2.volumenN.toFixed(2)} cm³` : "—"}</span>
                </div>
              </div>
              {/* Combined */}
              <div style={{ gridColumn: "1 / -1", background: "#f8fafc", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "#475569" }}>Peso total inyectado</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "#0f172a" }}>{s.pesoInyectadaN ? `${s.pesoInyectadaN.toFixed(2)} g` : "—"}</span>
              </div>
            </div>
          ) : (
            <div style={{ border: "1px solid #e0e7ff", borderRadius: 8, padding: "12px 14px", borderLeft: "3px solid #6366f1" }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: "#64748b" }}>Material: </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{s.materialNombre}</span>
              </div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: "#64748b" }}>Peso inyectada: </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: "JetBrains Mono, monospace" }}>{s.c1.pesoInyectadaN ? `${s.c1.pesoInyectadaN.toFixed(2)} g` : "—"}</span>
              </div>
              <div>
                <span style={{ fontSize: 9, color: "#64748b" }}>Volumen: </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: "JetBrains Mono, monospace" }}>{s.c1.volumenN ? `${s.c1.volumenN.toFixed(2)} cm³` : "—"}</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── MÁQUINA SELECCIONADA ─── */}
        <div style={{ marginTop: 20 }}>
          <div style={{
            background: anyWarning
              ? "linear-gradient(135deg, #d97706, #f59e0b)"
              : "linear-gradient(135deg, #059669, #10b981)",
            borderRadius: 10, padding: "14px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>★ Máquina seleccionada</div>
              <div style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginTop: 2 }}>{m.maquina}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginTop: 2 }}>{m.marca} · {m.ubicacion} · {m.tonelaje} t</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 9 }}>Tonelaje</div>
              <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>{m.tonelaje}<span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>t</span></div>
            </div>
          </div>

          {/* Key metrics: 1K → directos · 2K → P/S por husillo */}
          {is2K ? (
            <div style={{ marginTop: 10 }}>
              <Husillo2KRow res={r.resPrincipal} title={`Husillo principal · Ø${m.diametroHusillo}`} sub={`carrera máx ${m.dosisMaxHusillo} mm`} accent="#059669" />
              <div style={{ height: 6 }} />
              <Husillo2KRow res={r.resSecundario} title={`Husillo secundario · Ø${m.diametroHusilloSecundario}`} sub={`carrera máx ${m.dosisMaxHusilloSecundario} mm`} accent="#0891b2" />
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>F. cierre / Tonelaje · combinada</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "JetBrains Mono, monospace" }}>
                  {r.fuerzaCierreNecesaria != null ? r.fuerzaCierreNecesaria.toFixed(0) : "—"} t / {m.tonelaje} t
                  <span style={{ marginLeft: 6, color: "#059669" }}>({fmtPct(r.relacionTonelaje)})</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 10 }}>
              <MetricBox label="Utilización" value={fmtPct(r.porcentajeUtilizacion)} status={utilSt} />
              <MetricBox label="Permanencia" value={`${fmt(r.tiempoPermanencia, 1)} min`} status={permSt} />
              <MetricBox label="L/D" value={fmt(r.ratioLD)} status={ldSt} />
              <MetricBox label="Dosis real" value={`${fmt(r.cm3DosisReal)} cm³`} />
              <MetricBox label="F.cierre" value={fmtPct(r.relacionTonelaje)} status={tonSt} />
            </div>
          )}
        </div>

        {/* ─── EXPLANATION ─── */}
        <div style={{ marginTop: 16, background: anyWarning ? "#fffbeb" : "#f0fdf4", borderRadius: 8, padding: "12px 16px", border: anyWarning ? "1px solid #fde68a" : "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: anyWarning ? "#d97706" : "#059669", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
            {anyWarning ? "⚠ Análisis de la máquina" : "¿Por qué esta máquina?"}
          </div>
          <p style={{ fontSize: 10, color: "#475569", lineHeight: 1.6, margin: 0 }}>
            {explanation}
          </p>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="print-footer">
        <div>WalterPack Group — Proceso Inyección · Informe generado el {date}</div>
        <div style={{ marginTop: 4 }}>Este informe es una recomendación técnica basada en los parámetros introducidos.</div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, status }) {
  const color = status ? getStatusColor(status) : "#0f172a";
  const bg = status ? CBg[status] : "#f8fafc";
  return (
    <div style={{ background: bg, borderRadius: 6, padding: "8px 10px", textAlign: "center", border: status ? `1px solid ${color}40` : "none" }}>
      <div style={{ fontSize: 8, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color, marginTop: 2 }}>{value}</div>
    </div>
  );
}

// Fila compacta para un husillo en modo 2K
function Husillo2KRow({ res, title, sub, accent }) {
  if (!res) return null;
  const utilSt = window.statusUtilizacion(res.porcentajeUtilizacion);
  const permSt = window.statusPermanencia(res.tiempoPermanencia, res.tiempoMaxMaterial);
  const ldSt = window.statusRatioLD(res.ratioLD);
  return (
    <div style={{
      background: "#f8fafc", borderRadius: 8, padding: "10px 12px",
      borderLeft: `3px solid ${accent}`,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: 0.6 }}>{title}</div>
        <div style={{ fontSize: 8, color: "#94a3b8", fontFamily: "JetBrains Mono, monospace" }}>{sub}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        <MetricBox label="Utilización" value={fmtPct(res.porcentajeUtilizacion)} status={utilSt} />
        <MetricBox label="Permanencia" value={res.tiempoPermanencia != null ? `${fmt(res.tiempoPermanencia, 1)} min` : "—"} status={permSt} />
        <MetricBox label="L/D" value={fmt(res.ratioLD)} status={ldSt} />
        <MetricBox label="Dosis real" value={res.cm3DosisReal != null ? `${fmt(res.cm3DosisReal)} cm³` : "—"} />
      </div>
    </div>
  );
}

window.PrintReport = PrintReport;