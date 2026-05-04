// Tarjeta de análisis CAD 3D — soporta STL (parser propio) y STEP/IGES (vía occt-import-js).
// Lazy-load del wasm de occt-import-js solo al subir un STEP/IGES, para no inflar la carga inicial.

const OCCT_CDN = "https://cdn.jsdelivr.net/npm/occt-import-js@0.0.22";

let _occtPromise = null;
function loadOcct() {
  if (_occtPromise) return _occtPromise;
  _occtPromise = (async () => {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `${OCCT_CDN}/dist/occt-import-js.js`;
      s.onload = resolve;
      s.onerror = () => reject(new Error("No se pudo cargar occt-import-js"));
      document.head.appendChild(s);
    });
    return await window.occtimportjs({
      locateFile: (f) => `${OCCT_CDN}/dist/${f}`,
    });
  })();
  return _occtPromise;
}

async function parseSTL(file) {
  const buf = await file.arrayBuffer();
  const view = new DataView(buf);
  const decoder = new TextDecoder();
  const triCountIfBinary = buf.byteLength >= 84 ? view.getUint32(80, true) : 0;
  const expectedBinarySize = 84 + triCountIfBinary * 50;
  if (buf.byteLength === expectedBinarySize && triCountIfBinary > 0) {
    const tris = new Float32Array(triCountIfBinary * 9);
    let off = 84;
    for (let i = 0; i < triCountIfBinary; i++) {
      off += 12; // skip normal
      for (let j = 0; j < 9; j++) {
        tris[i * 9 + j] = view.getFloat32(off, true);
        off += 4;
      }
      off += 2; // attribute byte count
    }
    return tris;
  }
  // ASCII STL fallback
  const text = decoder.decode(buf);
  const verts = [];
  const re = /vertex\s+(-?\d+\.?\d*(?:[eE][-+]?\d+)?)\s+(-?\d+\.?\d*(?:[eE][-+]?\d+)?)\s+(-?\d+\.?\d*(?:[eE][-+]?\d+)?)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    verts.push(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
  }
  if (verts.length === 0) throw new Error("STL no reconocido o vacío");
  return new Float32Array(verts);
}

function computeStats({ flatTriangles, meshes }) {
  let volume = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let triCount = 0;

  const tri = (a, b, c, d, e, f, g, h, i) => {
    volume += (a * (e * i - h * f) - d * (b * i - h * c) + g * (b * f - e * c)) / 6;
    if (a < minX) minX = a; if (a > maxX) maxX = a;
    if (b < minY) minY = b; if (b > maxY) maxY = b;
    if (c < minZ) minZ = c; if (c > maxZ) maxZ = c;
    if (d < minX) minX = d; if (d > maxX) maxX = d;
    if (e < minY) minY = e; if (e > maxY) maxY = e;
    if (f < minZ) minZ = f; if (f > maxZ) maxZ = f;
    if (g < minX) minX = g; if (g > maxX) maxX = g;
    if (h < minY) minY = h; if (h > maxY) maxY = h;
    if (i < minZ) minZ = i; if (i > maxZ) maxZ = i;
    triCount++;
  };

  if (flatTriangles) {
    for (let k = 0; k < flatTriangles.length; k += 9) {
      tri(
        flatTriangles[k],   flatTriangles[k+1], flatTriangles[k+2],
        flatTriangles[k+3], flatTriangles[k+4], flatTriangles[k+5],
        flatTriangles[k+6], flatTriangles[k+7], flatTriangles[k+8],
      );
    }
  }
  if (meshes) {
    for (const mesh of meshes) {
      const pos = mesh.attributes?.position?.array;
      if (!pos) continue;
      const idx = mesh.index?.array;
      if (idx) {
        for (let k = 0; k < idx.length; k += 3) {
          const a = idx[k] * 3, b = idx[k+1] * 3, c = idx[k+2] * 3;
          tri(
            pos[a], pos[a+1], pos[a+2],
            pos[b], pos[b+1], pos[b+2],
            pos[c], pos[c+1], pos[c+2],
          );
        }
      } else {
        for (let k = 0; k < pos.length; k += 9) {
          tri(
            pos[k],   pos[k+1], pos[k+2],
            pos[k+3], pos[k+4], pos[k+5],
            pos[k+6], pos[k+7], pos[k+8],
          );
        }
      }
    }
  }
  return {
    volume_mm3: Math.abs(volume),
    width: maxX - minX,
    length: maxY - minY,
    height: maxZ - minZ,
    triCount,
  };
}

function Cad3DCard({ onApply }) {
  const [file, setFile] = React.useState(null);
  const [status, setStatus] = React.useState("idle");
  const [extracted, setExtracted] = React.useState(null);
  const [errMsg, setErrMsg] = React.useState("");
  const [progressMsg, setProgressMsg] = React.useState("");
  const inputRef = React.useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setExtracted(null);
    setErrMsg("");
    setStatus("idle");
  };

  const analyze = async () => {
    if (!file) return;
    setStatus("analyzing");
    setErrMsg("");
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      let stats;
      if (ext === "stl") {
        setProgressMsg("Leyendo STL…");
        const tris = await parseSTL(file);
        stats = computeStats({ flatTriangles: tris });
      } else if (["step", "stp", "iges", "igs"].includes(ext)) {
        setProgressMsg(`Cargando motor CAD (primera vez ~10 MB)…`);
        const occt = await loadOcct();
        setProgressMsg(`Procesando ${ext.toUpperCase()}…`);
        const buf = new Uint8Array(await file.arrayBuffer());
        const isStep = ext === "step" || ext === "stp";
        const result = isStep ? occt.ReadStepFile(buf, null) : occt.ReadIgesFile(buf, null);
        if (!result.success) throw new Error(`No se pudo leer el ${ext.toUpperCase()}`);
        stats = computeStats({ meshes: result.meshes });
        stats.solidos = result.meshes.length;
      } else {
        throw new Error(`Formato no soportado: .${ext}. Sube STL, STEP o IGES.`);
      }

      const ext_ = file.name.split(".").pop().toUpperCase();
      const data = {
        volumen_cm3: +(stats.volume_mm3 / 1000).toFixed(2),
        ancho_mm: +stats.width.toFixed(1),
        largo_mm: +stats.length.toFixed(1),
        alto_mm: +stats.height.toFixed(1),
        notas: `${ext_}${stats.solidos ? ` · ${stats.solidos} sólido(s)` : ""} · ${stats.triCount.toLocaleString("es-ES")} triángulos`,
      };
      setExtracted(data);
      setStatus("ok");
    } catch (e) {
      console.error(e);
      setErrMsg(e.message || "Error al analizar CAD 3D");
      setStatus("error");
    } finally {
      setProgressMsg("");
    }
  };

  const aplicar = () => extracted && onApply(extracted);

  return (
    <div className="pcard pcard-cad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div className="icon-bubble">🧊</div>
        <span className="pcard-tag">Modo CAD 3D</span>
        <h2>Análisis de archivo 3D</h2>
        <div className="pcard-desc">
          Sube un STL, STEP o IGES y se calculará el volumen y las dimensiones automáticamente desde la geometría.
        </div>
      </div>

      <div
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: file ? "1px solid #fed7aa" : "2px dashed #fdba74",
          padding: file ? 8 : 18, minHeight: 110,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: "pointer", textAlign: "center", overflow: "hidden",
        }}>
        <input ref={inputRef} type="file" accept=".stl,.step,.stp,.iges,.igs"
          style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
        {file ? (
          <div>
            <div style={{ fontSize: 24, marginBottom: 4 }}>🧊</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{file.name}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 22, marginBottom: 4, color: "#f97316" }}>⬆</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Arrastra un CAD 3D</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>STL · STEP · IGES</div>
          </div>
        )}
      </div>

      <button onClick={analyze} disabled={!file || status === "analyzing"} className="btn-cta">
        {status === "analyzing" ? "ANALIZANDO…" : "ANALIZAR CAD"}
      </button>

      {status === "analyzing" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, padding: 4 }}>
          <div style={{ width: 22, height: 22, border: "2px solid #e1e5ea", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 11, color: "#64748b" }}>{progressMsg || "Procesando…"}</div>
        </div>
      )}
      {status === "error" && (
        <div style={{ padding: 10, background: "#fde8e8", color: "#a11212", borderRadius: 6, fontSize: 11 }}>
          <b>Error:</b> {errMsg}
        </div>
      )}
      {extracted && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", letterSpacing: 0.6, textTransform: "uppercase" }}>
            Datos extraídos
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <window.DatoExtraido label="Volumen" value={extracted.volumen_cm3} suffix="cm³" />
            <window.DatoExtraido label="Ancho" value={extracted.ancho_mm} suffix="mm" />
            <window.DatoExtraido label="Largo" value={extracted.largo_mm} suffix="mm" />
            <window.DatoExtraido label="Alto" value={extracted.alto_mm} suffix="mm" />
          </div>
          {extracted.notas && (
            <div style={{ padding: "8px 10px", background: "#f1f5f9", borderRadius: 6, fontSize: 11, color: "#475569", fontStyle: "italic" }}>
              {extracted.notas}
            </div>
          )}
          <button onClick={aplicar} className="btn-cta">
            APLICAR Y RECOMENDAR MÁQUINA →
          </button>
        </>
      )}
    </div>
  );
}

window.Cad3DCard = Cad3DCard;
