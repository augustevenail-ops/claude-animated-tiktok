// Caméras des plans : chaque plan regarde la même carte sous un angle différent (décor de film).
export const SHOTS = {
  d05a_drone_district:  { pos: [60, 120, 380], look: [0, 0, 280], fov: 60 },                // plan 5 : drone au-dessus d'un district
  d05b_zone_large:      { pos: [0, 900, 1250], look: [0, 0, 0], fov: 50, fog: [0x0b1418, 0.00015] },                  // plan 6 : recul, toute la zone
  d05c_travers_champ:   { pos: [0, 150, 548], look: [0, 70, 0], fov: 65 },                  // plan 7 : à reculons à travers le champ
  r01_regle1_mur:       { pos: [-19, 3.5, 321], look: [-17, 9, 295], fov: 62, sign: "r1" },   // plan 9 : règle 1 sur un mur de district
  o10_dehors:           { pos: [0, 1.6, 640], look: [0, 1.2, 560], fov: 60, fog: [0x7a7238, 0.006], bg: 0x5a5428 },  // plan 10 : dehors, gaz
  s13_rue_matin:        { pos: [17, 1.7, 330], look: [17, 6, 150], fov: 55 },               // plan 13 : rue de district vers le centre
  s14_rue_escorte:      { pos: [-17, 1.7, -300], look: [-17, 5, -150], fov: 55 },           // plan 14
  s15_rue_proche:       { pos: [51, 1.7, 240], look: [51, 3, 200], fov: 50 },               // plan 15
  s16_rue_angle:        { pos: [17, 1.7, 260], look: [60, 5, 230], fov: 55 },               // plan 16
  s18_centre_avenue:    { pos: [104, 1.7, 3], look: [0, 40, 0], fov: 60 },                  // plan 18 : dans le centre, face aux tours
  d19_drone_centre:     { pos: [118, 48, 4], look: [-60, 38, 0], fov: 62 },                 // plan 19 : drone entre les tours
  d20_drone_approche:   { pos: [6, 46, 175], look: [0, 40, 61], fov: 52, sign: "r2" },      // plan 20 : le drone arrive face à la tour
  r21_regle2_1m:        { pos: [0, 39.85, 62.1], look: [0, 39.85, 61], fov: 85, sign: "r2" },     // plan 21 : règle 2 à 1 m, face pleine
  w22_le_mur:           { pos: [22, 3.2, 166], look: [-4, 11, 136], fov: 66 },              // plan 22 : le second mur
  h08_holo:             { pos: [0, 820, 1250], look: [0, -60, 40], fov: 46, holo: "08" },     // plan 8 : hologramme de la carte
  h27_holo:             { pos: [0, 820, 1250], look: [0, -60, 40], fov: 46, holo: "27" },     // plan 27 : hologramme, champ rétracté sur le centre
};

// trajectoires animées (vidéo 30 i/s) : path = points caméra, looks = points visés ou ahead = regarde devant soi (FPV)
Object.assign(SHOTS.d05a_drone_district, { path: [[90, 120, 480], [40, 55, 410], [17, 18, 355], [17, 11, 300], [17, 10.5, 240]], ahead: true, pitch: 6, ease: "lin", roll: 0.05, bank: 0.25, fov: 70, shake: 0.08 });
Object.assign(SHOTS.d05b_zone_large, { path: [[17, 11, 235], [15, 120, 420], [0, 900, 1250]], looks: [[17, 8, 150], [8, 20, 120], [0, 0, 0]], ease: "out", roll: 0.02 });
Object.assign(SHOTS.d05c_travers_champ, { path: [[0, 110, 440], [0, 135, 525], [0, 160, 640]], looks: [[0, 60, 0], [0, 70, 0]], ease: "inout", roll: 0.03 });
Object.assign(SHOTS.h08_holo, { path: [[-520, 760, 1180], [-60, 520, 860], [520, 820, 1220]], looks: [[0, -60, 40], [0, 30, 0], [0, -60, 40]], ease: "inout", shake: 0 });
Object.assign(SHOTS.r01_regle1_mur, { path: [[-17, 9, 430], [-18, 5.5, 360], [-19, 3.5, 321]], looks: [[-17, 8, 295], [-17, 9, 295]], ease: "out", signOn: [0.35, 0.6], roll: 0.02 });
Object.assign(SHOTS.o10_dehors, { path: [[0, 2.2, 585], [0, 1.6, 655]], looks: [[0, 6, 520], [0, 3, 540]], ease: "lin", roll: 0.03, shake: 0.06 });
Object.assign(SHOTS.s13_rue_matin, { path: [[17, 1.75, 336], [17, 1.7, 327]], looks: [[17, 6, 156], [17, 6, 147]], ease: "lin" });
Object.assign(SHOTS.s14_rue_escorte, { path: [[-19, 1.7, -300], [-15.5, 1.7, -300]], looks: [[-18, 5, -150], [-16, 5, -150]], ease: "lin" });
Object.assign(SHOTS.s15_rue_proche, { path: [[51, 1.7, 243], [51, 1.7, 238]], ease: "lin" });
Object.assign(SHOTS.s16_rue_angle, { path: [[15, 1.7, 263], [19, 1.8, 256]], looks: [[58, 5, 232], [62, 5, 228]], ease: "lin" });
Object.assign(SHOTS.s18_centre_avenue, { path: [[108, 1.6, 4], [100, 1.9, 3]], looks: [[0, 34, 0], [0, 48, 0]], ease: "lin" });
Object.assign(SHOTS.d19_drone_centre, { path: [[122, 52, 0], [85, 44, 5], [58, 47, -4], [40, 42, 0]], ahead: true, pitch: 4, ease: "lin", roll: 0.05, bank: -0.2, fov: 68, shake: 0.08 });
Object.assign(SHOTS.d20_drone_approche, { path: [[8, 48, 180], [2, 42, 120], [0, 40.5, 85]], looks: [[0, 40, 61], [0, 40, 61]], ease: "out", roll: 0.03 });
Object.assign(SHOTS.r21_regle2_1m, { path: [[0, 39.85, 62.45], [0, 39.85, 62.08]], ease: "out", sign2On: [0.02, 0.22], shake: 0.004 });
Object.assign(SHOTS.w22_le_mur, { path: [[18.5, 3, 167], [16, 14, 162], [12, 36, 156]], looks: [[-4, 11, 136], [-6, 22, 120], [-10, 34, 40]], ease: "inout", roll: 0.03 });
Object.assign(SHOTS.h27_holo, { path: [[460, 820, 1240], [-380, 700, 1120]], looks: [[0, -60, 40], [0, -20, 20]], ease: "inout", shake: 0 });

// v7 : plan 6 (drone vers la fenêtre du Conseil, tour centrale), plan 10 (vue aérienne du désert irradié), dézoom final des hologrammes
SHOTS.d06_conseil = { path: [[150, 130, 44], [82, 108, 14], [40, 98.5, 1], [22.75, 97.5, 0]], looks: [[15, 97.5, 0], [15, 97.5, 0]], ease: "in", fov: 60, roll: 0.04, bank: 0.12, shake: 0.05 };
SHOTS.o10_aerien = { path: [[0, 2.2, 588], [0, 45, 700], [120, 520, 1500], [420, 1750, 3300]], looks: [[0, 35, 440], [0, 70, 250], [0, 0, 0], [0, 0, 0]], ease: "inout", fov: 62, roll: 0.02, shake: 0.03,
  outside: true, near: 0.5, fogs: [0x5e5c2a, 0.0045, 0.00011], bg: 0x4a4a24 };
SHOTS.h08_holo.pull = [0.62, 1.75];
SHOTS.h27_holo.pull = [0.62, 1.95];
