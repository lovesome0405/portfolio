/* 유주상 포트폴리오 — 바닐라 JS. 외부 라이브러리 없음.
   1) 장이 바뀌면 배경 색조와 강조색을 바꾼다.
   2) 캔버스 점들이 장마다 다른 형체(고리 → AI → 지붕 → 방패 → 큐브 → 휴대폰 → 두 고리 → 열린 원)로 모인다.
   3) 내용은 화면에 들어올 때 나타난다. prefers-reduced-motion이면 2·3의 움직임을 끈다. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  if (!reduce.matches) root.classList.add('motion');

  /* 장별 색: bg는 배경, accent는 강조 글자·점 색 (어두운 배경 대비 AA 이상) */
  const THEME = {
    top:      { bg: '#0b0b0d', accent: '#d9d4ff', shape: 'ring' },
    about:    { bg: '#0e0f14', accent: '#cbd5ea', shape: 'ai' },
    naedon:   { bg: '#06201b', accent: '#7fe0c0', shape: 'shield' },
    villagen: { bg: '#170f2c', accent: '#c6adff', shape: 'cube' },
    lolypoly: { bg: '#091831', accent: '#94c6ff', shape: 'phone' },
    maru:     { bg: '#2b0f0c', accent: '#ffb48c', shape: 'roof' },
    rag:      { bg: '#22091c', accent: '#ff9ad5', shape: 'link' },
    contact:  { bg: '#0b0b0d', accent: '#f1efe9', shape: 'arc' },
  };

  const chapters = [...document.querySelectorAll('[data-chapter]')];
  /* 장 번호와 목차는 HTML의 섹션 순서에서 만든다: 섹션을 옮기기만 하면 번호·목차가 따라온다 */
  let chNo = 0;
  chapters.forEach(sec => {
    const tag = sec.querySelector('[data-chno]');
    if (!tag) return;
    chNo += 1;
    const n = String(chNo).padStart(2, '0');
    tag.textContent = 'CHAPTER ' + n;
    sec.dataset.num = n;
  });
  const railList = document.getElementById('rail-list');
  chapters.forEach(sec => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + sec.id; a.dataset.target = sec.dataset.chapter;
    const dot = document.createElement('span'); dot.className = 'rail-dot';
    const label = document.createElement('span'); label.className = 'rail-label'; label.textContent = sec.dataset.label;
    a.append(dot, label); li.append(a); railList.append(li);
  });
  const railLinks = [...railList.querySelectorAll('a')];
  const nowNum = document.getElementById('now-num');
  const nowLabel = document.getElementById('now-label');
  const nowFill = document.getElementById('now-fill');
  let current = null;

  function setChapter(id) {
    if (id === current || !THEME[id]) return;
    current = id;
    const t = THEME[id];
    root.style.setProperty('--bg', t.bg);
    root.style.setProperty('--accent', t.accent);
    railLinks.forEach(a => a.setAttribute('aria-current', a.dataset.target === id ? 'true' : 'false'));
    const el = document.getElementById(id);
    if (el) { nowNum.textContent = el.dataset.num || '—'; nowLabel.textContent = el.dataset.label; }
    field.morph(t.shape, t.accent);
  }

  /* ───────── 점 형체 ───────── */
  const field = (() => {
    const canvas = document.getElementById('field');
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, N = 0, P = [], stars = [], shapeName = 'ring', color = [217, 212, 255];
    let running = false, raf = 0, cache = {};

    const S = 220; // 형체를 그리는 보조 캔버스 크기
    const draw = {
      ring(c) { c.lineWidth = 10; c.beginPath(); c.arc(S/2, S/2, 80, 0, Math.PI*2); c.stroke();
        c.lineWidth = 4; c.beginPath(); c.arc(S/2, S/2, 46, 0, Math.PI*2); c.stroke(); },
      ai(c) { c.font = `800 190px "Big Shoulders Display", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('AI', S/2, S/2 + 8); },
      shield(c) { c.lineWidth = 12; c.lineJoin = 'round'; c.beginPath();
        c.moveTo(110, 18); c.lineTo(185, 46); c.bezierCurveTo(185, 130, 155, 175, 110, 202); c.bezierCurveTo(65, 175, 35, 130, 35, 46); c.closePath(); c.stroke();
        c.lineWidth = 14; c.beginPath(); c.moveTo(75, 110); c.lineTo(102, 138); c.lineTo(148, 86); c.stroke(); },
      cube(c) { c.lineWidth = 9; c.lineJoin = 'round';
        const t = [110, 22], l = [32, 66], r = [188, 66], m = [110, 110], bl = [32, 156], br = [188, 156], b = [110, 200];
        const seg = (a, z) => { c.beginPath(); c.moveTo(...a); c.lineTo(...z); c.stroke(); };
        seg(t, l); seg(t, r); seg(l, m); seg(r, m); seg(m, b); seg(l, bl); seg(r, br); seg(bl, b); seg(br, b); },
      phone(c) { c.lineWidth = 9; c.beginPath(); c.roundRect(58, 12, 104, 196, 18); c.stroke();
        c.fillRect(74, 40, 72, 22); for (let i = 0; i < 4; i++) c.fillRect(74, 76 + i * 24, 72 - (i % 2) * 22, 10);
        c.fillRect(96, 186, 28, 6); },
      roof(c) { c.lineWidth = 10; c.lineCap = 'round'; c.beginPath();
        c.moveTo(14, 70); c.quadraticCurveTo(60, 92, 110, 40); c.quadraticCurveTo(160, 92, 206, 70); c.stroke();
        c.beginPath(); c.moveTo(40, 96); c.lineTo(180, 96); c.stroke();
        c.lineWidth = 9; [58, 92, 128, 162].forEach(x => { c.beginPath(); c.moveTo(x, 104); c.lineTo(x, 196); c.stroke(); });
        c.beginPath(); c.moveTo(30, 200); c.lineTo(190, 200); c.stroke(); },
      link(c) { c.lineWidth = 8;
        c.beginPath(); c.arc(56, 110, 40, 0, Math.PI*2); c.stroke();
        c.beginPath(); c.arc(164, 110, 40, 0, Math.PI*2); c.stroke();
        c.lineWidth = 6; [[96, 110, 124, 110], [86, 84, 134, 84], [86, 136, 134, 136]].forEach(([a, b, x, y]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); });
        c.beginPath(); c.arc(110, 30, 14, 0, Math.PI*2); c.fill(); c.beginPath(); c.arc(110, 192, 14, 0, Math.PI*2); c.fill();
        c.lineWidth = 5; c.beginPath(); c.moveTo(70, 74); c.lineTo(100, 40); c.moveTo(150, 74); c.lineTo(120, 40); c.moveTo(70, 146); c.lineTo(100, 182); c.moveTo(150, 146); c.lineTo(120, 182); c.stroke(); },
      arc(c) { c.lineWidth = 11; c.lineCap = 'round'; c.beginPath(); c.arc(S/2, S/2, 82, Math.PI * 0.62, Math.PI * 2.28); c.stroke();
        c.beginPath(); c.arc(S/2 - 82 * Math.cos(Math.PI*0.38) + 6, S/2 + 82 * Math.sin(Math.PI*0.38) + 14, 7, 0, Math.PI*2); c.fill(); },
    };

    function sample(name) {
      if (cache[name] && cache[name].length === N) return cache[name];
      let pts = [];
      if (name === 'scatter') {
        for (let i = 0; i < N; i++) pts.push([Math.random() * 2.4 - 1.2, Math.random() * 2.4 - 1.2]);
      } else {
        const off = document.createElement('canvas'); off.width = off.height = S;
        const c = off.getContext('2d'); c.fillStyle = c.strokeStyle = '#fff';
        draw[name](c);
        const data = c.getImageData(0, 0, S, S).data;
        const hit = [];
        for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) if (data[(y * S + x) * 4 + 3] > 140) hit.push([x / S * 2 - 1, y / S * 2 - 1]);
        for (let i = hit.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [hit[i], hit[j]] = [hit[j], hit[i]]; }
        for (let i = 0; i < N; i++) { const h = hit[i % hit.length] || [0, 0]; pts.push([h[0] + (Math.random() - .5) * .012, h[1] + (Math.random() - .5) * .012]); }
      }
      cache[name] = pts;
      return pts;
    }

    function layout() {
      const desktop = W >= 1024;
      return desktop
        ? { cx: W * 0.3, cy: H * 0.5, r: Math.min(W * 0.2, H * 0.34), alpha: 0.9 }
        : { cx: W * 0.5, cy: H * 0.2, r: Math.min(W * 0.3, H * 0.15), alpha: 0.5 };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = W >= 1024 ? 1100 : 560;
      if (n !== N) {
        N = n; cache = {};
        P = Array.from({ length: N }, () => ({ x: Math.random() * W, y: Math.random() * H, tx: 0, ty: 0, k: 0.035 + Math.random() * 0.05, s: 0.7 + Math.random() * 1.3, ph: Math.random() * 6.28 }));
        stars = Array.from({ length: W >= 1024 ? 260 : 140 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.1 + 0.3, ph: Math.random() * 6.28 }));
      }
      retarget(false);
      if (!running) frame(performance.now(), true);
    }

    function retarget(scatterFirst) {
      const pts = sample(shapeName);
      const L = layout();
      for (let i = 0; i < N; i++) {
        P[i].tx = L.cx + pts[i][0] * L.r;
        P[i].ty = L.cy + pts[i][1] * L.r;
        if (scatterFirst) { P[i].x += (Math.random() - .5) * 60; P[i].y += (Math.random() - .5) * 60; }
      }
    }

    let target = [217, 212, 255];
    function hex(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }

    function frame(now, once) {
      const L = layout();
      for (let i = 0; i < 3; i++) color[i] += (target[i] - color[i]) * (once ? 1 : 0.05);
      ctx.clearRect(0, 0, W, H);
      // 배경 별
      ctx.fillStyle = 'rgb(241,239,233)';
      for (const s of stars) {
        ctx.globalAlpha = once ? 0.35 : 0.2 + 0.25 * (0.5 + 0.5 * Math.sin(now / 900 + s.ph));
        ctx.fillRect(s.x * W, s.y * H, s.s, s.s);
      }
      // 형체 점
      ctx.fillStyle = `rgb(${color.map(v => v | 0).join(',')})`;
      ctx.globalAlpha = L.alpha;
      const t = now / 1000;
      for (const p of P) {
        if (once) { p.x = p.tx; p.y = p.ty; }
        else {
          p.x += (p.tx - p.x) * p.k;
          p.y += (p.ty - p.y) * p.k;
        }
        const wob = once ? 0 : 1.4;
        ctx.fillRect(p.x + Math.sin(t * 1.3 + p.ph) * wob, p.y + Math.cos(t * 1.1 + p.ph) * wob, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      if (!once && running) raf = requestAnimationFrame(frame);
    }

    function start() { if (running || reduce.matches) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    reduce.addEventListener?.('change', () => { if (reduce.matches) { stop(); retarget(false); frame(0, true); } else start(); });
    addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });

    return {
      init() { resize(); start(); },
      morph(name, accent) {
        shapeName = name; target = hex(accent);
        if (!N) return;
        retarget(!reduce.matches);
        if (reduce.matches || !running) frame(performance.now(), true);
      },
      refresh() { cache = {}; retarget(false); if (!running) frame(performance.now(), true); },
    };
  })();

  /* ───────── 지금 읽는 장 찾기 ───────── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) setChapter(e.target.dataset.chapter); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  chapters.forEach(c => io.observe(c));

  /* ───────── 나타나기 ───────── */
  const reveals = document.querySelectorAll('.reveal');
  if (!reduce.matches && 'IntersectionObserver' in window) {
    const rio = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(r => rio.observe(r));
  } else reveals.forEach(r => r.classList.add('in'));

  /* ───────── 진행 띠 ───────── */
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    nowFill.style.width = (max > 0 ? Math.min(1, scrollY / max) * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  field.init();
  setChapter(chapters.find(c => c.getBoundingClientRect().bottom > innerHeight * 0.5)?.dataset.chapter || 'top');
  // 글꼴이 늦게 오면 'AI' 형체를 다시 그린다
  document.fonts?.ready.then(() => field.refresh());
})();
