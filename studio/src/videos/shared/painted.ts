// Texture peinte procédurale en espace monde (aucun UV requis) injectée dans les matériaux Lambert à deux tons (voir bridge/shade.ts).
// amp = force des taches, sc = taille (1/m), grad = assombrissement vers le bas (hauteur 0..12 m), bands = bandes horizontales.
import * as THREE from "three";
const NOISE_GLSL = `varying vec3 vWP;
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }`;
export const painted = (m: THREE.Material, amp: number, sc: number, grad: number, bands = 0) => {
  const prev = m.onBeforeCompile.bind(m);
  m.onBeforeCompile = (sh, r) => {
    prev(sh, r);
    sh.vertexShader = "varying vec3 vWP;\n" + sh.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = NOISE_GLSL + "\n" + sh.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      { float n = 0.6 * vn(vWP * ${sc.toFixed(3)}) + 0.4 * vn(vWP * ${(sc * 3.1).toFixed(3)});
        diffuseColor.rgb *= mix(1.0 - ${amp.toFixed(3)}, 1.0 + ${(amp * 0.6).toFixed(3)}, n) * mix(1.0 - ${grad.toFixed(3)}, 1.08, smoothstep(0.0, 12.0, vWP.y))
        * (1.0 - ${bands.toFixed(3)} * smoothstep(0.55, 0.95, fract(vWP.y * 0.85 + 0.3 * n))); }`);
  };
  m.customProgramCacheKey = () => `painted_${amp}_${sc}_${grad}_${bands}`;
  m.needsUpdate = true;
};
