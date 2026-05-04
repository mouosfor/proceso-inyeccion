// Pestaña de Plano: subir imagen/PDF, extraer datos vía Cloudflare Worker → Gemini.

// ─── CONFIGURACIÓN ─── el admin sustituye estas dos líneas tras desplegar el Worker
const WORKER_URL = "https://proceso-inyeccion-api.mou-osfor.workers.dev";
// ─────────────────────

function PlanoTab({ onApply, onGoToMaquina }) {
  const [file, setFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [status, setStatus] = React.useState("idle");
  const [extracted, setExtracted] = React.useState(null);
  const [errMsg, setErrMsg] = React.useState("");
  const inputRef = React.useRef();

  const handleFiles = async (f) => {
    if (!f) return;
    setFile(f);
    setExtracted(null);
    setErrMsg("");
    if (f.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  };

  const fileToBase64 = (f) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(f);
  });

  const extractPdfText = async (f) => {
    const buf = await f.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map((it) => it.str).join(" ") + "\n";
    }
    return out.trim();
  };

  const renderPdfToImage = async (f) => {
    const buf = await f.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const maxDim = 2000;
    const scale = Math.min(maxDim / baseViewport.width, maxDim / baseViewport.height, 2.5);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return dataUrl.split(",")[1];
  };

  const getPassword = () => {
    let p = localStorage.getItem("plano_access_password");
    if (!p) {
      p = prompt("Introduce la contraseña de acceso:");
      if (p) localStorage.setItem("plano_access_password", p);
    }
    return p;
  };

  const callWorker = async (payload) => {
    const password = getPassword();
    if (!password) throw new Error("Contraseña requerida");
    const r = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Password": password,
      },
      body: JSON.stringify(payload),
    });
    if (r.status === 401) {
      localStorage.removeItem("plano_access_password");
      throw new Error("Contraseña incorrecta — vuelve a intentarlo");
    }
    const data = await r.json();
    if (!r.ok) {
      console.error("Worker error:", data);
      const detailMsg = data.detail?.error?.message || JSON.stringify(data.detail || {}).slice(0, 300);
      throw new Error(`${data.error || "Error en el servidor"} — ${detailMsg}`);
    }
    return data.text;
  };

  const analyzar = async () => {
    if (!file) return;
    setStatus("analyzing");
    setErrMsg("");
    try {
      const materialNames = window.MATERIALES.map((m) => m.material).join(", ");
      const prompt = `Eres un experto en moldeo por inyección. Analiza este plano técnico y extrae los datos relevantes para calcular el cumplimiento de máquina.

Devuelve SOLO un JSON válido con esta estructura (usa null si un dato no aparece):
{
  "material": "nombre exacto si coincide con la lista, o null",
  "ancho_mm": numero o null,
  "largo_mm": numero o null,
  "n_cavidades": numero o null,
  "tiempo_ciclo_seg": numero o null,
  "volumen_cm3": numero o null,
  "peso_inyectada_g": numero o null,
  "notas": "string corto con observaciones"
}

Materiales disponibles: ${materialNames}.
Si el material en el plano coincide aproximadamente, usa el nombre EXACTO de la lista. Si no, deja null.
NO incluyas texto antes ni después del JSON. Solo el objeto JSON.`;

      let responseText;
      if (file.type === "application/pdf") {
        const text = await extractPdfText(file);
        if (text && text.length > 60) {
          responseText = await callWorker({ mode: "text", prompt, text });
        } else {
          const b64 = await renderPdfToImage(file);
          responseText = await callWorker({
            mode: "image",
            prompt,
            imageBase64: b64,
            mimeType: "image/jpeg",
          });
        }
      } else if (file.type.startsWith("image/")) {
        const b64 = await fileToBase64(file);
        responseText = await callWorker({
          mode: "image",
          prompt,
          imageBase64: b64,
          mimeType: file.type,
        });
      } else {
        throw new Error("Formato no soportado. Sube imagen o PDF.");
      }

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No se encontró JSON en la respuesta");
      const data = JSON.parse(jsonMatch[0]);
      setExtracted(data);
      setStatus("ok");
    } catch (e) {
      console.error(e);
      setErrMsg(e.message || "Error al analizar el plano");
      setStatus("error");
    }
  };

  const aplicarDatos = () => {
    if (!extracted) return;
    onApply(extracted);
  };

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .pcard {
          position: relative;
          border-radius: 16px;
          padding: 32px;
          transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s ease, border-color .35s ease;
          overflow: hidden;
          will-change: transform;
        }
        .pcard::before {
          content: "";
          position: absolute; inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: .55;
          background: radial-gradient(120% 80% at 0% 0%, var(--accent-soft), transparent 55%);
          transition: opacity .35s ease;
        }
        .pcard:hover { transform: translateY(-4px); box-shadow: 0 20px 50px -20px var(--accent-shadow), 0 8px 20px -10px rgba(15,23,42,.08); }
        .pcard:hover::before { opacity: 1; }
        .pcard-manual {
          --accent: #4f46e5;
          --accent-2: #6366f1;
          --accent-soft: rgba(99,102,241,.18);
          --accent-shadow: rgba(79,70,229,.28);
          background: linear-gradient(180deg, #fbfbff 0%, #ffffff 60%);
          border: 1px solid #e0e7ff;
        }
        .pcard-auto {
          --accent: #059669;
          --accent-2: #10b981;
          --accent-soft: rgba(16,185,129,.18);
          --accent-shadow: rgba(5,150,105,.25);
          background: linear-gradient(180deg, #f7fdfa 0%, #ffffff 60%);
          border: 1px solid #d1fae5;
        }
        .pcard-cad {
          --accent: #ea580c;
          --accent-2: #f97316;
          --accent-soft: rgba(249,115,22,.18);
          --accent-shadow: rgba(234,88,12,.25);
          background: linear-gradient(180deg, #fff7ed 0%, #ffffff 60%);
          border: 1px solid #fed7aa;
        }
        .icon-bubble {
          position: relative;
          width: 56px; height: 56px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin-bottom: 18px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          box-shadow: 0 10px 24px -8px var(--accent-shadow);
          animation: float 4s ease-in-out infinite;
        }
        .icon-bubble::after {
          content: ""; position: absolute; inset: 0; border-radius: inherit;
          background: linear-gradient(180deg, rgba(255,255,255,.35), transparent 50%);
          pointer-events: none;
        }
        .pcard h2 {
          margin: 0; font-size: 22px; font-weight: 700;
          background: linear-gradient(135deg, #0f172a, var(--accent));
          -webkit-background-clip: text; background-clip: text;
          color: transparent;
          letter-spacing: -0.02em;
        }
        .pcard-desc { font-size: 13px; color: #475569; margin-top: 8px; line-height: 1.55; }
        .btn-cta {
          padding: 13px 18px; border: none; border-radius: 10px;
          color: #fff; font-size: 12px; font-weight: 700; letter-spacing: .8px;
          cursor: pointer; position: relative; overflow: hidden;
          transition: transform .2s ease, box-shadow .25s ease;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          box-shadow: 0 8px 22px -8px var(--accent-shadow);
        }
        .btn-cta:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 28px -8px var(--accent-shadow); }
        .btn-cta:active:not(:disabled) { transform: translateY(0); }
        .btn-cta:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; }
        .btn-cta::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.25) 50%, transparent 70%);
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity .25s ease;
        }
        .btn-cta:hover:not(:disabled)::after { opacity: 1; animation: shimmer 1.4s linear infinite; }
        .dropzone {
          background: rgba(255,255,255,.6);
          backdrop-filter: blur(2px);
          border-radius: 12px;
          transition: border-color .2s ease, background .2s ease, transform .2s ease;
        }
        .dropzone:hover { border-color: var(--accent) !important; background: #fff; transform: translateY(-1px); }
        .pcard-tag {
          display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .8px;
          color: var(--accent); background: var(--accent-soft);
          padding: 4px 10px; border-radius: 999px; margin-bottom: 12px;
          text-transform: uppercase;
        }
      `}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "stretch" }}>

        {/* IZQUIERDA — Manual */}
        <div className="pcard pcard-manual" style={{
          minHeight: 340,
          display: "flex", flexDirection: "column",
        }}>
          <div className="icon-bubble">⚙️</div>
          <span className="pcard-tag">Modo manual</span>
          <h2>Introduce los datos manualmente</h2>
          <div className="pcard-desc">
            Configura el material, dimensiones y ciclo paso a paso para obtener la recomendación de máquina.
          </div>
          <button
            onClick={onGoToMaquina}
            className="btn-cta"
            style={{ marginTop: "auto", alignSelf: "flex-start" }}>
            SELECTOR DE MÁQUINA →
          </button>
        </div>

        {/* DERECHA — Automático */}
        <div className="pcard pcard-auto" style={{
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div>
            <div className="icon-bubble">📐</div>
            <span className="pcard-tag">Modo IA</span>
            <h2>Lectura automática de plano</h2>
            <div className="pcard-desc">
              Sube un plano técnico (imagen o PDF) y la IA extraerá las dimensiones, material y cavidades para recomendar la máquina ideal.
            </div>
          </div>

          <div
            className="dropzone"
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            style={{
              border: file ? "1px solid #d1fae5" : "2px dashed #a7f3d0",
              padding: file ? 8 : 18, minHeight: 110,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              cursor: "pointer", textAlign: "center", overflow: "hidden",
            }}>
            <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }}
              onChange={e => handleFiles(e.target.files[0])} />
            {previewUrl ? (
              <img src={previewUrl} alt="plano" style={{ maxWidth: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 6 }} />
            ) : file ? (
              <div>
                <div style={{ fontSize: 24, marginBottom: 4 }}>📄</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 22, marginBottom: 4, color: "#10b981" }}>⬆</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Arrastra un plano</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>imagen o PDF</div>
              </div>
            )}
          </div>

          <button
            onClick={analyzar}
            disabled={!file || status === "analyzing"}
            className="btn-cta">
            {status === "analyzing" ? "ANALIZANDO…" : "ANALIZAR PLANO"}
          </button>

          {status === "analyzing" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, padding: 12 }}>
              <div style={{
                width: 22, height: 22, border: "2px solid #e1e5ea", borderTopColor: "#0f172a",
                borderRadius: "50%", animation: "spin 0.8s linear infinite",
              }} />
              <div style={{ fontSize: 11, color: "#64748b" }}>Leyendo el plano con IA…</div>
            </div>
          )}
          {status === "error" && (
            <div style={{ padding: 12, background: "#fde8e8", color: "#a11212", borderRadius: 6, fontSize: 12 }}>
              <b>Error:</b> {errMsg}
            </div>
          )}
          {extracted && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", letterSpacing: 0.6, textTransform: "uppercase", marginTop: 4 }}>
                Datos extraídos
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <DatoExtraido label="Material" value={extracted.material} />
                <DatoExtraido label="Cavidades" value={extracted.n_cavidades} />
                <DatoExtraido label="Ancho" value={extracted.ancho_mm} suffix="mm" />
                <DatoExtraido label="Largo" value={extracted.largo_mm} suffix="mm" />
                <DatoExtraido label="T. ciclo" value={extracted.tiempo_ciclo_seg} suffix="seg" />
                <DatoExtraido label="Volumen" value={extracted.volumen_cm3} suffix="cm³" />
                <DatoExtraido label="Peso inyectada" value={extracted.peso_inyectada_g} suffix="g" />
              </div>
              {extracted.notas && (
                <div style={{
                  padding: "8px 10px", background: "#f1f5f9", borderRadius: 6,
                  fontSize: 11, color: "#475569", fontStyle: "italic",
                }}>
                  {extracted.notas}
                </div>
              )}
              <button onClick={aplicarDatos} className="btn-cta" style={{ marginTop: 4, padding: "13px 18px" }}>
                APLICAR Y RECOMENDAR MÁQUINA →
              </button>
            </>
          )}
        </div>

        {/* TERCERA — CAD 3D */}
        <window.Cad3DCard onApply={onApply} />
      </div>
    </div>
  );
}

function DatoExtraido({ label, value, suffix }) {
  const empty = value == null || value === "";
  return (
    <div style={{
      padding: "8px 10px", background: empty ? "#f7f8fa" : "#ecfdf5",
      border: `1px solid ${empty ? "#eef0f3" : "#a7f3d0"}`,
      borderRadius: 6,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", letterSpacing: 0.6, textTransform: "uppercase" }}>{label}</div>
      <div style={{
        fontSize: 13, fontWeight: 600, fontFamily: "JetBrains Mono, monospace",
        color: empty ? "#cbd5e1" : "#0f172a", marginTop: 2,
      }}>
        {empty ? "—" : value}{!empty && suffix ? <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>{suffix}</span> : null}
      </div>
    </div>
  );
}

window.PlanoTab = PlanoTab;
window.DatoExtraido = DatoExtraido;
