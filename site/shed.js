import * as THREE from 'three';

const positive = (n) => Number.isFinite(n) && n > 0;
function wallTop(bp, wall, center = 0, width = 0) {
  const b = bp.body, r = bp.roof;
  if (r.type !== 'mono_pitch') return b.wall_height;
  const sign = r.high_side === 'right' ? 1 : -1;
  if (wall === 'right' || wall === 'left') return b.wall_height + ((wall === r.high_side) ? r.rise : 0);
  return b.wall_height + r.rise * (0.5 + sign * center / b.width - width / (2 * b.width));
}
const color = (s) => typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s);

export function validateShed(value) {
  if (value.units !== 'mm') throw new Error('Shed dimensions must use "mm".');
  if (value.body?.type !== 'shed') throw new Error('A shed body is required.');
  const b = value.body;
  for (const key of ['width', 'depth', 'wall_height', 'wall_thickness', 'floor_thickness']) {
    if (!positive(b[key]) || b[key] > 100000) throw new Error(`Shed ${key} must be positive and at most 100000 mm.`);
  }
  if (b.wall_thickness * 2 >= Math.min(b.width, b.depth)) throw new Error('Wall thickness leaves no interior space.');
  if (b.floor_thickness >= b.wall_height) throw new Error('Floor thickness must be below wall height.');
  const r = value.roof;
  if (!['gable', 'mono_pitch'].includes(r?.type) || (r.type === 'gable' && r.ridge_axis !== 'y') || (r.type === 'mono_pitch' && (r.slope_axis !== 'x' || !['left', 'right'].includes(r.high_side)))) throw new Error('Use a gable roof along Y, or mono_pitch across X with high_side left/right.');
  if (r.fascia_color !== undefined && !color(r.fascia_color)) throw new Error('Roof fascia_color must be a hex color.');
  for (const key of ['rise', 'thickness']) if (!positive(r[key]) || r[key] > 100000) throw new Error(`Roof ${key} must be positive and at most 100000 mm.`);
  if (!Number.isFinite(r.overhang) || r.overhang < 0 || r.overhang > 10000) throw new Error('Roof overhang must be between 0 and 10000 mm.');
  if (!['vertical_panel_siding', 'horizontal_panel_siding'].includes(value.walls?.style) || !positive(value.walls.panel_spacing) || b.width / value.walls.panel_spacing > 200 || b.depth / value.walls.panel_spacing > 200 || (b.wall_height + r.rise) / value.walls.panel_spacing > 200) throw new Error('Use vertical or horizontal panel siding with a positive spacing and at most 200 panels per wall.');
  if (!positive(value.trim?.width) || !positive(value.trim?.depth)) throw new Error('Positive trim width and depth are required.');
  for (const s of [r.color, value.walls.color, value.trim.color]) if (!color(s)) throw new Error('Roof, walls, and trim need six-digit hex colors.');
  if (!Array.isArray(value.openings) || value.openings.length > 32) throw new Error('Provide at most 32 openings.');
  const ids = new Set();
  for (const o of value.openings) {
    if (typeof o.id !== 'string' || ids.has(o.id)) throw new Error('Each opening needs a unique string id.');
    ids.add(o.id);
    if (!['front', 'rear', 'right', 'left'].includes(o.wall) || !['window', 'single_door', 'double_door'].includes(o.type)) throw new Error(`Unsupported opening ${o.id}.`);
    const span = ['front', 'rear'].includes(o.wall) ? b.width : b.depth;
    if (!positive(o.width) || !positive(o.height) || !Number.isFinite(o.center_offset) || !Number.isFinite(o.bottom) || o.bottom < 0 || Math.abs(o.center_offset) + o.width / 2 + value.trim.width > span / 2 || o.bottom + o.height + value.trim.width > wallTop(value, o.wall, o.center_offset, o.width)) throw new Error(`Opening ${o.id} must fit inside its wall, including side trim.`);
    if (o.color !== undefined && !color(o.color)) throw new Error(`Opening ${o.id} has an invalid color.`);
    if (o.shutters !== undefined && typeof o.shutters !== 'boolean' || o.flower_box !== undefined && typeof o.flower_box !== 'boolean') throw new Error(`Opening ${o.id} needs boolean shutters/flower_box values.`);
    if (o.hardware && (o.hardware.style !== 'strap_hinges' || !color(o.hardware.color))) throw new Error(`Opening ${o.id} supports strap_hinges with a hex color.`);
    if (o.style !== undefined && !['flush', 'paneled'].includes(o.style)) throw new Error('Door style must be flush or paneled.');
    if (o.glazing_panels !== undefined && (!Array.isArray(o.glazing_panels) || o.glazing_panels.length > 8 || o.type === 'window' || o.top_glazing)) throw new Error('Door glazing_panels supports up to eight panels without top_glazing.');
    for (const panel of o.glazing_panels ?? []) {
      if (!positive(panel.width) || !positive(panel.height) || !Number.isFinite(panel.bottom_from_door_base) || panel.bottom_from_door_base < 60 || panel.bottom_from_door_base + panel.height > o.height - 60 || panel.width > o.width / (o.type === 'double_door' ? 2 : 1) - 100) throw new Error('Glazing panel must fit inside its door leaf.');
    }
    const glazing = o.top_glazing;
    if (glazing && o.width / (o.type === 'double_door' ? 2 : 1) <= 140) throw new Error(`Door ${o.id} is too narrow for its glazing and trim.`);
    if (glazing && (!positive(glazing.height) || !Number.isFinite(glazing.bottom_from_door_base) || glazing.bottom_from_door_base < 0 || glazing.bottom_from_door_base + glazing.height > o.height)) throw new Error(`Glazing must fit in door ${o.id}.`);
    const panes = glazing?.panes_per_leaf ?? glazing?.panes ?? o.panes;
    if (panes && ![panes.columns, panes.rows].every(n => Number.isInteger(n) && n >= 1 && n <= 12)) throw new Error(`Pane counts for ${o.id} must be integers from 1 to 12.`);
  }
  for (let i = 0; i < value.openings.length; i++) for (let j = i + 1; j < value.openings.length; j++) {
    const a = value.openings[i], c = value.openings[j], t = value.trim.width;
    if (a.wall === c.wall && Math.abs(a.center_offset - c.center_offset) < (a.width + c.width) / 2 + 2 * t && a.bottom < c.bottom + c.height + t && c.bottom < a.bottom + a.height + t) throw new Error(`Openings ${a.id} and ${c.id} overlap, including trim.`);
  }
  if (!Array.isArray(value.details) || value.details.length > 8) throw new Error('Provide at most eight shed details.');
  for (const d of value.details) {
    if (!color(d.color)) throw new Error('Details require a six-digit hex color.');
    if (d.type === 'gable_vent') {
      if (r.type !== 'gable' || !['front', 'rear'].includes(d.wall) || !positive(d.width) || !positive(d.height) || !Number.isFinite(d.center_offset) || !Number.isFinite(d.bottom) || d.bottom < b.wall_height || d.bottom + d.height >= b.wall_height + r.rise || Math.abs(d.center_offset) + d.width / 2 >= b.width / 2 * (1 - (d.bottom + d.height - b.wall_height) / r.rise)) throw new Error('Gable vent must fit below the roof ridge.');
    } else if (d.type === 'cupola') {
      if (r.type !== 'gable' || d.roof !== 'hip' || !color(d.roof_color) || ![d.base_width, d.base_depth, d.height].every(positive) || !Number.isFinite(d.center?.x) || !Number.isFinite(d.center?.y) || d.center.x !== 0 || Math.abs(d.center.y) + d.base_depth / 2 > b.depth / 2 || d.base_width > b.width / 2 || d.height > b.wall_height) throw new Error('Cupola must fit on the ridge with a hip roof.');
    } else throw new Error(`Unsupported shed detail: ${d.type}.`);
  }
  if (value.evidence?.inferred !== undefined && (!Array.isArray(value.evidence.inferred) || !value.evidence.inferred.every(s => typeof s === 'string'))) throw new Error('Evidence inferred must be an array of strings.');
  return { ...value, schema: 'retina.shed/v1', compatibility: { status: 'supported', requires: 'Retina geometry v0.3 or later' } };
}

export function buildShed(bp) {
  const root = new THREE.Group();
  root.name = bp.name || 'Garden shed';
  const b = bp.body, r = bp.roof, trim = bp.trim;
  const materials = new Map();
  function material(c) {
    if (!materials.has(c)) materials.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }));
    return materials.get(c);
  }
  function mesh(geometry, c, name) {
    const obj = new THREE.Mesh(geometry, material(c));
    obj.name = name; root.add(obj); return obj;
  }
  function box(w, d, h, x, y, z, c, name) {
    const obj = mesh(new THREE.BoxGeometry(w, d, h), c, name);
    obj.position.set(x, y, z); return obj;
  }
  // Wall-local coordinates: u runs horizontally along the wall, v is world z.
  function localBox(wall, u, z, w, h, d, c, name, outward = 0) {
    const front = wall === 'front', rear = wall === 'rear';
    if (front || rear) return box(w, d, h, u, (front ? -1 : 1) * (b.depth / 2 + outward), z, c, name);
    return box(d, w, h, (wall === 'right' ? 1 : -1) * (b.width / 2 + outward), u, z, c, name);
  }
  function planar(wall, shape, depth, c, name) {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i), z = p.getY(i), t = p.getZ(i) - depth / 2;
      if (wall === 'front' || wall === 'rear') p.setXYZ(i, u, (wall === 'front' ? -1 : 1) * b.depth / 2 - t, z);
      else p.setXYZ(i, (wall === 'right' ? 1 : -1) * b.width / 2 + t, u, z);
    }
    g.computeVertexNormals(); return mesh(g, c, name);
  }
  box(b.width, b.depth, b.floor_thickness, 0, 0, b.floor_thickness / 2, '#9B9586', 'Floor');
  for (const wall of ['front', 'rear', 'right', 'left']) {
    const span = ['front', 'rear'].includes(wall) ? b.width : b.depth;
    const shape = new THREE.Shape();
    shape.moveTo(-span / 2, 0); shape.lineTo(span / 2, 0); shape.lineTo(span / 2, wallTop(bp, wall, span / 2)); shape.lineTo(-span / 2, wallTop(bp, wall, -span / 2)); shape.closePath();
    const openings = bp.openings.filter(o => o.wall === wall);
    for (const o of openings) {
      const hole = new THREE.Path(), x = o.center_offset - o.width / 2;
      hole.moveTo(x, o.bottom); hole.lineTo(x, o.bottom + o.height); hole.lineTo(x + o.width, o.bottom + o.height); hole.lineTo(x + o.width, o.bottom); hole.closePath(); shape.holes.push(hole);
    }
    planar(wall, shape, b.wall_thickness, bp.walls.color, `${wall} wall`);
    if (bp.walls.style === 'horizontal_panel_siding') {
      const maxTop = Math.max(wallTop(bp, wall, -span / 2), wallTop(bp, wall, span / 2));
      for (let z = bp.walls.panel_spacing; z < maxTop; z += bp.walls.panel_spacing) {
        let lo = -span / 2, hi = span / 2;
        if (r.type === 'mono_pitch' && ['front', 'rear'].includes(wall) && z > b.wall_height) {
          const boundary = b.width * ((z - b.wall_height) / r.rise - 0.5);
          if (r.high_side === 'right') lo = boundary; else hi = -boundary;
        }
        let segments = [[lo, hi]];
        for (const o of openings) if (z >= o.bottom - trim.width && z <= o.bottom + o.height + trim.width) segments = segments.flatMap(([a, c]) => [[a, Math.min(c, o.center_offset - o.width / 2 - trim.width)], [Math.max(a, o.center_offset + o.width / 2 + trim.width), c]].filter(([x, y]) => y > x));
        for (const [a, c] of segments) localBox(wall, (a + c) / 2, z, c - a, 8, 8, '#303638', 'Horizontal siding seam', b.wall_thickness / 2 + 4);
      }
    } else {
      for (let u = -span / 2 + bp.walls.panel_spacing; u < span / 2; u += bp.walls.panel_spacing) {
        let segments = [[0, wallTop(bp, wall, u)]];
        for (const o of openings) if (Math.abs(u - o.center_offset) <= o.width / 2 + trim.width) segments = segments.flatMap(([lo, hi]) => [[lo, Math.min(hi, o.bottom)], [Math.max(lo, o.bottom + o.height), hi]].filter(([a, c]) => c > a));
        for (const [lo, hi] of segments) localBox(wall, u, (lo + hi) / 2, 10, hi - lo, 8, bp.walls.color, 'Siding seam', b.wall_thickness / 2 + 4);
      }
    }
    if (r.type === 'gable') localBox(wall, 0, b.wall_height - trim.width / 2, span, trim.width, trim.depth, trim.color, 'Eave trim', b.wall_thickness / 2 + trim.depth / 2);
    for (const u of [-span / 2 + trim.width / 2, span / 2 - trim.width / 2]) {
      const height = wallTop(bp, wall, u);
      localBox(wall, u, height / 2, trim.width, height, trim.depth, trim.color, 'Corner trim', b.wall_thickness / 2 + trim.depth / 2);
    }
  }
  if (r.type === 'gable') for (const wall of ['front', 'rear']) {
    const gable = new THREE.Shape();
    gable.moveTo(-b.width / 2, b.wall_height); gable.lineTo(b.width / 2, b.wall_height); gable.lineTo(0, b.wall_height + r.rise); gable.closePath();
    planar(wall, gable, b.wall_thickness, bp.walls.color, `${wall} gable`);
  }
  if (r.type === 'mono_pitch') {
    const sign = r.high_side === 'right' ? 1 : -1;
    const pitch = Math.atan2(r.rise, b.width), full = b.width + 2 * r.overhang;
    const roof = box(full / Math.cos(pitch), b.depth + 2 * r.overhang, r.thickness, 0, 0, b.wall_height + r.rise / 2, r.color, 'Mono-pitch roof');
    roof.rotation.y = -sign * pitch;
    for (const y of [-b.depth / 2 - r.overhang, b.depth / 2 + r.overhang]) {
      const fascia = box(full / Math.cos(pitch), trim.depth, trim.width * 2, 0, y, roof.position.z - r.thickness / 2, r.fascia_color || trim.color, 'Sloping fascia');
      fascia.rotation.y = -sign * pitch;
    }
    for (const x of [-full / 2, full / 2]) box(trim.depth, b.depth + 2 * r.overhang, trim.width * 2, x, 0, roof.position.z + sign * x * Math.tan(pitch) - r.thickness / 2, r.fascia_color || trim.color, 'Side fascia');
  } else {
  const pitch = Math.atan2(r.rise, b.width / 2), half = b.width / 2 + r.overhang;
  for (const side of [-1, 1]) {
    const roof = box(half / Math.cos(pitch), b.depth + r.overhang * 2, r.thickness, side * half / 2, 0, b.wall_height + r.rise - half / 2 * Math.tan(pitch), r.color, 'Roof slope');
    roof.rotation.y = side * pitch;
    for (const y of [-b.depth / 2 - r.overhang, b.depth / 2 + r.overhang]) {
      const fascia = box(half / Math.cos(pitch), trim.depth, trim.width, side * half / 2, y, roof.position.z - r.thickness / 2, trim.color, 'Gable fascia');
      fascia.rotation.y = side * pitch;
    }
  }
  }
  const surface = b.wall_thickness / 2 + trim.depth;
  function frame(wall, u, z, w, h, name) {
    for (const s of [-1, 1]) {
      localBox(wall, u + s * (w / 2 + trim.width / 2), z, trim.width, h + trim.width * 2, trim.depth, trim.color, name, surface);
      localBox(wall, u, z + s * (h / 2 + trim.width / 2), w, trim.width, trim.depth, trim.color, name, surface);
    }
  }
  function glazing(wall, u, z, w, h, panes, name) {
    localBox(wall, u, z, w, h, 12, '#273C45', name, surface + 10);
    const bar = Math.min(25, w / 20, h / 20), counts = panes || {columns: 1, rows: 1};
    for (let i = 0; i <= counts.columns; i++) localBox(wall, u - w / 2 + w * i / counts.columns, z, bar, h, 16, trim.color, 'Window mullion', surface + 20);
    for (let i = 0; i <= counts.rows; i++) localBox(wall, u, z - h / 2 + h * i / counts.rows, w, bar, 16, trim.color, 'Window mullion', surface + 20);
  }
  for (const o of bp.openings) {
    const z = o.bottom + o.height / 2;
    frame(o.wall, o.center_offset, z, o.width, o.height, `${o.id} trim`);
    if (o.type === 'window') {
      glazing(o.wall, o.center_offset, z, o.width, o.height, o.panes, o.id);
      if (o.shutters) for (const s of [-1, 1]) localBox(o.wall, o.center_offset + s * (o.width / 2 + trim.width + 90), z, 160, o.height, 30, '#A6A393', 'Shutter', surface);
      if (o.flower_box) localBox(o.wall, o.center_offset, o.bottom - 100, o.width + 120, 160, 250, trim.color, 'Flower box', surface + 125);
    } else {
      const leaves = o.type === 'double_door' ? 2 : 1, leafWidth = o.width / leaves;
      for (let i = 0; i < leaves; i++) {
        const u = o.center_offset - o.width / 2 + leafWidth * (i + 0.5);
        localBox(o.wall, u, z, leafWidth - 6, o.height, 35, o.color || '#ADA897', 'Door leaf', 0);
        if (o.style !== 'flush') for (const s of [-1, 1]) localBox(o.wall, u + s * (leafWidth / 2 - 45), z, 60, o.height, 20, trim.color, 'Door stile', surface);
        if (o.style !== 'flush') for (const v of [o.bottom + 40, o.bottom + o.height * 0.45, o.bottom + o.height - 40]) localBox(o.wall, u, v, leafWidth, 60, 20, trim.color, 'Door rail', surface);
        if (o.top_glazing) glazing(o.wall, u, o.bottom + o.top_glazing.bottom_from_door_base + o.top_glazing.height / 2, leafWidth - 140, o.top_glazing.height, o.top_glazing.panes_per_leaf || o.top_glazing.panes, 'Door glazing');
        for (const panel of o.glazing_panels ?? []) glazing(o.wall, u, o.bottom + panel.bottom_from_door_base + panel.height / 2, panel.width, panel.height, {columns: 1, rows: 1}, 'Door glazing panel');
        if (o.hardware) for (const v of [o.bottom + 150, o.bottom + o.height * 0.45, o.bottom + o.height - 80]) localBox(o.wall, u, v, leafWidth * 0.7, 25, 12, o.hardware.color, 'Strap hinge', surface + 15);
        localBox(o.wall, u + leafWidth / 2 - 80, o.bottom + o.height * 0.45 + 70, 25, 65, 25, '#252522', 'Door handle', surface + 25);
      }
    }
  }
  for (const d of bp.details) {
    if (d.type === 'gable_vent') {
      localBox(d.wall, d.center_offset, d.bottom + d.height / 2, d.width, d.height, 20, d.color, 'Gable vent', surface);
      for (let i = 1; i < 5; i++) localBox(d.wall, d.center_offset, d.bottom + d.height * i / 5, d.width * 0.85, 8, 24, '#777E74', 'Vent louver', surface + 10);
    } else {
      const baseZ = b.wall_height + r.rise, bodyHeight = d.height * 0.7;
      box(d.base_width, d.base_depth, bodyHeight, 0, d.center.y, baseZ + bodyHeight / 2, d.color, 'Cupola');
      const w = d.base_width * 0.6, dep = d.base_depth * 0.6;
      const vertices = [[-w,-dep,0],[w,-dep,0],[w,dep,0],[-w,dep,0],[0,0,d.height * 0.3]];
      const indices = [0,1,4,1,2,4,2,3,4,3,0,4,0,3,2,0,2,1];
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(indices.flatMap(i => vertices[i]), 3));
      geometry.computeVertexNormals();
      const cap = mesh(geometry, d.roof_color, 'Cupola hip roof'); cap.position.set(0, d.center.y, baseZ + bodyHeight);
      for (const y of [d.center.y - d.base_depth / 2 - 1, d.center.y + d.base_depth / 2 + 1]) for (let i = 1; i < 5; i++) box(d.base_width * 0.7, 8, 12, 0, y, baseZ + bodyHeight * i / 5, '#777E74', 'Cupola louver');
    }
  }
  return root;
}
