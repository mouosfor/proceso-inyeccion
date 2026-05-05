// ═══════════════════════════════════════════════════════════════
// DASHBOARD HOME — Página principal rediseñada
// Diseño moderno con glassmorphism, animaciones y micro-interacciones
// ═══════════════════════════════════════════════════════════════

const { fmt, fmtPct } = window;

// ─── Animación de contadores ───
function useCountUp(target, duration = 2000, prefix = "", suffix = "") {
  const [value, setValue] = React.useState(0);
  const ref = React.useRef(null);
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  const display = target >= 1000
    ? (value / 1000).toFixed(target >= 10000 ? 0 : 1) + (target >= 10000 ? "K" : "K")
    : value.toString();

  return { display, prefix, suffix };
}

// ─── Estadísticas animadas ───
function StatCard({ icon, label, value, color, sublabel }) {
  const counter = useCountUp(value, 2000);
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${color}22, ${color}44)`
          : `linear-gradient(135deg, ${color}15, ${color}08)`,
        borderRadius: 16,
        padding: "22px 20px",
        border: `1px solid ${color}30`,
        transition: "all .4s cubic-bezier(.2,.8,.2,1)",
        transform: hovered ? "translateY(-4px) scale(1.02)" : "translateY(0)",
        boxShadow: hovered
          ? `0 20px 40px -12px ${color}40`
          : "0 4px 12px -4px rgba(0,0,0,0.04)",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow effect on hover */}
      <div style={{
        position: "absolute",
        top: "-50%", right: "-50%",
        width: "200%", height: "200%",
        background: `radial-gradient(circle at 80% 20%, ${color}15, transparent 60%)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity .5s ease",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <div>
          <div style={{
            fontSize: 28, fontWeight: 800,
            fontFamily: "JetBrains Mono, monospace",
            color,
            lineHeight: 1,
            letterSpacing: -1,
          }}>
            {counter.display}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: 500 }}>
            {sublabel || ""}
          </div>
        </div>
        <div style={{
          fontSize: 32, opacity: 0.7,
          filter: hovered ? "grayscale(0) brightness(1.2)" : "grayscale(0.3)",
          transition: "all .3s ease",
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginTop: 10, position: "relative", zIndex: 1 }}>
        {label}
      </div>
    </div>
  );
}

// ─── Tarjetas de acción ───
function ActionCard({ icon, title, desc, gradient, onClick, badge }) {
  const [h, setH] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      style={{
        borderRadius: 20,
        padding: "28px 24px",
        background: h
          ? `linear-gradient(135deg, #fff, ${gradient.end}08)`
          : "#fff",
        border: h ? `1.5px solid ${gradient.start}40` : "1px solid #eef2f6",
        cursor: "pointer",
        transition: "all .35s cubic-bezier(.2,.8,.2,1)",
        transform: h ? "translateY(-6px)" : "translateY(0)",
        boxShadow: h
          ? `0 25px 50px -12px ${gradient.start}30`
          : "0 4px 12px -4px rgba(0,0,0,0.03)",
        position: "relative",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Mouse follower glow */}
      <div style={{
        position: "absolute",
        left: mousePos.x - 150,
        top: mousePos.y - 150,
        width: 300, height: 300,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${gradient.start}10, transparent 60%)`,
        opacity: h ? 1 : 0,
        transition: "opacity .3s ease",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `linear-gradient(135deg, ${gradient.start}, ${gradient.end})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
          boxShadow: `0 8px 20px -6px ${gradient.start}50`,
          marginBottom: 16,
        }}>
          {icon}
        </div>

        {badge && (
          <span style={{
            display: "inline-block", padding: "3px 10px",
            background: `${gradient.start}12`,
            color: gradient.start,
            borderRadius: 999, fontSize: 10, fontWeight: 700,
            letterSpacing: 0.5, marginBottom: 8,
          }}>
            {badge}
          </span>
        )}

        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
          {title}
        </h3>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>
          {desc}
        </p>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          marginTop: 14, fontSize: 11, fontWeight: 700,
          color: gradient.start, letterSpacing: 0.5,
          transition: "gap .25s ease",
        }}>
          {h ? "→" : "›"}
        </div>
      </div>
    </div>
  );
}

// ─── Timeline de pasos ───
function StepTimeline({ steps, onStepClick }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 20,
      border: "1px solid #eef2f6",
      padding: "24px 28px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background decorative circle */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 160, height: 160, borderRadius: "50%",
        background: "linear-gradient(135deg, #6366f110, #4f46e508)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
          ⚡ Cómo funciona
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 20px 0" }}>
          Tres pasos simples
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: "flex", gap: 16,
              padding: i < steps.length - 1 ? "0 0 16px 0" : 0,
              position: "relative",
            }}>
              {/* Timeline line */}
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute", left: 15, top: 32,
                  width: 2, height: "calc(100% - 16px)",
                  background: "linear-gradient(180deg, #6366f1, #6366f130)",
                }} />
              )}
              {/* Step number */}
              <div style={{
                width: 32, height: 32, borderRadius: 999,
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, color: "#fff",
                flexShrink: 0, position: "relative", zIndex: 1,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onStepClick && onStepClick()}
          onMouseEnter={e => { e.target.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.target.style.transform = ""; }}
          style={{
            marginTop: 20, padding: "12px 24px", width: "100%",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            color: "#fff", border: "none", borderRadius: 12,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            letterSpacing: 0.6,
            boxShadow: "0 8px 24px -8px rgba(99,102,241,0.5)",
            transition: "all .2s ease",
          }}>
          COMENZAR AHORA →
        </button>
      </div>
    </div>
  );
}

// ─── Hero Section ───
function HeroParticles() {
  const [particles] = React.useState(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      speed: 0.3 + Math.random() * 0.7,
      delay: Math.random() * 5,
    }));
  });

  return (
    <div style={{
      position: "absolute", inset: 0, overflow: "hidden",
      pointerEvents: "none",
      zIndex: 0,
    }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.3)",
          animation: `float-particle ${4 + p.speed}s ease-in-out ${p.delay}s infinite alternate`,
          boxShadow: `0 0 ${p.size * 2}px rgba(255,255,255,0.2)`,
        }} />
      ))}
    </div>
  );
}

// ─── DashboardHome ───
function DashboardHome({ onGoToMaquina }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const numMaquinas = window.INYECTORAS.length;
  const numMateriales = window.MATERIALES.length;
  const numUbicaciones = window.UBICACIONES.length;
  const num2K = window.INYECTORAS.filter(m => m.dosKa === "SI").length;

  const steps = [
    { title: "Sube un plano o introduce medidas", desc: "Carga un PDF, imagen, CAD 3D o introduce los datos manualmente" },
    { title: "La IA analiza y calcula", desc: "Extrae dimensiones, material y calcula la fuerza de cierre necesaria" },
    { title: "Recibe la máquina ideal", desc: "Comparamos con todas las máquinas disponibles y te recomendamos la mejor opción" },
  ];

  return (
    <div style={{
      fontFamily: "Inter, sans-serif",
      opacity: mounted ? 1 : 0,
      transform: mounted ? "translateY(0)" : "translateY(20px)",
      transition: "all .6s cubic-bezier(.2,.8,.2,1)",
    }}>
      <style>{`
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-30px) translateX(10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px -4px rgba(99,102,241,0.3); }
          50% { box-shadow: 0 0 40px -4px rgba(99,102,241,0.6); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: slide-up 0.5s ease forwards;
          opacity: 0;
        }
      `}</style>

      {/* ─── HERO SECTION ─── */}
      <div style={{
        position: "relative",
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #3730a3 60%, #1e3a8a 100%)",
        padding: "60px 40px 50px",
        borderRadius: 24,
        margin: "24px 28px",
        overflow: "hidden",
      }}>
        <HeroParticles />

        {/* Decorative gradient blobs */}
        <div style={{
          position: "absolute", top: -100, left: -100,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(129,140,248,0.15), transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -80, right: -80,
          width: 350, height: 350, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52,211,153,0.12), transparent 60%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 14px",
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              borderRadius: 999,
              color: "#a5b4fc", fontSize: 11, fontWeight: 600,
              letterSpacing: 0.5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
              Sistema activo
            </span>
          </div>

          <h1 style={{
            fontSize: 42, fontWeight: 800, color: "#fff",
            margin: 0, lineHeight: 1.1, letterSpacing: -1,
          }}>
            Proceso Inyección
          </h1>
          <p style={{
            fontSize: 16, color: "#a5b4fc", marginTop: 12,
            maxWidth: 500, lineHeight: 1.5,
          }}>
            Selecciona la máquina de inyección óptima para tus piezas plásticas.
            Analiza planos con IA, calcula fuerza de cierre y compara máquinas en segundos.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <button
              onClick={onGoToMaquina}
              onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 12px 28px -8px rgba(99,102,241,0.55)"; }}
              onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = ""; }}
              style={{
                padding: "14px 32px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                letterSpacing: 0.5,
                boxShadow: "0 8px 24px -8px rgba(99,102,241,0.4)",
                transition: "all .2s ease",
              }}>
              ⚙️ SELECTOR DE MÁQUINA
            </button>
            <button
              onClick={() => {
                const el = document.querySelector("[data-explore]");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              style={{
                padding: "14px 24px",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                color: "#e0e7ff", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: "pointer", letterSpacing: 0.3,
                transition: "all .2s ease",
              }}
              onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.1)"; }}>
              EXPLORAR ↓
            </button>
          </div>
        </div>
      </div>

      {/* ─── STATS ROW ─── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12,
        margin: "0 28px 20px",
      }}>
        <StatCard icon="🏭" label="Máquinas disponibles" value={numMaquinas} color="#6366f1" sublabel="en 4 plantas" />
        <StatCard icon="🧪" label="Materiales compatibles" value={numMateriales} color="#059669" sublabel="con propiedades" />
        <StatCard icon="🌍" label="Ubicaciones" value={numUbicaciones} color="#d97706" sublabel="Barcelona, Igorre, México, Alicante" />
        <StatCard icon="🔧" label="Máquinas 2K" value={num2K} color="#0891b2" sublabel="bi-material" />
      </div>

      {/* ─── MAIN GRID ─── */}
      <div data-explore style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14,
        margin: "0 28px 28px",
      }}>
        {/* Action Cards */}
        <ActionCard
          icon="⚙️"
          title="Selector de Máquina"
          desc="Introduce los datos de tu pieza y encuentra la máquina ideal con nuestro sistema de puntuación inteligente."
          gradient={{ start: "#6366f1", end: "#4f46e5" }}
          badge="Recomendado"
          onClick={onGoToMaquina}
        />
        <ActionCard
          icon="📐"
          title="Lectura de Plano con IA"
          desc="Sube un PDF o imagen de tu plano técnico y la IA extraerá automáticamente las dimensiones y el material."
          gradient={{ start: "#059669", end: "#10b981" }}
          badge="Nuevo"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*,application/pdf";
            input.click();
          }}
        />
        <ActionCard
          icon="🧊"
          title="Análisis CAD 3D"
          desc="Sube archivos STL, STEP o IGES y calcula volumen y dimensiones reales directamente desde la geometría 3D."
          gradient={{ start: "#ea580c", end: "#f97316" }}
          badge="Avanzado"
          onClick={() => {}}
        />
      </div>

      {/* ─── BOTTOM ROW: Timeline + Info ─── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14,
        margin: "0 28px 28px",
      }}>
        <StepTimeline steps={steps} onStepClick={onGoToMaquina} />

        {/* Info card */}
        <div style={{
          background: "linear-gradient(135deg, #f0fdf4, #fff)",
          borderRadius: 20,
          border: "1px solid #bbf7d0",
          padding: "24px 28px",
          display: "flex", flexDirection: "column", justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -30, right: -30,
            width: 120, height: 120,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.12), transparent)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", letterSpacing: 1, textTransform: "uppercase" }}>
              📊 Datos del sistema
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Marcas disponibles", value: [...new Set(window.INYECTORAS.map(m => m.marca))].length, detail: [...new Set(window.INYECTORAS.map(m => m.marca))].join(", ") },
                { label: "Tonelaje máximo", value: Math.max(...window.INYECTORAS.map(m => m.tonelaje)), detail: "toneladas" },
                { label: "Diámetro husillo máx", value: Math.max(...window.INYECTORAS.map(m => m.diametroHusillo)), detail: "mm" },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 0",
                  borderBottom: i < 2 ? "1px solid #dcfce7" : "none",
                }}>
                  <span style={{ fontSize: 12, color: "#475569" }}>{item.label}</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", fontFamily: "JetBrains Mono, monospace" }}>{item.value}</span>
                    <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DashboardHome = DashboardHome;
DashboardHome.displayName = "DashboardHome";