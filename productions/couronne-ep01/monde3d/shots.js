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
