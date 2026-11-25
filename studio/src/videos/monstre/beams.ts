// Faisceaux volumétriques : cône ouvert additif, plus dense près de la source, bords adoucis (angle de vue),
// poussière en mouvement et atténuation près de la caméra. Bon marché (aucun lancer de rayons).
import * as THREE from "three";

const geo = new THREE.CylinderGeometry(1, 1, 1, 48, 24, true).translate(0, -0.5, 0); // y : 0 (source) -> -1 (bout)
export class Beam {
  mesh: THREE.Mesh; mat: THREE.ShaderMaterial;
  constructor(public rEnd = 5, public rStart = 0.5, opacity = 0.3, color = "#eef3ff") {
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      uniforms: { uCol: { value: new THREE.Color(color) }, uOp: { value: opacity }, uT: { value: 0 }, uR0: { value: rStart }, uR1: { value: rEnd } },
      vertexShader: /* glsl */`
        uniform float uR0, uR1; varying float vY; varying vec3 vN, vW, vV; varying vec2 vUv;
        void main() {
          vY = -position.y; float r = mix(uR0, uR1, vY);
          vec3 p = vec3(position.x * r, position.y, position.z * r);
          vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; vUv = uv;
          vN = normalize(mat3(modelMatrix) * vec3(position.x, 0.0, position.z));
          vV = cameraPosition - w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uCol; uniform float uOp, uT; varying float vY; varying vec3 vN, vW, vV; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
        void main() {
          vec3 V = normalize(vV); float e = abs(dot(normalize(vN), V)); e = pow(e, 1.6);
          float along = pow(1.0 - vY, 1.35) * smoothstep(0.0, 0.04, vY) + 0.12 * (1.0 - vY);
          float dust = 0.72 + 0.28 * n(vec2(vUv.x * 18.0, vY * 6.0 - uT * 0.25)) + 0.15 * n(vec2(vUv.x * 60.0, vY * 25.0 + uT * 0.4));
          float near = smoothstep(1.5, 9.0, length(vV));
          float a = uOp * e * along * dust * near;
          gl_FragColor = vec4(uCol * a, a);
        }`,
    });
    this.mesh = new THREE.Mesh(geo, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 10;
  }
  /** de la source vers la cible ; len optionnelle (sinon jusqu'à la cible + 30 %) */
  place(from: THREE.Vector3, to: THREE.Vector3, len?: number) {
    const d = to.clone().sub(from), L = len ?? d.length() * 1.3;
    this.mesh.position.copy(from); this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.normalize()); this.mesh.scale.set(1, L, 1);
    const k = (len ?? d.length() * 1.3) / Math.max(1e-3, to.clone().sub(from).length()); this.mat.uniforms.uR1.value = this.rEnd * k;
  }
  set(t: number, op?: number) { this.mat.uniforms.uT.value = t; if (op !== undefined) this.mat.uniforms.uOp.value = op; }
}
