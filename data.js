// Datos actualizados desde INYECCION_PROCESOS_MAQUINAS_WALTER_PACK_GROUP_HUB.xlsx (2026-05).
// Las máquinas 2K incluyen husillo principal y secundario.

// presionEspecifica = presión específica de inyección/cierre en kgf/cm² (promedio del Excel).
// Se usa en la fórmula de fuerza de cierre:
//   F (Tm) = ((Sup_pieza × nCav + Sup_colada) / 100) × P × coef_seguridad / 1000
//
// Para cálculo de tiempo de refrigeración (Excel "Cálculo Tiempo Refrigeración"):
//   calorEspecifico Cp en cal·g/°C
//   conductividadTermica K en cal/(cm·s·°C)
//   tempResina T1 en °C  (típica de inyección)
//   tempMolde T2 en °C   (típica del molde)
//   tempDistorsion T'2 en °C  (HDT, hasta donde tiene que enfriar la pieza para desmoldear)
//   α = K / (ρ · Cp)
//   t_refrig = (s²/(π²·α)) · ln( (4/π) · (T1-T2)/(T'2-T2) )
const MATERIALES = [
  { material: "ABS",            tiempoMax: 6,  densidad: 0.92, presionEspecifica: 504,   calorEspecifico: 0.40, conductividadTermica: 6.25e-4, tempResina: 220, tempMolde: 70, tempDistorsion: 82.5 },
  { material: "PC",             tiempoMax: 7,  densidad: 1.04, presionEspecifica: 620,   calorEspecifico: 0.30, conductividadTermica: 4.60e-4, tempResina: 300, tempMolde: 80, tempDistorsion: 135 },
  { material: "ABS-PC",         tiempoMax: 6,  densidad: 1.10, presionEspecifica: 562,   calorEspecifico: 0.35, conductividadTermica: 5.40e-4, tempResina: 260, tempMolde: 75, tempDistorsion: 110 },
  { material: "PMMA",           tiempoMax: 8,  densidad: 1.19, presionEspecifica: 465,   calorEspecifico: 0.35, conductividadTermica: 5.00e-4, tempResina: 225, tempMolde: 80, tempDistorsion: 105 },
  { material: "PBT",            tiempoMax: 2,  densidad: 1.07, presionEspecifica: 542.5, calorEspecifico: 0.30, conductividadTermica: 6.50e-4, tempResina: 240, tempMolde: 80, tempDistorsion: 80 },
  { material: "PS",             tiempoMax: 5,  densidad: 0.92, presionEspecifica: 232.5, calorEspecifico: 0.35, conductividadTermica: 2.00e-4, tempResina: 230, tempMolde: 30, tempDistorsion: 99 },
  { material: "PP",             tiempoMax: 25, densidad: 0.73, presionEspecifica: 310.5, calorEspecifico: 0.46, conductividadTermica: 3.00e-4, tempResina: 190, tempMolde: 30, tempDistorsion: 56 },
  { material: "TPE",            tiempoMax: 15, densidad: 0.70, presionEspecifica: 232.5, calorEspecifico: 0.45, conductividadTermica: 2.50e-4, tempResina: 200, tempMolde: 30, tempDistorsion: 60 },
  { material: "PA6",            tiempoMax: 4,  densidad: 1.13, presionEspecifica: 697.5, calorEspecifico: 0.40, conductividadTermica: 5.85e-4, tempResina: 250, tempMolde: 80, tempDistorsion: 70 },
  { material: "PA6 + FV 30%",   tiempoMax: 4,  densidad: 1.36, presionEspecifica: 800,   calorEspecifico: 0.40, conductividadTermica: 5.85e-4, tempResina: 260, tempMolde: 80, tempDistorsion: 100 },
  { material: "PA66",           tiempoMax: 4,  densidad: 1.14, presionEspecifica: 697.5, calorEspecifico: 0.40, conductividadTermica: 5.85e-4, tempResina: 280, tempMolde: 80, tempDistorsion: 85 },
  { material: "PA66 + FV 50%",  tiempoMax: 4,  densidad: 1.57, presionEspecifica: 950,   calorEspecifico: 0.40, conductividadTermica: 5.85e-4, tempResina: 285, tempMolde: 90, tempDistorsion: 110 },
  { material: "PA12",           tiempoMax: 13, densidad: 1.01, presionEspecifica: 600,   calorEspecifico: 0.40, conductividadTermica: 5.50e-4, tempResina: 240, tempMolde: 80, tempDistorsion: 55 },
];

// Schema:
//   Para 1K:    diametroHusillo + dosisMaxHusillo (husillo único)
//   Para 2K:    los anteriores son del PRINCIPAL,
//               + diametroHusilloSecundario + dosisMaxHusilloSecundario
const INYECTORAS = [
  // BARCELONA · SALA BLANCA
  { ubicacion: "BARCELONA", maquina: "CONCEPT (INY 21) 420/810-1450", celula: "SALA BLANCA", marca: "DEMAG", tonelaje: 420, dosKa: "NO", diametroHusillo: 60, dosisMaxHusillo: 184 },
  { ubicacion: "BARCELONA", maquina: "720S (INY 24) 3200-1300/290", celula: "SALA BLANCA", marca: "ARBURG", tonelaje: 320, dosKa: "SI", diametroHusillo: 60, dosisMaxHusillo: 230, diametroHusilloSecundario: 40, dosisMaxHusilloSecundario: 144 },
  { ubicacion: "BARCELONA", maquina: "920 S (INY 30) 5500-1300", celula: "SALA BLANCA", marca: "ARBURG", tonelaje: 550, dosKa: "NO", diametroHusillo: 55, dosisMaxHusillo: 227 },
  { ubicacion: "BARCELONA", maquina: "VICTORY (INY 31) 200H/200L/180 combi", celula: "SALA BLANCA", marca: "ENGEL", tonelaje: 180, dosKa: "SI", diametroHusillo: 22, dosisMaxHusillo: 140, diametroHusilloSecundario: 22, dosisMaxHusilloSecundario: 126 },
  // INY-37: dos husillos principales (Ø70 y Ø45) intercambiables para evitar contaminación de color.
  // Se listan como dos entradas separadas; en producción solo se usa una de las dos a la vez.
  { ubicacion: "BARCELONA", maquina: "ENGEL ES (INY-37) · Husillo Ø70", celula: "SALA BLANCA", marca: "ENGEL", tonelaje: 1150, dosKa: "SI", diametroHusillo: 70, dosisMaxHusillo: 315, diametroHusilloSecundario: 40, dosisMaxHusilloSecundario: 158 },
  { ubicacion: "BARCELONA", maquina: "ENGEL ES (INY-37) · Husillo Ø45", celula: "SALA BLANCA", marca: "ENGEL", tonelaje: 1150, dosKa: "SI", diametroHusillo: 45, dosisMaxHusillo: 200, diametroHusilloSecundario: 40, dosisMaxHusilloSecundario: 158 },

  // BARCELONA · NO SALA BLANCA
  { ubicacion: "BARCELONA", maquina: "420 C 1000-290 (INY-01)", celula: "NO SALA BLANCA", marca: "ARBURG", tonelaje: 100, dosKa: "NO", diametroHusillo: 35, dosisMaxHusillo: 150 },
  { ubicacion: "BARCELONA", maquina: "420 C 1000-290 (INY-02)", celula: "NO SALA BLANCA", marca: "ARBURG", tonelaje: 100, dosKa: "NO", diametroHusillo: 35, dosisMaxHusillo: 135 },
  { ubicacion: "BARCELONA", maquina: "650-2700 C1 (INY-20)", celula: "NO SALA BLANCA", marca: "KRAUSS MAFFEIS", tonelaje: 350, dosKa: "NO", diametroHusillo: 80, dosisMaxHusillo: 278.5 },
  { ubicacion: "BARCELONA", maquina: "CONCEPT (INY-21) 420/810-1450", celula: "NO SALA BLANCA", marca: "DEMAG", tonelaje: 420, dosKa: "NO", diametroHusillo: 60, dosisMaxHusillo: 184 },
  { ubicacion: "BARCELONA", maquina: "ENGEL VICTORY (INY-25) 1800H/750W/500 COMBI", celula: "NO SALA BLANCA", marca: "ENGEL", tonelaje: 500, dosKa: "SI", diametroHusillo: 60, dosisMaxHusillo: 265, diametroHusilloSecundario: 50, dosisMaxHusilloSecundario: 200 },
  { ubicacion: "BARCELONA", maquina: "720S (INY-26) 3200-800", celula: "NO SALA BLANCA", marca: "ARBURG", tonelaje: 320, dosKa: "NO", diametroHusillo: 45, dosisMaxHusillo: 195 },
  { ubicacion: "BARCELONA", maquina: "VICTORY (INY-27) 1060/350 TECH", celula: "NO SALA BLANCA", marca: "ENGEL", tonelaje: 350, dosKa: "NO", diametroHusillo: 55, dosisMaxHusillo: 210.5 },
  { ubicacion: "BARCELONA", maquina: "VICTORY (INY-28) 1060/350 TECH", celula: "NO SALA BLANCA", marca: "ENGEL", tonelaje: 350, dosKa: "NO", diametroHusillo: 55, dosisMaxHusillo: 210.5 },
  { ubicacion: "BARCELONA", maquina: "570 C (INY-29) 2000-800", celula: "NO SALA BLANCA", marca: "ARBURG", tonelaje: 200, dosKa: "NO", diametroHusillo: 50, dosisMaxHusillo: 165 },
  { ubicacion: "BARCELONA", maquina: "ECOPOWER (INY-32) 110/130 UNILOG", celula: "NO SALA BLANCA", marca: "BATTENFELD", tonelaje: 110, dosKa: "NO", diametroHusillo: 25, dosisMaxHusillo: 125.08 },
  { ubicacion: "BARCELONA", maquina: "TM 650/4500 (INY-33)", celula: "NO SALA BLANCA", marca: "BATTENFELD", tonelaje: 650, dosKa: "NO", diametroHusillo: 85, dosisMaxHusillo: 425.1 },
  { ubicacion: "BARCELONA", maquina: "ES 5550/600 (INY-34)", celula: "NO SALA BLANCA", marca: "ENGEL", tonelaje: 500, dosKa: "NO", diametroHusillo: 70, dosisMaxHusillo: 415.75 },
  { ubicacion: "BARCELONA", maquina: "ENGEL ES (INY-35) 2050/500 HL", celula: "NO SALA BLANCA", marca: "ENGEL", tonelaje: 500, dosKa: "NO", diametroHusillo: 60, dosisMaxHusillo: 300 },
  { ubicacion: "BARCELONA", maquina: "ENGEL ES (INY-36) 1350/300 HL", celula: "NO SALA BLANCA", marca: "ENGEL", tonelaje: 300, dosKa: "NO", diametroHusillo: 60, dosisMaxHusillo: 300 },

  // IGORRE · SALA BLANCA
  { ubicacion: "IGORRE", maquina: "ALLROUNDER 570 E", celula: "SALA BLANCA", marca: "ARBURG", tonelaje: 200, dosKa: "NO", diametroHusillo: 45, dosisMaxHusillo: 200 },
  { ubicacion: "IGORRE", maquina: "720S-3200-1300/173", celula: "SALA BLANCA", marca: "ARBURG", tonelaje: 320, dosKa: "SI", diametroHusillo: 60, dosisMaxHusillo: 240, diametroHusilloSecundario: 30, dosisMaxHusilloSecundario: 115 },

  // MEXICO · SALA BLANCA
  { ubicacion: "MEXICO", maquina: "470 S 1100-400 / 290", celula: "SALA BLANCA", marca: "ARBURG", tonelaje: 110, dosKa: "SI", diametroHusillo: 40, dosisMaxHusillo: 160, diametroHusilloSecundario: 35, dosisMaxHusilloSecundario: 150 },
  { ubicacion: "MEXICO", maquina: "MTS-400 A 2290", celula: "SALA BLANCA", marca: "MILACRON", tonelaje: 350, dosKa: "SI", diametroHusillo: 60, dosisMaxHusillo: 320, diametroHusilloSecundario: 32, dosisMaxHusilloSecundario: 132 },
  { ubicacion: "MEXICO", maquina: "ENGEL 900 (1)", celula: "SALA BLANCA", marca: "ENGEL", tonelaje: 900, dosKa: "NO", diametroHusillo: 55, dosisMaxHusillo: 220 },
  { ubicacion: "MEXICO", maquina: "ENGEL 900 (2)", celula: "SALA BLANCA", marca: "ENGEL", tonelaje: 900, dosKa: "NO", diametroHusillo: 55, dosisMaxHusillo: 220 },

  // ALICANTE · NO SALA BLANCA
  { ubicacion: "ALICANTE", maquina: "INY 0.1", celula: "NO SALA BLANCA", marca: "HAITIAN", tonelaje: 120, dosKa: "NO", diametroHusillo: 36, dosisMaxHusillo: 171 },
  { ubicacion: "ALICANTE", maquina: "INY 0.2", celula: "NO SALA BLANCA", marca: "HAITIAN", tonelaje: 320, dosKa: "NO", diametroHusillo: 70, dosisMaxHusillo: 280 },
  { ubicacion: "ALICANTE", maquina: "INY 0.3", celula: "NO SALA BLANCA", marca: "ENGEL", tonelaje: 500, dosKa: "NO", diametroHusillo: 90, dosisMaxHusillo: 390 },
  { ubicacion: "ALICANTE", maquina: "INY 0.4", celula: "NO SALA BLANCA", marca: "DEMAG", tonelaje: 330, dosKa: "NO", diametroHusillo: 80, dosisMaxHusillo: 315 },
  { ubicacion: "ALICANTE", maquina: "INY 0.5", celula: "NO SALA BLANCA", marca: "BOSSI", tonelaje: 130, dosKa: "NO", diametroHusillo: 40, dosisMaxHusillo: 167 },
];

const UBICACIONES = [...new Set(INYECTORAS.map(i => i.ubicacion))];
const CELULAS = ["SALA BLANCA", "NO SALA BLANCA"];

window.MATERIALES = MATERIALES;
window.INYECTORAS = INYECTORAS;
window.UBICACIONES = UBICACIONES;
window.CELULAS = CELULAS;
