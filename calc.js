// Lógica de cálculo. Replica las fórmulas del Excel exactamente.
// Para cada inyectora dada un material + datos de pieza, calcula:
//  - Dosis máxima en cm³           = π * (D/2)² * carreraMax / 1000
//  - Gramos con dosis máxima       = dosisMaxCm3 * densidad
//  - Dosis real (mm) carrera       = (1273.2 * pesoInyectada) / (D² * densidad)
//  - cm³ dosis real para inyectada = π * (D/2)² * carreraReal / 1000
//  - Gramos con dosis real         = cm³ * densidad
//  - Tiempo permanencia (min)      = (D*8/carreraReal)*tCiclo/60 + ((nCav/volumen)*tCiclo)/60
//      (replica directa de la celda P9 del excel)
//  - Relación L/D (carrera/diám)   = carreraReal / D
//  - % utilización                 = carreraReal / dosisMaxHusillo

// Cálculo para un husillo específico (D en mm, carreraMax en mm). Comparte la lógica original del Excel.
function calcularHusillo(D, carreraMax, ctx) {
  const { densidad, tiempoMaxMaterial, pesoInyectada, tCiclo, volumen, nCavidades } = ctx;
  if (!D || !carreraMax || !densidad) {
    return {
      dosisMaxCm3: null, gramosDosisMax: null, carreraReal: null,
      cm3DosisReal: null, gramosDosisReal: null,
      tiempoPermanencia: null, ratioLD: null, porcentajeUtilizacion: null,
      tiempoMaxMaterial, valid: false,
    };
  }
  const dosisMaxCm3 = (Math.PI * (D / 2) ** 2 * carreraMax) / 1000;
  const gramosDosisMax = dosisMaxCm3 * densidad;
  let carreraReal = null, cm3DosisReal = null, gramosDosisReal = null;
  let tiempoPermanencia = null, ratioLD = null, porcentajeUtilizacion = null;
  if (pesoInyectada > 0) {
    carreraReal = (1273.2 * pesoInyectada) / (D * D * densidad);
    cm3DosisReal = (Math.PI * (D / 2) ** 2 * carreraReal) / 1000;
    gramosDosisReal = cm3DosisReal * densidad;
    ratioLD = carreraReal / D;
    porcentajeUtilizacion = carreraReal / carreraMax;
    if (tCiclo > 0 && carreraReal > 0) {
      const term1 = ((D * 8) / carreraReal) * tCiclo / 60;
      const term2 = volumen > 0 ? ((nCavidades / volumen) * tCiclo) / 60 : 0;
      tiempoPermanencia = term1 + term2;
    }
  }
  return {
    dosisMaxCm3, gramosDosisMax,
    carreraReal, cm3DosisReal, gramosDosisReal,
    tiempoPermanencia, ratioLD, porcentajeUtilizacion,
    tiempoMaxMaterial, valid: true,
  };
}

function calcularInyectora(maquina, ctx) {
  const res = calcularHusillo(maquina.diametroHusillo, maquina.dosisMaxHusillo, ctx);
  const { fuerzaCierreNecesaria } = ctx;
  const relacionTonelaje = (fuerzaCierreNecesaria != null && maquina.tonelaje > 0)
    ? fuerzaCierreNecesaria / maquina.tonelaje
    : null;
  return {
    ...res,
    fuerzaCierreNecesaria, tonelajeMaquina: maquina.tonelaje, relacionTonelaje,
    mode: "1K",
  };
}

// Cálculo 2K: el componente con MAYOR volumen va al husillo principal (más capacidad)
// y el menor al secundario. Si vol2 > vol1 se invierte automáticamente.
function calcularInyectora2K(maquina, c1Ctx, c2Ctx, fuerzaCierreNecesaria) {
  if (maquina.dosKa !== "SI" || !maquina.diametroHusilloSecundario) {
    return { mode: "2K", valid: false, fuerzaCierreNecesaria, tonelajeMaquina: maquina.tonelaje, relacionTonelaje: null };
  }
  const v1 = c1Ctx?.volumen || 0;
  const v2 = c2Ctx?.volumen || 0;
  const swap = v2 > v1; // si comp.2 tiene más volumen, va al principal
  const principalCtx = swap ? c2Ctx : c1Ctx;
  const secundarioCtx = swap ? c1Ctx : c2Ctx;
  const componentePrincipal = swap ? 2 : 1;
  const componenteSecundario = swap ? 1 : 2;

  const resPrincipal = calcularHusillo(maquina.diametroHusillo, maquina.dosisMaxHusillo, principalCtx);
  const resSecundario = calcularHusillo(maquina.diametroHusilloSecundario, maquina.dosisMaxHusilloSecundario, secundarioCtx);
  const relacionTonelaje = (fuerzaCierreNecesaria != null && maquina.tonelaje > 0)
    ? fuerzaCierreNecesaria / maquina.tonelaje
    : null;
  return {
    mode: "2K",
    resPrincipal, resSecundario,
    componentePrincipal, componenteSecundario,
    fuerzaCierreNecesaria, tonelajeMaquina: maquina.tonelaje, relacionTonelaje,
    valid: resPrincipal.valid && resSecundario.valid,
  };
}

// Semáforo para la relación fuerza_cierre / tonelaje
function statusTonelaje(rel) {
  if (rel == null) return "neutral";
  const p = rel * 100;
  if (p > 100) return "high";   // rojo: insuficiente, no cierra
  if (p > 90) return "warn";    // ámbar: ajustado, sin margen
  if (p >= 50) return "ok";     // verde: óptimo
  return "low";                 // azul: sobredimensionada
}

// Semáforos basados en buena práctica de moldeo por inyección.
function statusUtilizacion(pct) {
  if (pct == null) return "neutral";
  const p = pct * 100;
  if (p < 20) return "low";        // bajo (rojo): inyectada muy pequeña
  if (p < 35) return "warn";       // ámbar: aceptable pero subóptimo
  if (p <= 80) return "ok";        // verde: rango óptimo
  return "high";                   // rojo: riesgo de no completar inyectada
}

function statusPermanencia(tMin, tMax) {
  if (tMin == null || tMax == null) return "neutral";
  if (tMin <= tMax) return "ok";
  if (tMin <= tMax * 1.2) return "warn";
  return "high";
}

function statusRatioLD(r) {
  if (r == null) return "neutral";
  if (r >= 1 && r <= 3) return "ok";
  if (r >= 0.5 && r <= 4) return "warn";
  return "high";
}

// Score global para "máquina recomendada"
function scoreMaquina(res) {
  if (!res.valid || res.porcentajeUtilizacion == null) return -Infinity;
  let score = 0;
  // utilización: óptimo cerca del 50%
  const p = res.porcentajeUtilizacion * 100;
  if (p >= 35 && p <= 80) score += 50 - Math.abs(p - 55) * 0.4;
  else if (p >= 20 && p < 35) score += 20;
  else if (p > 80 && p <= 100) score += 10;
  else score -= 50;

  // permanencia
  if (res.tiempoPermanencia != null && res.tiempoMaxMaterial != null) {
    if (res.tiempoPermanencia <= res.tiempoMaxMaterial) score += 25;
    else if (res.tiempoPermanencia <= res.tiempoMaxMaterial * 1.2) score += 5;
    else score -= 30;
  }

  // L/D
  if (res.ratioLD != null) {
    if (res.ratioLD >= 1 && res.ratioLD <= 3) score += 15;
    else if (res.ratioLD >= 0.5 && res.ratioLD <= 4) score += 5;
    else score -= 15;
  }

  // Tonelaje vs fuerza de cierre necesaria
  if (res.relacionTonelaje != null) {
    const r = res.relacionTonelaje * 100;
    if (r > 100) score -= 100;            // descalifica: no puede cerrar
    else if (r >= 50 && r <= 90) score += 20; // óptimo
    else if (r > 90) score += 8;          // ajustado pero válido
    else if (r >= 30) score += 5;         // sobredimensionada
    else score -= 5;                      // muy sobredimensionada
  }
  return score;
}

// Score para 2K: evalúa los dos husillos por separado y suma con peso similar al 1K
function scoreMaquina2K(combined) {
  if (!combined || !combined.valid) return -Infinity;
  let score = 0;
  for (const res of [combined.resPrincipal, combined.resSecundario]) {
    if (!res || !res.valid || res.porcentajeUtilizacion == null) return -Infinity;
    const p = res.porcentajeUtilizacion * 100;
    if (p >= 35 && p <= 80) score += 25 - Math.abs(p - 55) * 0.2;
    else if (p >= 20 && p < 35) score += 10;
    else if (p > 80 && p <= 100) score += 5;
    else score -= 25;

    if (res.tiempoPermanencia != null && res.tiempoMaxMaterial != null) {
      if (res.tiempoPermanencia <= res.tiempoMaxMaterial) score += 12;
      else if (res.tiempoPermanencia <= res.tiempoMaxMaterial * 1.2) score += 2;
      else score -= 15;
    }

    if (res.ratioLD != null) {
      if (res.ratioLD >= 1 && res.ratioLD <= 3) score += 7;
      else if (res.ratioLD >= 0.5 && res.ratioLD <= 4) score += 2;
      else score -= 7;
    }
  }

  if (combined.relacionTonelaje != null) {
    const r = combined.relacionTonelaje * 100;
    if (r > 100) score -= 100;
    else if (r >= 50 && r <= 90) score += 20;
    else if (r > 90) score += 8;
    else if (r >= 30) score += 5;
    else score -= 5;
  }
  return score;
}

window.calcularInyectora = calcularInyectora;
window.calcularInyectora2K = calcularInyectora2K;
window.statusUtilizacion = statusUtilizacion;
window.statusPermanencia = statusPermanencia;
window.statusRatioLD = statusRatioLD;
window.statusTonelaje = statusTonelaje;
window.scoreMaquina = scoreMaquina;
window.scoreMaquina2K = scoreMaquina2K;
