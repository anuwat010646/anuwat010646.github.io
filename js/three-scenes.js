/* 3D scenes (Three.js r128) — โมเดลทั้งหมดสร้างด้วยโค้ด จำลองจากงานจริง
   1) ESP32 Control Board (hero + lab)  2) Solar Lawn Mower  3) Pose Skeleton (FitAI)  4) Voxel Bonsai (Minecraft) */
(function () {
  if (!window.THREE) { document.documentElement.classList.add('no-3d'); return; }
  const T = window.THREE;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- shared materials ---------- */
  const M = {
    board: new T.MeshStandardMaterial({ color: 0x1b1b1f, roughness: .6, metalness: .2 }),
    dark: new T.MeshStandardMaterial({ color: 0x0e0e10, roughness: .5, metalness: .3 }),
    metal: new T.MeshStandardMaterial({ color: 0xc8c8cc, roughness: .25, metalness: .9 }),
    steel: new T.MeshStandardMaterial({ color: 0x8a8a92, roughness: .35, metalness: .8 }),
    white: new T.MeshStandardMaterial({ color: 0xe9e9ec, roughness: .5 }),
    gray: new T.MeshStandardMaterial({ color: 0x52525b, roughness: .7 }),
    red: new T.MeshStandardMaterial({ color: 0xb91c1c, roughness: .5, metalness: .2 }),
    blue: new T.MeshStandardMaterial({ color: 0x1d4ed8, roughness: .5 }),
    led: new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .2 }),
    ok: new T.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x4ade80, emissiveIntensity: 1 }),
    leaf: new T.MeshStandardMaterial({ color: 0x3f8f4f, roughness: .8 }),
    leaf2: new T.MeshStandardMaterial({ color: 0x5fb36a, roughness: .8 }),
    wood: new T.MeshStandardMaterial({ color: 0x6b4a2f, roughness: .9 }),
    pot: new T.MeshStandardMaterial({ color: 0x8b5a3c, roughness: .8 }),
    soil: new T.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 1 }),
    water: new T.MeshStandardMaterial({ color: 0x60a5fa, emissive: 0x1d4ed8, emissiveIntensity: .5, transparent: true, opacity: .85 }),
    joint: new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .6 }),
    bone: new T.MeshStandardMaterial({ color: 0xa1a1aa, roughness: .4, metalness: .3 }),
  };
  const box = (w, h, d, m) => new T.Mesh(new T.BoxGeometry(w, h, d), m);
  const cyl = (rt, rb, h, m, s = 16) => new T.Mesh(new T.CylinderGeometry(rt, rb, h, s), m);

  function solarTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 160; const g = c.getContext('2d');
    g.fillStyle = '#0f1729'; g.fillRect(0, 0, 256, 160);
    g.strokeStyle = 'rgba(180,200,255,.35)'; g.lineWidth = 2;
    for (let x = 0; x <= 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 160); g.stroke(); }
    for (let y = 0; y <= 160; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    g.strokeStyle = '#cbd5e1'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 160);
    const t = new T.CanvasTexture(c); return t;
  }

  /* ---------- models ---------- */
  function makeBoard() {
    const g = new T.Group(), parts = [];
    const pcb = box(4.2, .12, 2.8, M.board); g.add(pcb);
    // traces
    const tr = new T.MeshBasicMaterial({ color: 0x3f3f46 });
    for (let i = 0; i < 9; i++) { const t = box(3.6, .005, .03, tr); t.position.set(0, .065, -1.1 + i * .28); g.add(t); }
    const add = (m, x, y, z, lift) => { m.position.set(x, y, z); m.userData.base = y; m.userData.lift = lift; g.add(m); parts.push(m); return m; };
    // ESP32 module: board + metal shield + antenna
    const mod = new T.Group();
    mod.add(box(1.0, .06, 1.6, M.dark));
    const can = box(.8, .14, 1.0, M.metal); can.position.set(0, .1, .15); mod.add(can);
    const ant = box(.9, .02, .32, M.gray); ant.position.set(0, .04, -.62); mod.add(ant);
    add(mod, -1.2, .12, 0, 1.1);
    // pin headers
    for (const side of [-1, 1]) {
      const hdr = new T.Group();
      hdr.add(box(.12, .1, 1.7, M.dark));
      for (let i = 0; i < 15; i++) { const p = box(.03, .3, .03, M.metal); p.position.set(0, .15, -.8 + i * .115); hdr.add(p); }
      add(hdr, -1.2 + side * .62, .1, 0, .7);
    }
    // relay modules x4
    for (let i = 0; i < 4; i++) {
      const r = new T.Group();
      r.add(box(.5, .42, .38, M.blue));
      const lbl = box(.3, .01, .22, M.white); lbl.position.y = .215; r.add(lbl);
      const led = new T.Mesh(new T.SphereGeometry(.035, 12, 12), M.led.clone()); led.position.set(.18, .24, .14); r.add(led);
      r.userData.led = led;
      add(r, .55 + (i % 2) * .7, .27, -.55 + Math.floor(i / 2) * 1.1, 1.4 + i * .15);
    }
    // DHT22 sensor
    const dht = new T.Group(); dht.add(box(.36, .5, .14, M.white));
    for (let i = 0; i < 4; i++) { const v = box(.24, .03, .02, M.gray); v.position.set(0, -.1 + i * .08, .075); dht.add(v); }
    add(dht, 1.75, .32, .95, 1.8);
    // OLED
    const oled = new T.Group(); oled.add(box(.6, .05, .5, M.dark)); const scr = box(.5, .01, .3, new T.MeshStandardMaterial({ color: 0x111, emissive: 0x9ca3af, emissiveIntensity: .35 })); scr.position.y = .03; oled.add(scr);
    add(oled, 1.75, .15, -.9, 1.6);
    // capacitors
    for (let i = 0; i < 3; i++) add(cyl(.08, .08, .22, M.steel), -.25 + i * .22, .17, 1.1, .9);
    // buttons
    for (let i = 0; i < 3; i++) { const b = new T.Group(); b.add(box(.2, .08, .2, M.dark)); const k = cyl(.06, .06, .06, M.gray); k.position.y = .07; b.add(k); add(b, -.25 + i * .3, .1, -1.15, .8); }
    g.userData.parts = parts;
    g.userData.relays = parts.filter((p) => p.userData.led);
    return g;
  }

  function makeMower() {
    const g = new T.Group();
    // frame tubes
    const tube = (x1, y1, z1, x2, y2, z2, r = .05) => {
      const a = new T.Vector3(x1, y1, z1), b = new T.Vector3(x2, y2, z2), len = a.distanceTo(b);
      const m = cyl(r, r, len, M.steel, 10); m.position.copy(a).add(b).multiplyScalar(.5);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(m); return m;
    };
    // base plate
    const base = box(2.2, .06, 1.3, M.gray); base.position.set(0, .55, 0); g.add(base);
    // posts + top frame
    for (const [x, z] of [[-1, -.6], [1, -.6], [-1, .6], [1, .6]]) tube(x, .55, z, x, 1.75, z);
    tube(-1, 1.75, -.6, 1, 1.75, -.6); tube(-1, 1.75, .6, 1, 1.75, .6); tube(-1, 1.75, -.6, -1, 1.75, .6); tube(1, 1.75, -.6, 1, 1.75, .6);
    // diagonal braces
    tube(-1, .6, -.6, 0, 1.7, -.6, .035); tube(1, .6, -.6, 0, 1.7, -.6, .035); tube(-1, .6, .6, 0, 1.7, .6, .035); tube(1, .6, .6, 0, 1.7, .6, .035);
    // solar panels x2
    const tex = solarTexture();
    const pm = new T.MeshStandardMaterial({ map: tex, roughness: .25, metalness: .4 });
    for (const x of [-.55, .55]) { const p = new T.Mesh(new T.BoxGeometry(1.05, .05, 1.35), [M.steel, M.steel, pm, M.steel, M.steel, M.steel]); p.position.set(x, 1.82, 0); g.add(p); }
    // handle
    tube(1, 1.2, -.45, 2.1, 1.55, -.45, .045); tube(1, 1.2, .45, 2.1, 1.55, .45, .045); tube(2.1, 1.55, -.45, 2.1, 1.55, .45, .045);
    // control box
    const cb = box(.55, .45, .4, M.white); cb.position.set(.6, .82, 0); g.add(cb);
    const b1 = cyl(.04, .04, .03, M.red); b1.rotation.z = Math.PI / 2; b1.position.set(.88, .9, -.08); g.add(b1);
    const b2 = cyl(.04, .04, .03, M.ok); b2.rotation.z = Math.PI / 2; b2.position.set(.88, .9, .08); g.add(b2);
    // battery
    const bat = box(.6, .35, .4, M.dark); bat.position.set(-.3, .76, 0); g.add(bat);
    // big wheels
    const wheels = [];
    for (const z of [-.75, .75]) {
      const w = new T.Group();
      const tire = new T.Mesh(new T.TorusGeometry(.55, .05, 10, 40), M.dark); w.add(tire);
      const rim = new T.Mesh(new T.TorusGeometry(.5, .02, 6, 40), M.metal); w.add(rim);
      for (let i = 0; i < 12; i++) { const s = cyl(.008, .008, 1, M.metal, 4); s.rotation.z = (i / 12) * Math.PI; w.add(s); }
      w.position.set(-.9, .6, z); g.add(w); wheels.push(w);
    }
    // blade deck (red) + motor + blade
    const deck = cyl(.62, .62, .12, M.red, 32); deck.position.set(.25, .2, 0); g.add(deck);
    const mot = cyl(.18, .18, .4, M.red); mot.position.set(.25, .45, 0); g.add(mot);
    const ring = new T.Mesh(new T.TorusGeometry(.75, .035, 8, 48), M.red); ring.rotation.x = Math.PI / 2; ring.position.set(.25, .12, 0); g.add(ring);
    const blade = new T.Group(); const bl = box(1.1, .015, .12, M.metal); blade.add(bl); const bl2 = bl.clone(); bl2.rotation.y = Math.PI / 2; blade.add(bl2);
    blade.position.set(.25, .1, 0); g.add(blade);
    g.userData.blade = blade; g.userData.wheels = wheels;
    g.position.y = -.9; g.position.x = -.4;
    return g;
  }

  function makeSkeleton() {
    const g = new T.Group();
    const J = {}; const names = ['head', 'neck', 'pelvis', 'lsh', 'rsh', 'lel', 'rel', 'lwr', 'rwr', 'lhip', 'rhip', 'lkn', 'rkn', 'lan', 'ran'];
    for (const n of names) { const s = new T.Mesh(new T.SphereGeometry(n === 'head' ? .2 : .07, 16, 16), M.joint); g.add(s); J[n] = s; }
    const pairs = [['head', 'neck'], ['neck', 'pelvis'], ['neck', 'lsh'], ['neck', 'rsh'], ['lsh', 'lel'], ['lel', 'lwr'], ['rsh', 'rel'], ['rel', 'rwr'], ['pelvis', 'lhip'], ['pelvis', 'rhip'], ['lhip', 'lkn'], ['lkn', 'lan'], ['rhip', 'rkn'], ['rkn', 'ran']];
    const bones = pairs.map(([a, b]) => { const m = cyl(.035, .035, 1, M.bone, 8); g.add(m); return { a, b, m }; });
    // floor ring
    const fl = new T.Mesh(new T.RingGeometry(.9, .94, 64), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .25, side: T.DoubleSide })); fl.rotation.x = -Math.PI / 2; fl.position.y = -1.55; g.add(fl);
    g.userData.pose = (k) => { // k: 0 standing .. 1 bottom of squat
      const hipY = -.1 - k * .75, knX = .12 + k * .05, knZ = .05 + k * .55;
      const set = (n, x, y, z) => J[n].position.set(x, y, z);
      set('ran', .22, -1.5, 0); set('lan', -.22, -1.5, 0);
      set('rkn', .22 + knX * .2, (-1.5 + hipY) / 2 + .05, knZ); set('lkn', -.22 - knX * .2, (-1.5 + hipY) / 2 + .05, knZ);
      set('rhip', .17, hipY, -k * .35); set('lhip', -.17, hipY, -k * .35); set('pelvis', 0, hipY, -k * .35);
      const lean = k * .45;
      set('neck', 0, hipY + .95 - k * .1, -k * .35 + lean); set('head', 0, hipY + 1.22 - k * .1, -k * .35 + lean + .04);
      set('rsh', .26, hipY + .9 - k * .1, -k * .35 + lean); set('lsh', -.26, hipY + .9 - k * .1, -k * .35 + lean);
      set('rel', .3, hipY + .62, -k * .35 + lean + .25 + k * .2); set('lel', -.3, hipY + .62, -k * .35 + lean + .25 + k * .2);
      set('rwr', .22, hipY + .75 + k * .15, -k * .35 + lean + .55 + k * .1); set('lwr', -.22, hipY + .75 + k * .15, -k * .35 + lean + .55 + k * .1);
      for (const b of bones) {
        const A = J[b.a].position, B = J[b.b].position, len = A.distanceTo(B);
        b.m.position.copy(A).add(B).multiplyScalar(.5); b.m.scale.set(1, len, 1);
        b.m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize());
      }
    };
    g.userData.pose(0); g.position.y = .1;
    return g;
  }

  function makeBonsai() {
    const g = new T.Group(), S = .22, geo = new T.BoxGeometry(S, S, S), leaves = [];
    const vox = (x, y, z, m) => { const c = new T.Mesh(geo, m); c.position.set(x * S, y * S, z * S); g.add(c); return c; };
    for (let x = -3; x <= 3; x++) for (let z = -2; z <= 2; z++) { vox(x, -4, z, M.pot); if (Math.abs(x) === 3 || Math.abs(z) === 2) vox(x, -3, z, M.pot); else vox(x, -3, z, M.soil); }
    const trunk = [[0, -2, 0], [0, -1, 0], [1, 0, 0], [1, 1, 0], [0, 2, 0], [-1, 2, 0], [2, 1, 0], [2, 2, 1]];
    trunk.forEach(([x, y, z]) => vox(x, y, z, M.wood));
    const clusters = [[-1, 3, 0, 2], [2, 3, 1, 1.6], [0, 4, 0, 1.6]];
    for (const [cx, cy, cz, r] of clusters) for (let x = -2; x <= 2; x++) for (let y = -1; y <= 1; y++) for (let z = -2; z <= 2; z++) {
      if (x * x + y * y * 2 + z * z <= r * r + .5) leaves.push(vox(cx + x, cy + y, cz + z, (x + y + z) % 2 ? M.leaf : M.leaf2));
    }
    g.userData.leaves = leaves; g.userData.drops = [];
    g.position.y = -.1;
    return g;
  }

  /* ---------- viewer ---------- */
  function Viewer(canvas, opts = {}) {
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(35, 1, .1, 100);
    scene.add(new T.HemisphereLight(0xffffff, 0x222226, .9));
    const key = new T.DirectionalLight(0xffffff, 1.1); key.position.set(4, 6, 5); scene.add(key);
    const rim = new T.DirectionalLight(0xffffff, .5); rim.position.set(-5, 3, -4); scene.add(rim);
    // floor grid
    const grid = new T.GridHelper(14, 28, 0x3f3f46, 0x1f1f23); grid.position.y = -1.6; grid.material.transparent = true; grid.material.opacity = .6; scene.add(grid);
    const pivot = new T.Group(); scene.add(pivot);
    let model = null, wire = false, auto = opts.auto !== false && !reduce, dist = opts.dist || 7;
    let baseDist = opts.dist || 7, rotY = opts.rotY ?? -.6, rotX = opts.rotX ?? .45, vy = 0, vx = 0, dragging = false, lx = 0, ly = 0;
    const st = { explode: 0, explodeTarget: 0, onFrame: null };

    function setModel(m, d) {
      if (model) pivot.remove(model);
      model = m; pivot.add(m); if (d) dist = baseDist = d; st.explode = st.explodeTarget = 0;
      if (wire) { wire = false; applyWire(true); }
    }
    const HIDDEN = new T.MeshBasicMaterial({ visible: false });
    function applyWire(on) {
      wire = on;
      model.traverse((o) => {
        if (!o.isMesh || o.userData.isEdge) return;
        if (on && !o.userData.edge) {
          o.userData.mat = o.material; o.material = HIDDEN;
          const e = new T.LineSegments(new T.EdgesGeometry(o.geometry, 25), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8 }));
          e.userData.isEdge = true; o.userData.edge = e; o.add(e);
        } else if (!on && o.userData.edge) {
          o.remove(o.userData.edge); o.userData.edge = null; o.material = o.userData.mat;
        }
      });
      return wire;
    }
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); canvas.classList.add('grab'); });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return; vy = (e.clientX - lx) * .006; vx = (e.clientY - ly) * .004; lx = e.clientX; ly = e.clientY;
      rotY += vy; rotX = Math.max(-.2, Math.min(1.2, rotX + vx));
    });
    const up = () => { dragging = false; canvas.classList.remove('grab'); };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    if (opts.zoom) canvas.addEventListener('wheel', (e) => { e.preventDefault(); dist = Math.max(4, Math.min(14, dist + e.deltaY * .005)); }, { passive: false });
    let visible = true;
    new IntersectionObserver((es) => (visible = es[0].isIntersecting)).observe(canvas);
    addEventListener('resize', resize);
    let t0 = performance.now();
    (function frame(t) {
      requestAnimationFrame(frame);
      if (!visible) return;
      const dt = Math.min(.05, (t - t0) / 1000); t0 = t;
      if (!dragging) { if (auto) rotY += dt * .35; rotY += vy; vy *= .92; vx *= .9; }
      pivot.rotation.y = rotY; cam.position.set(0, Math.sin(rotX) * dist, Math.cos(rotX) * dist); cam.lookAt(0, 0, 0);
      st.explode += (st.explodeTarget - st.explode) * .1;
      if (model && model.userData.parts) model.userData.parts.forEach((p) => (p.position.y = p.userData.base + st.explode * p.userData.lift));
      if (st.onFrame && model) st.onFrame(model, dt, t / 1000);
      renderer.render(scene, cam);
    })(t0);
    resize(); setTimeout(resize, 100);
    return {
      setModel, resize, st, getModel: () => model,
      wire: (v) => applyWire(v ?? !wire), isWire: () => wire,
      auto: (v) => (auto = v ?? !auto), isAuto: () => auto,
      reset: () => { rotY = opts.rotY ?? -.6; rotX = opts.rotX ?? .45; dist = baseDist; },
    };
  }

  /* ---------- relay blink logic shared by both board views ---------- */
  function boardAnim(model, dt, t) {
    model.userData.relays.forEach((r, i) => {
      const on = Math.sin(t * 1.4 - i * 1.1) > .3;
      r.userData.led.material.emissiveIntensity = on ? 2.2 : .15;
    });
  }

  /* ---------- HERO viewer ---------- */
  const heroCanvas = document.getElementById('heroGL');
  if (heroCanvas) {
    const v = Viewer(heroCanvas, { dist: 7.4, rotX: .62 });
    v.setModel(makeBoard()); v.st.onFrame = boardAnim;
    const ex = document.getElementById('heroExplode'), wr = document.getElementById('heroWire');
    ex.addEventListener('click', () => { v.st.explodeTarget = v.st.explodeTarget ? 0 : 1; ex.setAttribute('aria-pressed', !!v.st.explodeTarget); });
    wr.addEventListener('click', () => { v.wire(); wr.setAttribute('aria-pressed', v.isWire()); });
    window.__heroViewer = v;
  }

  /* ---------- 3D LAB ---------- */
  const labCanvas = document.getElementById('labGL');
  if (labCanvas) {
    const v = Viewer(labCanvas, { zoom: true, dist: 7 });
    const title = document.getElementById('labTitle'), info = document.getElementById('labInfo'), stat = document.getElementById('labStat'), act = document.getElementById('labAction');
    let reps = 0, phaseDown = false, watering = 0;
    const MODELS = {
      board: { make: makeBoard, dist: 7.6, title: 'ESP32 Control Board', info: 'บอร์ดควบคุมระบบดูแลบอนไซ: ESP32, รีเลย์ 4 ช่อง, DHT22, OLED', action: 'Explode view',
        frame: boardAnim, onAction: () => { v.st.explodeTarget = v.st.explodeTarget ? 0 : 1; return v.st.explodeTarget ? 'แยกชิ้นส่วนแล้ว' : 'ประกอบกลับแล้ว'; } },
      mower: { make: makeMower, dist: 9.4, title: 'Solar Lawn Mower', info: 'จากแบบโครงสร้าง 3D ของโครงงาน ปวส.: แผงโซลาร์ 2 แผง มอเตอร์ DC 24V', action: 'เปิดใบมีด',
        frame: (m, dt) => { m.userData.blade.rotation.y += dt * (m.userData.on ? 40 : 0); }, onAction: (m) => { m.userData.on = !m.userData.on; return m.userData.on ? 'มอเตอร์ทำงาน · 24V 250W' : 'มอเตอร์หยุด'; } },
      pose: { make: makeSkeleton, dist: 8.2, title: 'Pose Skeleton · FitAI', info: 'ข้อต่อร่างกาย 15 จุดแบบที่ Pose API ส่งกลับมา กำลังทำ squat', action: 'นับใหม่',
        frame: (m, dt, t) => { const k = (1 - Math.cos(t * 2.2)) / 2; m.userData.pose(reduce ? .5 : k);
          if (k > .9 && !phaseDown) phaseDown = true; if (k < .1 && phaseDown) { phaseDown = false; reps++; stat.textContent = `phase: up · reps ${reps}`; } },
        onAction: () => { reps = 0; return 'reps 0'; } },
      bonsai: { make: makeBonsai, dist: 7.8, title: 'Voxel Bonsai · Minecraft', info: 'ต้นบอนไซแบบ voxel ในโลก Minecraft ที่เชื่อมกับต้นไม้จริงผ่าน MQTT', action: '💧 รดน้ำ',
        frame: (m, dt, t) => {
          m.userData.leaves.forEach((l, i) => (l.position.y += Math.sin(t * 1.5 + i) * .0004));
          if (watering > 0) { watering -= dt;
            if (Math.random() < .5) { const d = new T.Mesh(new T.SphereGeometry(.04, 6, 6), M.water); d.position.set((Math.random() - .5) * 1.2, 1.9, (Math.random() - .5) * .8); m.add(d); m.userData.drops.push(d); } }
          m.userData.drops = m.userData.drops.filter((d) => { d.position.y -= dt * 2.4; if (d.position.y < -.6) { m.remove(d); return false; } return true; });
        },
        onAction: () => { watering = 2.5; return 'publish system/control/water → ปั๊มทำงาน'; } },
    };
    const btns = [...document.querySelectorAll('.lab-item')];
    function load(key) {
      const d = MODELS[key]; const m = d.make();
      v.setModel(m, d.dist); v.st.onFrame = d.frame; v.reset();
      title.textContent = d.title; info.textContent = d.info; act.textContent = d.action; stat.textContent = '';
      btns.forEach((b) => b.setAttribute('aria-selected', b.dataset.model === key)); load.cur = key;
    }
    btns.forEach((b) => b.addEventListener('click', () => load(b.dataset.model)));
    document.querySelectorAll('.lab-ctl [data-act]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'rotate') b.setAttribute('aria-pressed', v.auto());
      if (a === 'wire') b.setAttribute('aria-pressed', v.wire());
      if (a === 'reset') v.reset();
      if (a === 'action') stat.textContent = MODELS[load.cur].onAction(v.getModel());
    }));
    load('board');
  }
})();
