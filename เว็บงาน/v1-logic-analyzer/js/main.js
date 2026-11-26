/* Portfolio — Anuwat Nakwibool
   1) hero logic-analyzer capture (canvas): CH1 sends "ANUWAT" as real UART 8N1 bits
   2) small signal signatures for each project channel (SVG)
   3) ESP32 relay simulator
   4) copy-to-clipboard, lightbox, language level bars */
(function () {
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= 1. LOGIC ANALYZER ================= */
  const canvas = document.getElementById('scope');
  const readout = document.getElementById('cursorRead');
  const ctx = canvas.getContext('2d');
  const TEXT = 'ANUWAT';
  const TOTAL_MS = 10;

  // Build the UART bit stream: idle-high, then per byte: start(0) + 8 data (LSB first) + stop(1) + 1 idle
  const bits = [1, 1, 1, 1];
  const bytes = []; // {start, end, ch}
  for (const ch of TEXT) {
    const code = ch.charCodeAt(0);
    const s = bits.length;
    bits.push(0);
    for (let i = 0; i < 8; i++) bits.push((code >> i) & 1);
    bits.push(1);
    bytes.push({ start: s, end: s + 10, ch, code });
    bits.push(1);
  }
  while (bits.length < 76) bits.push(1);
  const N = bits.length;

  let W = 0, H = 0, dpr = 1, cursorX = null, hovering = false, sweep = 0.38, lastT = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    if (!W) return;
    const c = {
      bg: css('--panel'), grid: css('--grid'), line: css('--line'), fg: css('--fg'), muted: css('--muted'), faint: css('--faint'),
      clk: css('--clk'), ch1: css('--ch1'), ch2: css('--ch2'), ch3: css('--ch3'), cursor: css('--cursor'),
    };
    const mono = '500 11px "IBM Plex Mono", ui-monospace, monospace';
    const narrow = W < 520;
    const gutter = narrow ? 58 : 84, padR = 12, top = 26;
    const plotW = W - gutter - padR;
    const lanes = [
      { name: 'CLK', sub: 'CH0', color: c.clk },
      { name: 'TX', sub: 'CH1', color: c.ch1 },
      { name: 'PWM', sub: 'CH2', color: c.ch2 },
      { name: 'GPIO25', sub: 'CH3', color: c.ch3 },
    ];
    const laneH = (H - top - 8) / lanes.length;
    const amp = Math.min(22, laneH * 0.32);
    const bitW = plotW / N;
    const xAt = (b) => gutter + b * bitW;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);

    // time ruler + vertical grid every 1 ms
    ctx.font = mono; ctx.textBaseline = 'middle';
    for (let ms = 0; ms <= TOTAL_MS; ms++) {
      const x = gutter + (ms / TOTAL_MS) * plotW;
      ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.round(x) + .5, top - 6); ctx.lineTo(Math.round(x) + .5, H); ctx.stroke();
      if (!narrow || ms % 2 === 0) {
        ctx.fillStyle = c.faint; ctx.textAlign = ms === TOTAL_MS ? 'right' : 'center';
        ctx.fillText(ms + (ms === 0 ? ' ms' : ''), Math.min(x, W - padR), 12);
      }
    }

    lanes.forEach((lane, li) => {
      const mid = top + laneH * li + laneH * 0.58;
      const hi = mid - amp, lo = mid + amp;
      // lane label
      ctx.textAlign = 'left';
      ctx.fillStyle = lane.color; ctx.font = '600 11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText(lane.sub, 12, mid - 8);
      ctx.fillStyle = c.muted; ctx.font = mono;
      ctx.fillText(lane.name, 12, mid + 8);
      // separator
      ctx.strokeStyle = c.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, top + laneH * (li + 1) + .5); ctx.lineTo(W, top + laneH * (li + 1) + .5); ctx.stroke();

      // signal path
      ctx.strokeStyle = lane.color; ctx.lineWidth = 1.8; ctx.lineJoin = 'miter';
      ctx.beginPath();
      if (li === 0) { // clock: toggles every half bit
        let lvl = 1, x = gutter; ctx.moveTo(x, hi);
        const step = bitW / 2 < 4 ? bitW * 2 : bitW / 2;
        while (x < gutter + plotW) {
          const nx = Math.min(x + step, gutter + plotW);
          ctx.lineTo(nx, lvl ? hi : lo);
          lvl ^= 1; if (nx < gutter + plotW) ctx.lineTo(nx, lvl ? hi : lo);
          x = nx;
        }
      } else if (li === 1) { // UART
        ctx.moveTo(xAt(0), bits[0] ? hi : lo);
        for (let b = 0; b < N; b++) {
          const y = bits[b] ? hi : lo;
          ctx.lineTo(xAt(b), y); ctx.lineTo(xAt(b + 1), y);
          if (b + 1 < N && bits[b + 1] !== bits[b]) ctx.lineTo(xAt(b + 1), bits[b + 1] ? hi : lo);
        }
      } else if (li === 2) { // PWM with sweeping duty
        const period = bitW * 5;
        let x = gutter; ctx.moveTo(x, lo);
        let k = 0;
        while (x < gutter + plotW) {
          const duty = 0.15 + 0.7 * (0.5 + 0.5 * Math.sin(k * 0.45));
          const xh = Math.min(x + period * duty, gutter + plotW);
          const xe = Math.min(x + period, gutter + plotW);
          ctx.lineTo(x, lo); ctx.lineTo(x, hi); ctx.lineTo(xh, hi); ctx.lineTo(xh, lo); ctx.lineTo(xe, lo);
          x = xe; k++;
        }
      } else { // GPIO25 relay pulse
        const a = gutter + plotW * 0.34, b = gutter + plotW * 0.66;
        ctx.moveTo(gutter, lo); ctx.lineTo(a, lo); ctx.lineTo(a, hi); ctx.lineTo(b, hi); ctx.lineTo(b, lo); ctx.lineTo(gutter + plotW, lo);
      }
      ctx.stroke();

      // fill under high levels for the UART lane (subtle)
      if (li === 1) {
        // decoder boxes
        const boxH = 16, by = hi - boxH - 6;
        bytes.forEach((byte) => {
          const x0 = xAt(byte.start + 1) + 1, x1 = xAt(byte.start + 9) - 1;
          const w = x1 - x0;
          ctx.fillStyle = lane.color; ctx.globalAlpha = 0.16;
          roundRect(x0, by, w, boxH, 3); ctx.fill();
          ctx.globalAlpha = 1; ctx.strokeStyle = lane.color; ctx.lineWidth = 1;
          roundRect(x0 + .5, by + .5, w - 1, boxH - 1, 3); ctx.stroke();
          ctx.fillStyle = c.fg; ctx.textAlign = 'center';
          ctx.font = '600 11px "IBM Plex Mono", ui-monospace, monospace';
          const label = w > 62 ? `'${byte.ch}' 0x${byte.code.toString(16).toUpperCase()}` : byte.ch;
          ctx.fillText(label, x0 + w / 2, by + boxH / 2 + .5);
        });
      }
      if (li === 3) {
        const a = gutter + plotW * 0.34, b = gutter + plotW * 0.66;
        ctx.fillStyle = lane.color; ctx.globalAlpha = .12; ctx.fillRect(a, hi, b - a, lo - hi); ctx.globalAlpha = 1;
        ctx.fillStyle = c.fg; ctx.textAlign = 'center'; ctx.font = mono;
        ctx.fillText(narrow ? 'ON' : 'Relay1:ON  (trigger1:on)', (a + b) / 2, mid);
      }
    });

    // cursor
    const cx = cursorX ?? (gutter + plotW * sweep);
    if (cx >= gutter && cx <= gutter + plotW) {
      ctx.strokeStyle = c.cursor; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(Math.round(cx) + .5, top - 6); ctx.lineTo(Math.round(cx) + .5, H); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = c.cursor; ctx.beginPath(); ctx.moveTo(cx - 5, top - 10); ctx.lineTo(cx + 5, top - 10); ctx.lineTo(cx, top - 4); ctx.fill();
      const t = ((cx - gutter) / plotW) * TOTAL_MS;
      const b = Math.floor((cx - gutter) / bitW);
      const byte = bytes.find((y) => b >= y.start && b < y.end);
      readout.textContent = `t = ${t.toFixed(3)} ms · TX=${bits[Math.max(0, Math.min(N - 1, b))]}` + (byte ? ` · '${byte.ch}'` : '');
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function pointer(e) {
    const r = canvas.getBoundingClientRect();
    cursorX = e.clientX - r.left; hovering = true; draw();
  }
  canvas.addEventListener('pointermove', pointer);
  canvas.addEventListener('pointerdown', pointer);
  canvas.addEventListener('pointerleave', () => { hovering = false; cursorX = null; draw(); });

  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(canvas);
  }
  function tick(t) {
    const dt = Math.min(64, t - (lastT || t)); lastT = t;
    if (visible && !hovering) { sweep += dt / 9000; if (sweep > 1) sweep = 0; draw(); }
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', resize);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { draw(); drawSigs(); });
  new MutationObserver(() => { draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  if (!reduceMotion) requestAnimationFrame(tick);

  /* ================= 2. CHANNEL SIGNATURES ================= */
  const SVGNS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n); return n;
  }
  const Y = (v, min, max) => 76 - ((v - min) / (max - min)) * 70;

  function drawSigs() {
    document.querySelectorAll('svg.sig').forEach((svg) => {
      svg.innerHTML = '';
      const kind = svg.dataset.sig;
      let pts = [];
      if (kind === 'moisture') {
        // soil moisture % drains down to 40% then the pump refills it
        const thr = Y(40, 20, 90);
        el('line', { x1: 0, x2: 320, y1: thr, y2: thr, class: 'thr' }, svg);
        let v = 78;
        for (let x = 0; x <= 320; x += 2) {
          v -= 0.55 + 0.25 * Math.sin(x * 0.3);
          if (v <= 40) { pts.push([x, Y(40, 20, 90)]); el('line', { x1: x, x2: x, y1: 4, y2: 76, class: 'mark' }, svg); v = 80; }
          pts.push([x, Y(v, 20, 90)]);
        }
      } else if (kind === 'temp') {
        // warehouse temperature inside a 15–25 °C band, one excursion → alarm
        const top = Y(25, 10, 30), bot = Y(15, 10, 30);
        el('rect', { x: 0, y: top, width: 320, height: bot - top, class: 'area' }, svg);
        el('line', { x1: 0, x2: 320, y1: top, y2: top, class: 'thr' }, svg);
        el('line', { x1: 0, x2: 320, y1: bot, y2: bot, class: 'thr' }, svg);
        for (let x = 0; x <= 320; x += 2) {
          let v = 20 + 2.2 * Math.sin(x * 0.045) + 0.8 * Math.sin(x * 0.31);
          const bump = Math.exp(-Math.pow((x - 205) / 16, 2)) * 7.5;
          v += bump;
          pts.push([x, Y(v, 10, 30)]);
        }
        el('rect', { x: 190, y: 2, width: 30, height: top - 2, class: 'alarm', opacity: .25 }, svg);
      } else if (kind === 'reps') {
        // knee angle during 5 squats; each bottom = 1 rep
        for (let x = 0; x <= 320; x += 2) {
          const ph = (x - 10) / 60;
          const v = x < 10 || x > 310 ? 170 : 130 + 40 * Math.cos(ph * Math.PI * 2);
          pts.push([x, Y(v, 80, 180)]);
        }
        for (let i = 0; i < 5; i++) { const x = 10 + 30 + i * 60; el('line', { x1: x, x2: x, y1: 4, y2: 76, class: 'mark' }, svg); }
      }
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      el('path', { d: d + ' L320 80 L0 80 Z', class: 'area' }, svg);
      el('path', { d, class: 'wave' }, svg);
    });
  }
  drawSigs();

  /* ================= 3. RELAY SIMULATOR ================= */
  const relays = document.getElementById('relays');
  const term = document.getElementById('term');
  if (relays && term) {
    const state = [false, false, false, false];
    const gpio = [25, 26, 32, 33];
    let first = true, timer = null;
    const now = () => new Date().toTimeString().slice(0, 8);
    const log = (h) => {
      if (first) { term.innerHTML = ''; first = false; }
      const d = document.createElement('div'); d.innerHTML = h; term.appendChild(d);
      while (term.children.length > 50) term.removeChild(term.firstChild);
      term.scrollTop = term.scrollHeight;
    };
    const render = () => [...relays.children].forEach((b, i) => {
      b.setAttribute('aria-pressed', state[i]);
      b.querySelector('.s').textContent = state[i] ? 'ON' : 'OFF';
    });
    for (let i = 0; i < 4; i++) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'relay'; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<span class="led"></span><span class="n">RLY${i + 1}</span><span class="s">OFF</span>`;
      b.addEventListener('click', () => {
        state[i] = !state[i];
        const v = state[i] ? 'on' : 'off';
        log(`<span class="d">[${now()}] [CHAT]</span> trigger${i + 1}:${v}`);
        log(`  → <span class="k">GET /led${i + 1}/${v}</span> 200`);
        log(`  → GPIO${gpio[i]} ${state[i] ? 'LOW' : 'HIGH'} · Relay${i + 1}:${state[i] ? 'ON' : 'OFF'}`);
        render();
      });
      relays.appendChild(b);
    }
    document.getElementById('allOff').addEventListener('click', () => {
      state.fill(false);
      log(`<span class="d">[${now()}] [CHAT]</span> Button3:on`);
      log(`  → <span class="k">GET /button3/on</span> 200 · all relays HIGH`);
      render();
    });
    document.getElementById('dawn').addEventListener('click', () => {
      if (timer) return;
      log(`<span class="y">[06:00:00] NTP</span> watering schedule fired`);
      state.fill(true); render();
      log(`  → <span class="k">RLY1–4 ON</span> for 1000 ms`);
      timer = setTimeout(() => { state.fill(false); render(); log('  → RLY1–4 OFF'); timer = null; }, 1000);
    });
  }

  /* ================= 4. UI BITS ================= */
  // language level bars
  document.querySelectorAll('.lvl').forEach((l) => {
    const v = +l.dataset.v || 0;
    for (let i = 0; i < 5; i++) { const b = document.createElement('b'); if (i < v) b.className = 'on'; l.appendChild(b); }
  });

  // copy
  const toast = document.getElementById('toast');
  let toastT;
  function showToast(msg) {
    toast.textContent = msg; toast.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => (toast.hidden = true), 1400);
  }
  function selectText(node) {
    const r = document.createRange(); r.selectNodeContents(node);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  document.querySelectorAll('[data-copy]').forEach((b) => {
    b.addEventListener('click', () => {
      const v = b.dataset.copy;
      try {
        navigator.clipboard.writeText(v).then(() => showToast('คัดลอกแล้ว: ' + v), () => { selectText(b); showToast('เลือกข้อความแล้ว กด Ctrl+C'); });
      } catch (e) { selectText(b); showToast('เลือกข้อความแล้ว กด Ctrl+C'); }
    });
  });

  // lightbox
  const dlg = document.getElementById('zoom');
  const zi = document.getElementById('zoomImg');
  const zc = document.getElementById('zoomCap');
  document.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    const img = b.querySelector('img');
    zi.src = img.src; zi.alt = img.alt; zc.textContent = img.alt;
    if (dlg.showModal) dlg.showModal();
  }));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
})();
