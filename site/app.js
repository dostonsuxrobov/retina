import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { SVGRenderer } from 'three/addons/renderers/SVGRenderer.js';
import { validateShed, buildShed } from './shed.js?v=1';

const example = {
  schema: 'retina.blueprint/v1',
  name: 'Four-hole mounting plate',
  units: 'mm',
  body: { type: 'plate', width: 120, height: 80, thickness: 8, corner_radius: 6 },
  features: [
    { type: 'through_hole', x: -45, y: -25, diameter: 8 },
    { type: 'through_hole', x: 45, y: -25, diameter: 8 },
    { type: 'through_hole', x: 45, y: 25, diameter: 8 },
    { type: 'through_hole', x: -45, y: 25, diameter: 8 },
  ],
  evidence: {
    observed: ['flat rectangular outline', 'four circular holes'],
    inferred: ['plate thickness is 8 mm', 'corner radius is 6 mm'],
    unknown: ['material', 'exact dimensions unless supplied'],
  },
};

const textarea = document.querySelector('#blueprint');
const validation = document.querySelector('#validation');
const viewport = document.querySelector('#viewport');
const modelName = document.querySelector('#model-name');
const fileName = document.querySelector('#file-name');
const bodySummary = document.querySelector('#body-summary');
const featureSummary = document.querySelector('#feature-summary');
const inferenceSummary = document.querySelector('#inference-summary');
const buildButton = document.querySelector('#build-button');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#edf1f0');
scene.fog = new THREE.Fog('#edf1f0', 280, 900);
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 2000);
camera.up.set(0, 0, 1);
let renderer;
let usingVectorFallback = false;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
} catch {
  // Some browsers and remote previews do not expose WebGL; SVGRenderer still gives an orbitable preview.
  renderer = new SVGRenderer();
  usingVectorFallback = true;
  renderer.setQuality('high');
  document.querySelector('.topbar-center').lastChild.textContent = ' Vector preview · WebGL unavailable';
}
viewport.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 45;
controls.maxDistance = 650;

scene.add(new THREE.HemisphereLight('#ffffff', '#8e9b99', 2.1));
const keyLight = new THREE.DirectionalLight('#ffffff', 3.1);
keyLight.position.set(-90, 130, 160);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight('#c5e7dc', 1.4);
fillLight.position.set(120, -40, 60);
scene.add(fillLight);

const grid = new THREE.GridHelper(500, 50, '#c2cbc8', '#dce2df');
grid.rotation.x = Math.PI / 2;
grid.position.z = -0.2;
for (const material of Array.isArray(grid.material) ? grid.material : [grid.material]) {
  material.transparent = true;
  material.opacity = 0.18;
  material.depthWrite = false;
}
scene.add(grid);

const modelRoot = new THREE.Group();
scene.add(modelRoot);
let modelSize = new THREE.Vector3(120, 80, 8);

function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

new ResizeObserver(resize).observe(viewport);
window.addEventListener('resize', resize);

function roundedRectangle(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function validateBlueprint(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The file must contain a JSON object.');
  if (['retina.shed/v1', 'retina.shed/proposed-v1'].includes(value.schema)) return validateShed(value);
  if (value.schema !== 'retina.blueprint/v1') throw new Error('Use schema "retina.blueprint/v1".');
  if (value.units !== 'mm') throw new Error('This prototype expects dimensions in millimetres ("mm").');
  if (!value.body || value.body.type !== 'plate') throw new Error('This first prototype supports a plate body.');
  const { width, height, thickness, corner_radius: radius = 0 } = value.body;
  for (const [label, n] of Object.entries({ width, height, thickness, corner_radius: radius })) {
    if (!Number.isFinite(n) || n < 0 || ((label === 'width' || label === 'height' || label === 'thickness') && n === 0)) {
      throw new Error(`"${label}" must be a ${label === 'corner_radius' ? 'non-negative' : 'positive'} number.`);
    }
  }
  if (radius * 2 > Math.min(width, height)) throw new Error('Corner radius is too large for this plate.');
  if (value.features !== undefined && !Array.isArray(value.features)) throw new Error('"features" must be an array.');
  const features = value.features ?? [];
  for (const [index, feature] of features.entries()) {
    if (feature?.type !== 'through_hole') throw new Error(`Feature ${index + 1}: only "through_hole" is supported so far.`);
    if (![feature.x, feature.y, feature.diameter].every(Number.isFinite) || feature.diameter <= 0) {
      throw new Error(`Feature ${index + 1}: x, y, and a positive diameter are required.`);
    }
    const edgeGapX = width / 2 - Math.abs(feature.x) - feature.diameter / 2;
    const edgeGapY = height / 2 - Math.abs(feature.y) - feature.diameter / 2;
    if (edgeGapX < 0 || edgeGapY < 0) throw new Error(`Feature ${index + 1}: the hole extends beyond the plate edge.`);
    if (Math.abs(feature.x) > width / 2 - radius || Math.abs(feature.y) > height / 2 - radius) {
      throw new Error(`Feature ${index + 1}: place the hole within the rounded plate corners.`);
    }
  }
  return { ...value, features };
}

function rounded(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

function buildGeometry(blueprint) {
  modelRoot.traverse(obj => {
    obj.geometry?.dispose();
    for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) material?.dispose();
  });
  modelRoot.clear();
  if (blueprint.body.type === 'shed') {
    modelRoot.add(buildShed(blueprint));
    new THREE.Box3().setFromObject(modelRoot).getSize(modelSize);
    modelName.textContent = blueprint.name || 'Garden shed';
    bodySummary.textContent = `${rounded(blueprint.body.width)} × ${rounded(blueprint.body.depth)} × ${rounded(blueprint.body.wall_height + blueprint.roof.rise)} mm (ridge)`;
    featureSummary.textContent = `${blueprint.openings.length} openings · ${blueprint.details.length} details`;
    const inferred = blueprint.evidence?.inferred ?? [];
    inferenceSummary.textContent = inferred.length ? inferred.join(' · ') : 'None specified';
    inferenceSummary.title = inferred.join('\n');
    frameModel();
    return;
  }
  const { width, height, thickness, corner_radius: radius = 0 } = blueprint.body;
  const shape = roundedRectangle(width, height, radius);
  for (const hole of blueprint.features) {
    const holePath = new THREE.Path();
    holePath.absellipse(hole.x, hole.y, hole.diameter / 2, hole.diameter / 2, 0, Math.PI * 2, true, 0);
    shape.holes.push(holePath);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 32,
    steps: 1,
  });
  geometry.translate(0, 0, -thickness / 2);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(blueprint.appearance?.color ?? '#789a8e'),
    metalness: 0.24,
    roughness: 0.38,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = blueprint.name || 'Retina plate';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  modelRoot.add(mesh);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 24),
    new THREE.LineBasicMaterial({ color: '#4e6961', transparent: true, opacity: 0.34 }),
  );
  modelRoot.add(edges);

  modelSize.set(width, height, thickness);
  modelName.textContent = blueprint.name || 'Untitled plate';
  bodySummary.textContent = `${rounded(width)} × ${rounded(height)} × ${rounded(thickness)} mm`;
  featureSummary.textContent = `${blueprint.features.length} through-hole${blueprint.features.length === 1 ? '' : 's'}`;
  const inferred = blueprint.evidence?.inferred ?? [];
  inferenceSummary.textContent = inferred.length ? inferred.join(' · ') : 'None specified';
  inferenceSummary.title = inferred.join('\n');
  frameModel();
}

function frameModel() {
  const max = Math.max(modelSize.x, modelSize.y, modelSize.z);
  const distance = (max / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.75;
  const bounds = new THREE.Box3().setFromObject(modelRoot);
  const center = bounds.getCenter(new THREE.Vector3());
  camera.position.set(center.x + distance * 0.83, center.y - distance * 0.9, center.z + distance * 0.75);
  camera.near = Math.max(0.1, distance / 1000);
  camera.far = distance * 10;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  scene.fog.near = distance * 2;
  scene.fog.far = distance * 6;
  grid.scale.setScalar(max / 150);
  grid.position.z = bounds.min.z - max * 0.01;
  controls.minDistance = Math.max(10, max * 0.65);
  controls.maxDistance = max * 12;
  controls.update();
}

function setMessage(message, error = false) {
  validation.textContent = message;
  validation.classList.toggle('error', error);
}

function parseAndBuild() {
  try {
    const blueprint = validateBlueprint(JSON.parse(textarea.value));
    buildGeometry(blueprint);
    setMessage('Blueprint valid · preview updated');
    return blueprint;
  } catch (error) {
    setMessage(error instanceof SyntaxError ? 'Invalid JSON · check commas and quotes' : error.message, true);
    return null;
  }
}

function download(data, name, mimeType) {
  const url = URL.createObjectURL(new Blob([data], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function safeFilename(value, extension) {
  const base = (value || 'retina-model').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'retina-model';
  return `${base}.${extension}`;
}

textarea.value = JSON.stringify(example, null, 2);
buildGeometry(validateBlueprint(example));
resize();

document.querySelector('#example-button').addEventListener('click', () => {
  textarea.value = JSON.stringify(example, null, 2);
  fileName.textContent = 'mounting-plate.json';
  parseAndBuild();
});

buildButton.addEventListener('click', parseAndBuild);
textarea.addEventListener('input', () => setMessage('Blueprint changed · build preview to apply'));

document.querySelector('#file-input').addEventListener('change', async (event) => {
  const [file] = event.target.files ?? [];
  if (!file) return;
  try {
    textarea.value = await file.text();
    fileName.textContent = file.name;
    parseAndBuild();
  } catch {
    setMessage('Could not read that file.', true);
  }
  event.target.value = '';
});

document.querySelector('#download-json').addEventListener('click', () => {
  const blueprint = parseAndBuild();
  if (!blueprint) return;
  download(JSON.stringify(blueprint, null, 2), safeFilename(blueprint.name, 'json'), 'application/json');
});

document.querySelector('#export-glb').addEventListener('click', () => {
  const blueprint = parseAndBuild();
  if (!blueprint) return;
  const exportRoot = modelRoot.clone(true);
  // Blueprint dimensions are authored in millimetres; glTF scene units are metres.
  exportRoot.scale.setScalar(0.001);
  // The workbench uses Z-up; glTF uses Y-up.
  exportRoot.rotation.x = -Math.PI / 2;
  new GLTFExporter().parse(exportRoot, (result) => {
    download(result, safeFilename(blueprint.name, 'glb'), 'model/gltf-binary');
  }, (error) => setMessage(`GLB export failed: ${error.message}`, true), { binary: true });
});

document.querySelector('#reset-view').addEventListener('click', frameModel);

function animate() {
  controls.update();
  renderer.render(scene, camera);
  if (usingVectorFallback) requestAnimationFrame(animate);
}
if (usingVectorFallback) requestAnimationFrame(animate);
else renderer.setAnimationLoop(animate);
