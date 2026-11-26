/* Portfolio — Anuwat Nakwibool : interactions
   (ข้อมูลอยู่ใน js/data.js) */
(function () {
  const D = window.PORTFOLIO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  document.documentElement.classList.add('js');

  /* ---------- welcome screen: press START to enter ---------- */
  const welcome = $('#welcome');
  let started = false;
  const whenStarted = (fn) => (started ? fn() : document.addEventListener('portfolio:start', fn, { once: true }));
  const startPage = () => {
    if (started) return; started = true;
    if (welcome) {
      welcome.classList.add('out'); welcome.setAttribute('aria-hidden', 'true');
      setTimeout(() => welcome.remove(), 800);
    }
    document.body.classList.remove('locked');
    document.dispatchEvent(new Event('portfolio:start'));
  };
  if (welcome) {
    document.body.classList.add('locked');
    welcome.removeAttribute('aria-hidden');
    const t = $('#welcomeType'), full = t.textContent;
    if (!reduce) { t.textContent = ''; let i = 0; const iv = setInterval(() => { t.textContent = full.slice(0, ++i); if (i >= full.length) clearInterval(iv); }, 55); }
    const btn = $('#startBtn');
    btn.addEventListener('click', startPage);
    document.addEventListener('keydown', (e) => { if (!started && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); startPage(); } });
    setTimeout(() => btn.focus({ preventScroll: true }), 50);
  } else { started = true; }

  /* ---------- navbar ---------- */
  const nav = $('#nav'), burger = $('#burger'), links = $('#links');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open); links.classList.toggle('open', open);
  });
  $$('a', links).forEach((a) => a.addEventListener('click', () => { burger.setAttribute('aria-expanded', 'false'); links.classList.remove('open'); }));
  const secs = ['home', 'about', 'portfolio', 'contact'].map((id) => document.getElementById(id));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) $$('a', links).forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach((s) => io.observe(s));
  }

  /* ---------- typed roles ---------- */
  const typed = $('#typed');
  if (reduce) typed.textContent = D.roles[0];
  else {
    let r = 0, c = 0, del = false;
    (function loop() {
      const word = D.roles[r];
      typed.textContent = word.slice(0, c);
      if (!del && c < word.length) c++;
      else if (!del) { del = true; return setTimeout(loop, 1600); }
      else if (c > 0) c--;
      else { del = false; r = (r + 1) % D.roles.length; }
      setTimeout(loop, del ? 35 : 75);
    })();
  }

  /* ---------- code window: 3 files + Run → serial monitor ---------- */
  const FILES = [
    {
      lang: 'cpp', name: 'Serial Monitor', baud: '115200 baud',
      code: `// trigger จาก Minecraft → รีเลย์จริง
#include <WiFi.h>
#include <WebServer.h>

WebServer server(80);
#define RELAYPIN1 25

void handleLED1On() {
  digitalWrite(RELAYPIN1, LOW);
  Serial.println("Relay1:ON");
  server.send(200, "text/plain", "LED1 ON");
}

void setup() {
  WiFi.begin(ssid, password);
  server.on("/led1/on", handleLED1On);
  server.begin();
}`,
      run: [
        ['d', 'ets Jun  8 2016 · rst:0x1 (POWERON_RESET)'],
        ['', 'Connecting WiFi.....'],
        ['ok', '✅ WiFi connected. IP Address: 192.168.1.39'],
        ['ok', '🚀 HTTP server started'],
        ['d', 'GET /led1/on'],
        ['w', 'Relay1:ON', 'relay'],
      ],
    },
    {
      lang: 'py', name: 'Terminal', baud: 'python 3.11',
      code: `import time, requests

esp_ip = "http://192.168.1.39"

def send_command(relay, state):
    url = f"{esp_ip}/led{relay}/{state}"
    r = requests.get(url, timeout=5)
    print(f"LED{relay}: {state} → {r.status_code}")

with open(log_path, encoding="utf-8") as f:
    f.seek(0, 2)
    while True:
        line = f.readline()
        if "trigger1:on" in line:
            send_command(1, "on")`,
      run: [
        ['d', '$ python trigger_esp.py'],
        ['', 'watching .minecraft/logs/latest.log ...'],
        ['d', '[CHAT] [@] trigger1:on'],
        ['ok', '🔧 LED1: on → 200', 'relay'],
        ['d', '[CHAT] [@] trigger2:on'],
        ['ok', '🔧 LED2: on → 200', 'relay'],
      ],
    },
    {
      lang: 'js', name: 'Metro · Expo', baud: 'WebSocket',
      code: `// FitAI · Camera AI
const ws = new WebSocket(\`ws://\${HOST}:8000/stream\`);

ws.onopen = () =>
  ws.send(JSON.stringify({ exercise: 'squat' }));

ws.onmessage = (e) => {
  const { rep_count, phase, joints } = JSON.parse(e.data);
  setReps(rep_count);
  setPhase(phase);      // 'down' | 'up'
  drawSkeleton(joints);
};`,
      run: [
        ['d', '▶ connecting ws://192.168.1.50:8000/stream'],
        ['ok', '✓ open · exercise=squat'],
        ['', 'phase: down'], ['w', 'phase: up · reps 1', 'rep'],
        ['', 'phase: down'], ['w', 'phase: up · reps 2', 'rep'],
        ['', 'phase: down'], ['w', 'phase: up · reps 3', 'rep'],
      ],
    },
  ];
  const KW = {
    cpp: /(#include|#define|\bvoid\b|\bWebServer\b)/g,
    py: /\b(import|def|with|as|while|True|if|in|print|open)\b/g,
    js: /\b(const|new|JSON|=&gt;)\b|(=&gt;)/g,
  };
  function highlight(src, lang) {
    return esc(src)
      .replace(/(\/\/[^\n]*|#(?!include|define)[^\n]*)/g, (m) => (lang === 'cpp' && m.startsWith('#') ? m : `<span class="cm">${m}</span>`))
      .replace(/(&quot;[^&\n]*?&quot;|'[^'\n]*'|`[^`]*`|&lt;[\w.]+&gt;)/g, '<span class="st">$1</span>')
      .replace(KW[lang], '<span class="kw">$&</span>')
      .replace(/\b(\d+)\b(?![^<]*>)/g, '<span class="nu">$1</span>')
      .replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="fn">$1</span>');
  }
  const codeBox = $('#codeBox'), out = $('#serialOut'), runBtn = $('#runBtn'), dot = $('#serialDot');
  const fileTabs = $$('.cw-tabs [role=tab]');
  let cur = 0, typeTimer = null, runTimer = null, autoRan = false;
  let relayCount = 0, reps = 0;
  function showFile(i, animate) {
    cur = i; clearTimeout(typeTimer); stopRun();
    fileTabs.forEach((t, k) => t.setAttribute('aria-selected', k === i));
    const f = FILES[i];
    $('#serialName').textContent = f.name; $('#serialBaud').textContent = f.baud;
    out.innerHTML = '<span class="d">กด ▶ Run เพื่อดูผลลัพธ์</span>';
    if (!animate || reduce) { codeBox.innerHTML = highlight(f.code, f.lang); return; }
    let n = 0;
    (function step() {
      n = Math.min(f.code.length, n + 3);
      codeBox.innerHTML = highlight(f.code.slice(0, n), f.lang) + '<span class="caret"></span>';
      if (n < f.code.length) typeTimer = setTimeout(step, 14);
      else { codeBox.innerHTML = highlight(f.code, f.lang); if (!autoRan) { autoRan = true; setTimeout(run, 500); } }
    })();
  }
  function stopRun() { clearTimeout(runTimer); runBtn.classList.remove('busy'); dot.classList.remove('live'); }
  function bump(el, val) { el.textContent = val; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function run() {
    if (runBtn.classList.contains('busy')) return;
    const f = FILES[cur]; out.innerHTML = ''; runBtn.classList.add('busy'); dot.classList.add('live');
    let k = 0;
    (function next() {
      if (k >= f.run.length) { runBtn.classList.remove('busy'); setTimeout(() => dot.classList.remove('live'), 800); return; }
      const [cls, txt, fx] = f.run[k++];
      const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = txt; out.appendChild(d); out.scrollTop = out.scrollHeight;
      if (fx === 'relay') bump($('#fRelay'), 'ON');
      if (fx === 'rep') bump($('#fReps'), ++reps);
      runTimer = setTimeout(next, reduce ? 0 : 420);
    })();
  }
  fileTabs.forEach((t, i) => t.addEventListener('click', () => showFile(i, true)));
  runBtn.addEventListener('click', run);
  showFile(0, false);                       // complete at rest
  if (!reduce) whenStarted(() => setTimeout(() => showFile(0, true), 700));

  /* ---------- hero: network canvas, spotlight, tilt, scramble, magnet ---------- */
  const home = $('#home'), net = $('#net');
  const fine = window.matchMedia('(pointer: fine)').matches;
  const mouse = { x: -9999, y: -9999 };
  home.addEventListener('pointermove', (e) => {
    const r = home.getBoundingClientRect();
    mouse.x = e.clientX - net.getBoundingClientRect().left; mouse.y = e.clientY - r.top;
    home.style.setProperty('--mx', (e.clientX - net.getBoundingClientRect().left) + 'px');
    home.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
  home.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

  if (net && !reduce) {
    const ctx = net.getContext('2d'); let W, H, pts = [], vis = true, dpr = 1;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2); W = net.offsetWidth; H = net.offsetHeight;
      net.width = W * dpr; net.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(90, Math.round((W * H) / 16000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }));
    };
    size(); addEventListener('resize', size);
    new IntersectionObserver((es) => (vis = es[0].isIntersecting)).observe(home);
    (function frame() {
      if (vis) {
        ctx.clearRect(0, 0, W, H);
        for (const p of pts) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 140) { p.x += (dx / d) * 1.2; p.y += (dy / d) * 1.2; }
        }
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i];
          for (let j = i + 1; j < pts.length; j++) {
            const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 130) { ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 130) * .16})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
          }
          const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
          if (dm < 200) { ctx.strokeStyle = `rgba(255,255,255,${(1 - dm / 200) * .35})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
          ctx.fillStyle = dm < 200 ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.35)';
          ctx.beginPath(); ctx.arc(a.x, a.y, dm < 200 ? 2.2 : 1.5, 0, 6.283); ctx.fill();
        }
      }
      requestAnimationFrame(frame);
    })();
  }

  // 3D tilt + parallax floats + glare
  const tilt = $('#tilt');
  if (tilt && fine && !reduce) {
    const wrap = tilt.parentElement; wrap.style.perspective = '1100px';
    $$('.float', tilt).forEach((f) => f.style.setProperty('--z', (f.dataset.depth || 40) + 'px'));
    wrap.addEventListener('pointermove', (e) => {
      const r = tilt.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      tilt.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 8}deg)`;
      const cw = $('.code-win', tilt);
      cw.style.setProperty('--gx', (px + .5) * 100 + '%'); cw.style.setProperty('--gy', (py + .5) * 100 + '%');
    });
    wrap.addEventListener('pointerleave', () => (tilt.style.transform = ''));
  }

  // scramble / decode text
  const GLYPHS = '01<>/{}[]#$%&*+=';
  function scramble(el) {
    if (reduce || el._busy) return; el._busy = true;
    const final = el.dataset.text || (el.dataset.text = el.textContent);
    let f = 0; const total = 22;
    (function tick() {
      let s = '';
      for (let i = 0; i < final.length; i++) {
        const ch = final[i];
        if (ch === ' ' || i < (f / total) * final.length) s += esc(ch);
        else s += `<span class="sc">${GLYPHS[(Math.random() * GLYPHS.length) | 0]}</span>`;
      }
      el.innerHTML = s;
      if (++f <= total) setTimeout(tick, 32); else { el.textContent = final; el._busy = false; }
    })();
  }
  $$('.home [data-scramble]').forEach((el, i) => {
    el.dataset.text = el.textContent;
    el.addEventListener('pointerenter', () => scramble(el));
    whenStarted(() => setTimeout(() => scramble(el), 350 + i * 250));
  });

  // magnetic buttons
  if (fine && !reduce) $$('.magnet').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    b.addEventListener('pointerleave', () => (b.style.transform = ''));
  });

  /* ---------- icons ---------- */
  const I = {
    code: '<svg viewBox="0 0 24 24"><path d="M8 6 2 12l6 6M16 6l6 6-6 6"/></svg>',
    layers: '<svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 2 3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    cap: '<svg viewBox="0 0 24 24"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
    gh: '<svg viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.4 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8 5 5 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A5 5 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.8c0 5.4 3.3 6.6 6.4 7a3.4 3.4 0 0 0-.9 2.6V22"/></svg>',
  };

  /* ---------- stats ---------- */
  $('#stats').innerHTML = [
    [I.code, D.projects.length, 'Total Projects', 'IoT, AI, Mobile และไฟฟ้ากำลัง'],
    [I.layers, D.tech.length, 'Tech Stack', 'ภาษาและเครื่องมือที่ใช้ทำงาน'],
    [I.globe, D.langs.length, 'Languages', 'ไทย · English · 中文'],
  ].map(([ic, n, h, p]) => `<a class="stat glass reveal" href="#portfolio"><div class="s-top"><span class="s-ic">${ic}</span><b>${n}</b></div>
    <h4>${h}</h4><div class="s-top"><p>${p}</p><span class="arr">${I.arrow}</span></div></a>`).join('');

  /* ---------- projects ---------- */
  $('#projGrid').innerHTML = D.projects.map((p) => `
    <button class="p-card glass reveal" type="button" data-open="${p.id}">
      <div class="p-img"><img src="${p.cover}" alt="${esc(p.title)}"><span class="p-sub">${esc(p.subtitle)}</span></div>
      <div class="p-body">
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.short)}</p>
        <div class="p-tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        <div class="p-more"><small style="color:var(--faint)">${p.tech.length} technologies</small><span>Details ${I.arrow}</span></div>
      </div>
    </button>`).join('');

  /* ---------- education ---------- */
  $('#eduGrid').innerHTML = '<i class="edu-fill" id="eduFill"></i>' + D.education.map((e, i) => `
    <div class="edu${e.now ? ' now' : ''}" style="--i:${i}">
      <span class="dot">${I.cap}</span>
      <div class="card glass"><span class="lvl">${esc(e.level)}</span><h4>${esc(e.school)}</h4>${e.detail ? `<p>${esc(e.detail)}</p>` : ''}
      ${e.now ? '<span class="now-tag">กำลังศึกษา</span>' : ''}
      ${e.project ? `<button class="edu-link" type="button" data-open="${e.project}">ดูโครงงาน ${I.arrow}</button>` : ''}</div>
    </div>`).join('');

  /* ---------- tech stack ---------- */
  $('#techGrid').innerHTML = D.tech.map((t, i) => {
    const abbr = esc(t.abbr || t.name.slice(0, 2));
    const ic = t.icon
      ? `<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${t.icon}.svg" alt="" class="${t.invert ? 'inv' : ''}" loading="lazy" data-abbr="${abbr}">`
      : `<span class="abbr">${abbr}</span>`;
    return `<div class="tech glass" style="--i:${i}"><span class="t-ic">${ic}</span><span>${esc(t.name)}</span></div>`;
  }).join('');
  $$('#techGrid img').forEach((img) => img.addEventListener('error', () => {
    const s = document.createElement('span'); s.className = 'abbr'; s.textContent = img.dataset.abbr; img.replaceWith(s);
  }));
  $('#langs').outerHTML = `<div class="langs glass"><h4>ภาษา</h4>${D.langs.map(([n, l, v]) =>
    `<div class="lang"><span>${esc(n)}</span><div class="bar"><i style="width:${v}%"></i></div><small>${esc(l)}</small></div>`).join('')}</div>`;

  /* ---------- tabs ---------- */
  const tabs = $$('.tabs [role=tab]'), ind = $('#tabInd');
  tabs.forEach((t, i) => t.addEventListener('click', () => {
    tabs.forEach((x) => x.setAttribute('aria-selected', x === t));
    $$('.panel').forEach((p) => (p.hidden = p.id !== 'p-' + t.dataset.tab));
    ind.style.transform = `translateX(${i * 100}%)`;
  }));
  $('.tabs').addEventListener('keydown', (e) => {
    const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; tabs[n].click(); tabs[n].focus();
    }
  });

  /* ---------- project detail ---------- */
  const detail = $('#detail'), dBody = $('#dBody');
  let lastFocus = null;
  function openDetail(id) {
    const p = D.projects.find((x) => x.id === id); if (!p) return;
    lastFocus = document.activeElement;
    dBody.innerHTML = `
      <div class="d-top"><button class="d-back" type="button" data-close>${I.back} Back</button>
        <span class="crumb">Projects › <b>${esc(p.title)}</b></span></div>
      <div class="d-hero">
        <div>
          <h2 id="dTitle" class="grad">${esc(p.title)}</h2>
          <p class="d-sub">${esc(p.subtitle)}</p>
          <div class="d-line"></div>
          <p class="d-desc">${esc(p.desc)}</p>
          <div class="d-stats">
            <div class="d-stat glass"><span class="s-ic">${I.code}</span><div><b>${p.tech.length}</b><span><br>Total Technology</span></div></div>
            <div class="d-stat glass"><span class="s-ic">${I.layers}</span><div><b>${p.features.length}</b><span><br>Key Features</span></div></div>
          </div>
          <div class="d-actions">
            ${p.repo ? `<a class="btn primary" href="${p.repo}" target="_blank" rel="noopener">${I.gh} GitHub</a>` : ''}
            <a class="btn ghost" href="#contact" data-close>สอบถามเพิ่มเติม ${I.arrow}</a>
          </div>
          <h3 style="margin-top:28px;font-size:1rem;display:flex;gap:8px;align-items:center">${I.code} Technologies Used</h3>
          <div class="d-tech">${p.tech.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        </div>
        <button class="d-cover" type="button" data-zoom data-cap="${esc(p.gallery[0].cap)}"><img src="${p.cover}" alt="${esc(p.title)}"></button>
      </div>
      <div class="d-cols">
        <div class="d-box glass"><h3>${I.user} สิ่งที่ผมทำ</h3><ul class="d-list">${p.role.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
          ${p.team ? `<p class="d-team">ทีม: ${esc(p.team)}</p>` : ''}</div>
        <div class="d-box glass"><h3>${I.star} Key Features</h3><ul class="d-list">${p.features.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>
      </div>
      ${p.pipeline ? `<ol class="pipe">${p.pipeline.map(([b, c]) => `<li><b>${esc(b)}</b><code>${esc(c)}</code></li>`).join('')}</ol>` : ''}
      ${p.compare ? compareHTML(p.compare) : ''}
      ${p.charts ? `<div class="charts">${p.charts.map(chartHTML).join('')}</div>` : ''}
      ${p.simulator ? simHTML() : ''}
      ${p.phones ? `<div class="phones">${p.phones.map(([s, n]) => `<div class="phone"><button type="button" data-zoom data-cap="${esc(n)}"><img src="${s}" alt="หน้า ${esc(n)}"></button><span>${esc(n)}</span></div>`).join('')}</div>` : ''}
      <div class="gal">${p.gallery.map((g) => `<figure><button type="button" data-zoom data-cap="${esc(g.cap)}"><img class="${g.contain ? 'contain' : ''}" src="${g.src}" alt="${esc(g.cap)}"></button><figcaption>${esc(g.cap)}</figcaption></figure>`).join('')}</div>`;
    detail.hidden = false; detail.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    if (p.simulator) initSim();
    $('.d-back', dBody).focus();
  }
  function closeDetail() {
    detail.hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]'); if (o) return openDetail(o.dataset.open);
    const c = e.target.closest('[data-close]'); if (c && detail.contains(c)) { closeDetail(); }
    const z = e.target.closest('[data-zoom]'); if (z) zoom(z);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !detail.hidden && !$('#zoom').open) closeDetail(); });

  /* ---------- charts + comparison table ---------- */
  function compareHTML(c) {
    return `<div class="d-box glass"><h3>${I.layers} เทียบกับเครื่องตัดหญ้าเบนซิน</h3><div class="tbl"><table>
      <thead><tr>${c.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${c.rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
  }
  function chartHTML(c) {
    const W = 420, H = 210, L = 40, R = 16, T = 16, B = 30;
    const xs = (i) => L + (i * (W - L - R)) / (c.y.length - 1);
    const ys = (v) => T + ((c.max - v) / (c.max - c.min)) * (H - T - B);
    let g = '';
    for (let v = c.min; v <= c.max; v++) g += `<line x1="${L}" x2="${W - R}" y1="${ys(v)}" y2="${ys(v)}" class="gl"/><text x="${L - 8}" y="${ys(v) + 4}" text-anchor="end">${v}</text>`;
    const pts = c.y.map((v, i) => `${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(' ');
    const area = `M${xs(0)},${H - B} L${pts.replace(/ /g, ' L')} L${xs(c.y.length - 1)},${H - B} Z`;
    const dots = c.y.map((v, i) => `<g style="--i:${i}"><circle cx="${xs(i)}" cy="${ys(v)}" r="4"/><text x="${i === 0 ? xs(i) + 6 : xs(i)}" y="${ys(v) - 10}" text-anchor="${i === 0 ? 'start' : 'middle'}" class="val">${v}</text></g>`).join('');
    const xl = c.x.map((x, i) => `<text x="${xs(i)}" y="${H - 8}" text-anchor="middle">${esc(x)}</text>`).join('');
    return `<figure class="chart glass"><figcaption>${esc(c.title)} <small>(${c.unit})</small></figcaption>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}: ${c.y.join(', ')} ${c.unit}">${g}<path d="${area}" class="ar"/><polyline points="${pts}" class="ln"/>${dots}${xl}</svg></figure>`;
  }

  /* ---------- relay simulator ---------- */
  function simHTML() {
    return `<div class="sim glass"><div class="sim-board"><h3>ลองกดดู: สั่งรีเลย์จากในเกม</h3>
      <p>แต่ละช่องคือรีเลย์บน ESP32 (GPIO 25, 26, 32, 33) กดแล้วดูว่าคำสั่งเดินทางจากแชทในเกมไปถึงขาของบอร์ดอย่างไร</p>
      <div class="relays" id="relays"></div>
      <div class="sim-btns"><button class="sbtn" id="allOff" type="button">ปิดทั้งหมด</button><button class="sbtn" id="dawn" type="button">จำลองเวลา 06:00</button></div></div>
      <div class="term" id="term" aria-live="polite"><span class="d">$ tail -f latest.log  # กดรีเลย์เพื่อส่ง trigger</span></div></div>`;
  }
  function initSim() {
    const relays = $('#relays'), term = $('#term');
    const state = [false, false, false, false], gpio = [25, 26, 32, 33];
    let first = true, timer = null;
    const now = () => new Date().toTimeString().slice(0, 8);
    const log = (h) => { if (first) { term.innerHTML = ''; first = false; }
      const d = document.createElement('div'); d.innerHTML = h; term.appendChild(d);
      while (term.children.length > 50) term.removeChild(term.firstChild); term.scrollTop = term.scrollHeight; };
    const render = () => [...relays.children].forEach((b, i) => { b.setAttribute('aria-pressed', state[i]); b.querySelector('.s').textContent = state[i] ? 'ON' : 'OFF'; });
    for (let i = 0; i < 4; i++) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'relay'; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<span class="led"></span><span class="n">RLY${i + 1}</span><span class="s">OFF</span>`;
      b.addEventListener('click', () => { state[i] = !state[i]; const v = state[i] ? 'on' : 'off';
        log(`<span class="d">[${now()}] [CHAT]</span> trigger${i + 1}:${v}`);
        log(`  → <span class="k">GET /led${i + 1}/${v}</span> <span class="g">200</span>`);
        log(`  → GPIO${gpio[i]} ${state[i] ? 'LOW' : 'HIGH'} · Relay${i + 1}:${state[i] ? 'ON' : 'OFF'}`); render(); });
      relays.appendChild(b);
    }
    $('#allOff').addEventListener('click', () => { state.fill(false); log(`<span class="d">[${now()}] [CHAT]</span> Button3:on`); log('  → <span class="k">GET /button3/on</span> <span class="g">200</span> · ปิดทุกช่อง'); render(); });
    $('#dawn').addEventListener('click', () => { if (timer) return; log('<span class="k">[06:00:00] NTP</span> ถึงเวลารดน้ำ'); state.fill(true); render();
      log('  → เปิดรีเลย์ 1–4 นาน 1 วินาที'); timer = setTimeout(() => { state.fill(false); render(); log('  → ปิดรีเลย์ทั้งหมด'); timer = null; }, 1000); });
  }

  /* ---------- lightbox ---------- */
  const dlg = $('#zoom'), zi = $('#zoomImg'), zc = $('#zoomCap');
  function zoom(btn) {
    const img = btn.querySelector('img'); if (!img) return;
    zi.src = img.src; zi.alt = img.alt; zc.textContent = btn.dataset.cap || img.alt;
    if (dlg.showModal) dlg.showModal();
  }
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  /* ---------- copy + toast ---------- */
  const toast = $('#toast'); let tt;
  const show = (m) => { toast.textContent = m; toast.hidden = false; clearTimeout(tt); tt = setTimeout(() => (toast.hidden = true), 1600); };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', () => {
    const v = b.dataset.copy;
    try { navigator.clipboard.writeText(v).then(() => show('คัดลอกแล้ว: ' + v), () => show(v)); } catch (e) { show(v); }
  }));

  /* ---------- contact form → mailto ---------- */
  $('#form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#fName').value.trim(), email = $('#fEmail').value.trim(), msg = $('#fMsg').value.trim(), err = $('#fErr');
    if (!name || !msg || !/^\S+@\S+\.\S+$/.test(email)) { err.textContent = 'กรอกชื่อ อีเมลที่ถูกต้อง และข้อความให้ครบก่อนส่ง'; err.hidden = false; return; }
    err.hidden = true;
    const body = `${msg}\n\n— ${name} (${email})`;
    window.location.href = `mailto:guy-590uri@outlook.co.th?subject=${encodeURIComponent('ติดต่อจากเว็บพอร์ตโฟลิโอ: ' + name)}&body=${encodeURIComponent(body)}`;
    show('กำลังเปิดโปรแกรมอีเมล ถ้าไม่ขึ้น ส่งมาที่ guy-590uri@outlook.co.th');
  });

  /* ---------- reveal on scroll (visible at rest; only lifts) ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    const els = $$('.reveal').filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    els.forEach((el) => el.classList.add('pre'));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* =================== interactions for every section =================== */
  const finePtr = window.matchMedia('(pointer: fine)').matches;

  // scroll progress + back-to-top ring
  const prog = $('#progress'), toTop = $('#toTop');
  const onProg = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    const v = h > 0 ? Math.min(1, scrollY / h) : 0;
    prog.style.setProperty('--p', v); toTop.style.setProperty('--p', v);
    toTop.classList.toggle('show', scrollY > innerHeight * .8);
  };
  addEventListener('scroll', onProg, { passive: true }); onProg();
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  // custom cursor
  if (finePtr && !reduce) {
    const dotEl = $('#curDot'), ring = $('#curRing');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY; document.body.classList.add('has-cursor');
      const t = e.target;
      ring.classList.toggle('text', !!t.closest('input,textarea'));
      ring.classList.toggle('hover', !t.closest('input,textarea') && !!t.closest('a,button,[data-open],[data-zoom],.tech,.relay'));
    });
    addEventListener('pointerdown', () => ring.classList.add('down'));
    addEventListener('pointerup', () => ring.classList.remove('down'));
    document.addEventListener('pointerleave', () => document.body.classList.remove('has-cursor'));
    (function loop() {
      rx += (x - rx) * .18; ry += (y - ry) * .18;
      dotEl.style.transform = `translate(${x}px,${y}px)`; ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    })();
  }

  // spotlight border on every glass card + 3D tilt on project/stat cards
  if (finePtr) document.addEventListener('pointermove', (e) => {
    const g = e.target.closest('.glass');
    if (g) {
      g.classList.add('spot-card');
      const r = g.getBoundingClientRect();
      g.style.setProperty('--sx', e.clientX - r.left + 'px'); g.style.setProperty('--sy', e.clientY - r.top + 'px');
      if (!reduce && g.matches('.p-card,.stat')) {
        g.classList.add('tilt-card');
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        g.style.setProperty('--rx', (-py * 7).toFixed(2) + 'deg'); g.style.setProperty('--ry', (px * 9).toFixed(2) + 'deg');
        g.style.setProperty('--ix', (-px * 10).toFixed(1) + 'px'); g.style.setProperty('--iy', (-py * 8).toFixed(1) + 'px');
      }
    }
  });

  // photo tilt
  const pw = $('.photo-wrap');
  if (pw && finePtr && !reduce) {
    pw.addEventListener('pointermove', (e) => {
      const r = pw.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      pw.style.transform = `perspective(800px) rotateY(${px * 14}deg) rotateX(${-py * 14}deg)`;
    });
    pw.addEventListener('pointerleave', () => (pw.style.transform = ''));
  }

  // count-up numbers + section-title scramble when they scroll into view
  const countUp = (el) => {
    const end = +el.textContent || 0; if (reduce || !end) return;
    const t0 = performance.now(), dur = 1100;
    (function f(t) { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
  };
  if ('IntersectionObserver' in window) {
    const seen = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      if (e.target.matches('.stat b')) countUp(e.target); else scramble(e.target);
      seen.unobserve(e.target);
    }), { threshold: .6 });
    $$('.stat b, .sec-title [data-scramble]').forEach((el) => seen.observe(el));
    $$('.sec-title [data-scramble]').forEach((el) => { el.dataset.text = el.textContent; el.addEventListener('pointerenter', () => scramble(el)); });
  }

  // tech marquee
  const mq = $('#mqTrack');
  if (mq) {
    const names = D.tech.map((t) => t.name).concat(['IoT', 'Embedded', 'AI', 'PCB Design']);
    const row = names.map((n) => `<span>${esc(n)}</span><i></i>`).join('');
    mq.innerHTML = row + row;
  }

  // education timeline fills as you scroll
  const eduGrid = $('#eduGrid');
  const onEdu = () => {
    const fill = $('#eduFill'); if (!fill || eduGrid.offsetParent === null) return;
    const r = eduGrid.getBoundingClientRect();
    const v = Math.max(0, Math.min(1, (innerHeight * .7 - r.top) / r.height));
    fill.style.setProperty('--ef', v);
    $$('.edu', eduGrid).forEach((e) => { const d = e.querySelector('.dot').getBoundingClientRect(); e.classList.toggle('lit', d.top < innerHeight * .7); });
  };
  addEventListener('scroll', onEdu, { passive: true });
  $$('.tabs [role=tab]').forEach((t) => t.addEventListener('click', () => setTimeout(onEdu, 30)));

  // ripple on buttons
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn,.run,.sbtn,.d-back'); if (!b || reduce) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
    const sp = document.createElement('span'); sp.className = 'ripple';
    sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(sp); setTimeout(() => sp.remove(), 650);
  });

  // contact: character counter + paper-plane send animation
  const msg = $('#fMsg');
  if (msg) {
    const cc = document.createElement('span'); cc.className = 'char-count'; cc.textContent = '0 / 500';
    msg.maxLength = 500; msg.closest('.field').after(cc);
    msg.addEventListener('input', () => (cc.textContent = `${msg.value.length} / 500`));
    $('#form').addEventListener('submit', () => {
      const b = $('#form .btn'); if ($('#fErr').hidden) { b.classList.remove('sent'); void b.offsetWidth; b.classList.add('sent'); }
    });
  }

  /* ---------- About name: letters shimmer, wave on hover, click to swap EN / TH ---------- */
  const nameEl = $('#nameFx');
  if (nameEl) {
    const NAMES = ['Anuwat Nakwibool', 'อนุวัตร นาควิบูลย์'];
    let which = 0;
    const lerp = (a, b, k) => Math.round(a + (b - a) * k);
    function render(text, pop) {
      // Thai: keep vowel/tone marks with their base letter by splitting on grapheme clusters
      const seg = window.Intl && Intl.Segmenter ? [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text)].map((x) => x.segment) : [...text];
      const n = seg.length; let i = 0;
      nameEl.innerHTML = seg.join('').split(' ').map((word) => {
        const parts = (window.Intl && Intl.Segmenter ? [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(word)].map((x) => x.segment) : [...word]);
        return '<span class="w">' + parts.map((ch) => {
          const k = n > 1 ? i / (n - 1) : 0, c = `rgb(${lerp(255, 113, k)},${lerp(255, 113, k)},${lerp(255, 122, k)})`;
          return `<span class="l${pop ? ' pop' : ''}" style="--i:${i++};--c:${c}">${esc(ch)}</span>`;
        }).join('') + '</span>';
      }).join(' ');
      i; // spaces keep word wrapping natural
    }
    render(NAMES[0], false);
    // hover wave: letters near the cursor lift most
    nameEl.addEventListener('pointermove', (e) => {
      $$('.l', nameEl).forEach((l) => {
        const r = l.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2));
        l.style.setProperty('--wave', Math.max(0, 1 - d / 120).toFixed(2));
      });
    });
    nameEl.addEventListener('pointerleave', () => $$('.l', nameEl).forEach((l) => l.style.setProperty('--wave', 0)));
    const swap = () => {
      which ^= 1; render(NAMES[which], !reduce);
      nameEl.setAttribute('aria-label', NAMES[which] + (which ? ' กดเพื่อสลับเป็นภาษาอังกฤษ' : ' กดเพื่อสลับเป็นชื่อภาษาไทย'));
    };
    nameEl.addEventListener('click', swap);
    nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); swap(); } });
    // letters drop in the first time the name scrolls into view
    if (!reduce && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { render(NAMES[which], true); io.disconnect(); } }, { threshold: .6 });
      io.observe(nameEl);
    }
  }
})();
