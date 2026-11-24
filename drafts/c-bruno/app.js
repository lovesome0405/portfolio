/* 시안 C · 성장 노선도
   2D SVG 지도 위에서 열차(현재 위치 표시)를 움직여 역(프로젝트)을 발견하는 탐색.
   JS가 꺼져 있으면 지도는 숨겨지고 목록(#list)만 보인다. */
(() => {
  'use strict';

  const W = 2800;   // 지도 세계 너비(세계 단위)
  const H = 560;    // 지도 세계 높이
  const SVGNS = 'http://www.w3.org/2000/svg';
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reduceMQ.matches;
  reduceMQ.addEventListener?.('change', (e) => { reduced = e.matches; });

  /* 역 데이터: 사실은 루트 index.html 근거. 근거 없는 이야기는 fill(자리표시)로 둔다. */
  const STATIONS = [
    {
      id: 's-start', x: 250, y: 330, label: 'down', time: '출발 · 2026', name: '춘천',
      title: '출발역: 춘천, AI융합과',
      one: '한국폴리텍대학 춘천캠퍼스 AI융합과 1학년. 데이터와 소프트웨어로 실제 문제를 푸는 개발자가 되려고 합니다.',
      facts: [['짐 칸', 'ADsP, 리눅스마스터 2급, 당근마켓 클론(Django, 실시간 채팅) · 시기 확인 필요']],
      fill: '[주상이 채울 부분: 왜 AI융합과에 왔는지]',
      actions: [['자세히', '#s-start', true]],
      icon: 'lake'
    },
    {
      id: 's-naedon', x: 740, y: 220, label: 'up', time: '2026.09', name: '내돈내편',
      title: '내돈내편',
      one: '고령층이 말로 금융 업무를 준비하고, 송금 전에 피싱 위험을 한 번 더 확인하게 돕습니다.',
      facts: [['역할', '2인 팀의 팀장, 기획·개발·배포'], ['기술', 'Next.js, TypeScript, OpenAI API'], ['결과', '2026 금융 AI Challenge 출품, 웹 공개']],
      img: '../../assets/video/naedon.jpg',
      fill: '[주상이 채울 부분: 이 역에서 배운 것]',
      actions: [['자세히', '#s-naedon', true], ['사이트에서 해보기', 'https://naedonnaepyeon.vercel.app']],
      icon: 'shield'
    },
    {
      id: 's-villagen', x: 1240, y: 345, label: 'down', time: '2026.10', name: 'Villagen',
      title: 'Villagen',
      one: '원하는 물건을 글로 적으면 AI가 3D 가구로 만들어 주는 마을 RPG.',
      prize: 'TRIPOTHON S1 SEOUL · Best Use of Tripo 수상',
      facts: [['역할', '3인 팀, 게임 기획과 게임 안 코드'], ['기술', 'Godot, Python 서버, SQLite, Tripo']],
      img: '../../assets/video/villagen.jpg', wide: true,
      fill: '[주상이 채울 부분: 이 역에서 배운 것]',
      actions: [['자세히', '#s-villagen', true], ['게임 내려받기', 'https://villagen-school-dl.s3.ap-northeast-2.amazonaws.com/school/index.html']],
      icon: 'house'
    },
    {
      id: 's-lolypoly', x: 1720, y: 235, label: 'up', time: '2026.11', name: 'Lolypoly',
      title: 'Lolypoly',
      one: '학교 홈페이지에 흩어진 식단, 학사일정, 공지를 휴대폰 한 화면에서 봅니다.',
      facts: [['역할', '2인 공동 기획·개발'], ['기술', 'Django, Playwright 수집, SQLite, Docker'], ['결과', '프로토타입·기획서 교수 승인']],
      img: '../../assets/video/lolypoly.jpg',
      fill: '[주상이 채울 부분: 이 역에서 배운 것]',
      actions: [['자세히', '#s-lolypoly', true], ['사이트에서 해보기', 'https://lolypoly.lolypoly.workers.dev/']],
      icon: 'phone'
    },
    {
      id: 's-maru', x: 2160, y: 350, label: 'down', time: '2026.11', name: 'MARU',
      title: 'MARU',
      one: '외국인 여행자에게 서울 전통문화의 맥락을 설명하고, 관심사와 시간에 맞는 코스를 추천합니다.',
      facts: [['역할', '기획, 화면 설계, AI 해설 프롬프트'], ['기능', '코스 6개, 장소 29곳, 4개 언어, 챗봇 아리']],
      img: '../../assets/video/maru.jpg',
      fill: '[주상이 채울 부분: 이 역에서 배운 것]',
      actions: [['자세히', '#s-maru', true], ['사이트에서 해보기', 'https://lovesome0405.github.io/ari/']],
      icon: 'roof'
    },
    {
      id: 'next', x: 2600, y: 255, label: 'up', time: '다음 · 겨울방학', name: '인턴',
      title: '다음 역: 겨울방학 인턴',
      one: 'AI, 개발, 데이터 분야의 인턴 자리를 찾고 있습니다. 아직 선로가 놓이지 않은 구간입니다.',
      facts: [['연락', 'lovesome0405@naver.com']],
      fill: '[주상이 채울 부분: 인턴에서 해 보고 싶은 일]',
      actions: [['이메일 보내기', 'mailto:lovesome0405@naver.com', false, true], ['GitHub', 'https://github.com/lovesome0405']],
      icon: 'flag', future: true
    }
  ];

  const stage = document.querySelector('.stage');
  const viewport = document.getElementById('viewport');
  const world = document.getElementById('world');
  const svg = document.getElementById('scene');
  const stationsEl = document.getElementById('stations');
  const platform = document.getElementById('platform');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next-btn');
  const odo = document.getElementById('odometer');
  const boardLinks = [...document.querySelectorAll('.board a[data-go]')];
  if (!stage || !viewport) return;
  stage.hidden = false;

  /* ---------- SVG 장면 만들기 ---------- */
  const el = (tag, attrs = {}, parent = svg) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  };
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  // 땅
  el('rect', { x: 0, y: 0, width: W, height: H, fill: '#e3dccb' });
  // 점 격자
  const defs = el('defs');
  const pat = el('pattern', { id: 'dots', width: 28, height: 28, patternUnits: 'userSpaceOnUse' }, defs);
  el('circle', { cx: 2, cy: 2, r: 1.6, fill: '#c9c0aa' }, pat);
  el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#dots)' });

  // 시간 띠: 달마다 옅은 구역
  const bands = [
    [0, 480, '입학 이후'], [480, 990, '9월'], [990, 1470, '10월'], [1470, 2390, '11월'], [2390, W, '겨울방학']
  ];
  bands.forEach(([a, b, t], i) => {
    if (i % 2) el('rect', { x: a, y: 0, width: b - a, height: H, fill: '#d9d1bd', opacity: 0.45 });
    const tx = el('text', { x: b - 16, y: 34, 'text-anchor': 'end', fill: '#4c5563', 'font-size': 18, 'font-family': 'IBM Plex Mono, monospace', 'font-weight': 600 });
    tx.textContent = t;
  });
  el('line', { x1: 0, y1: 48, x2: W, y2: 48, stroke: '#b9af97', 'stroke-width': 2 });

  // 호수(춘천 출발 지점 주변 장식), 등고선
  const lake = (d) => el('path', { d, fill: '#c7dcdf', stroke: '#a9c8cc', 'stroke-width': 3 });
  lake('M60 140 C 120 80 260 90 300 150 C 330 200 250 230 180 220 C 110 210 30 200 60 140 Z');
  lake('M330 420 C 380 380 470 390 480 430 C 490 470 410 490 360 475 C 320 462 300 445 330 420 Z');
  lake('M140 250 C 170 236 205 246 200 268 C 195 288 150 292 135 278 C 125 268 128 256 140 250 Z');
  const lab = el('text', { x: 92, y: 160, fill: '#2e5a60', 'font-size': 22, 'font-weight': 700, 'font-family': 'IBM Plex Sans KR, sans-serif' });
  lab.textContent = '춘천';
  const contour = (cx, cy, rx, ry, n) => {
    for (let i = 0; i < n; i++) {
      el('ellipse', { cx, cy, rx: rx - i * 26, ry: ry - i * 16, fill: 'none', stroke: '#c4b994', 'stroke-width': 2, opacity: 0.8 });
    }
  };
  contour(980, 110, 150, 80, 4);
  contour(1480, 440, 130, 66, 3);
  contour(2380, 120, 160, 78, 4);

  // 역 위치를 지나는 곡선 경로(Catmull-Rom → 베지어)
  const pts = [{ x: 40, y: 360 }, ...STATIONS.map((s) => ({ x: s.x, y: s.y })), { x: 2760, y: 220 }];
  const toPath = (p) => {
    let d = `M${p[0].x} ${p[0].y}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x} ${p2.y}`;
    }
    return d;
  };
  const d = toPath(pts);
  el('path', { d, fill: 'none', stroke: '#1b2330', 'stroke-width': 18, 'stroke-linecap': 'round', opacity: 0.12, transform: 'translate(0 5)' });
  const track = el('path', { d, fill: 'none', stroke: '#8fb7bb', 'stroke-width': 12, 'stroke-linecap': 'round' });
  const traveled = el('path', { d, fill: 'none', stroke: '#0d6670', 'stroke-width': 12, 'stroke-linecap': 'round' });
  const total = track.getTotalLength();

  // 경로 샘플링: 거리 → 좌표
  const samples = [];
  for (let l = 0; l <= total; l += 4) { const p = track.getPointAtLength(l); samples.push({ l, x: p.x, y: p.y }); }
  STATIONS.forEach((s) => {
    let best = samples[0];
    for (const sm of samples) if (Math.hypot(sm.x - s.x, sm.y - s.y) < Math.hypot(best.x - s.x, best.y - s.y)) best = sm;
    s.len = best.l;
  });
  const futureFrom = STATIONS[4].len;
  // 아직 놓이지 않은 선로: MARU 이후는 점선 덧칠
  const future = el('path', { d, fill: 'none', stroke: '#e3dccb', 'stroke-width': 8, 'stroke-dasharray': `0 ${futureFrom} ${total}`, 'stroke-linecap': 'butt' });
  future.setAttribute('stroke-dasharray', `0 ${futureFrom + 24} ` + Array(60).fill('14 14').join(' '));

  // 역 표식 + 작은 랜드마크
  const icons = {
    lake: (g) => { el('path', { d: 'M-14 4 C -8 -6 8 -6 14 4 C 8 10 -8 10 -14 4 Z', fill: '#c7dcdf', stroke: '#1b2330', 'stroke-width': 2 }, g); },
    shield: (g) => { el('path', { d: 'M0 -14 L12 -9 V0 C12 8 6 12 0 15 C-6 12 -12 8 -12 0 V-9 Z', fill: '#fbf9f4', stroke: '#1b2330', 'stroke-width': 2.5 }, g); el('path', { d: 'M-5 0 L-1 4 L6 -4', fill: 'none', stroke: '#b23a26', 'stroke-width': 3 }, g); },
    house: (g) => { el('path', { d: 'M-13 -2 L0 -14 L13 -2 V13 H-13 Z', fill: '#fbf9f4', stroke: '#1b2330', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, g); el('rect', { x: -4, y: 3, width: 8, height: 10, fill: '#b23a26' }, g); },
    phone: (g) => { el('rect', { x: -9, y: -15, width: 18, height: 30, rx: 4, fill: '#fbf9f4', stroke: '#1b2330', 'stroke-width': 2.5 }, g); el('path', { d: 'M-4 -6 H4 M-4 0 H4 M-4 6 H2', stroke: '#0d6670', 'stroke-width': 2.5 }, g); },
    roof: (g) => { el('path', { d: 'M-18 -2 C -10 -4 -6 -14 0 -14 C 6 -14 10 -4 18 -2 Z', fill: '#1b2330' }, g); el('rect', { x: -10, y: -2, width: 20, height: 14, fill: '#fbf9f4', stroke: '#1b2330', 'stroke-width': 2.5 }, g); },
    flag: (g) => { el('path', { d: 'M-6 14 V-14', stroke: '#1b2330', 'stroke-width': 3 }, g); el('path', { d: 'M-6 -14 L12 -8 L-6 -2 Z', fill: '#b23a26' }, g); }
  };
  const markers = STATIONS.map((s) => {
    const g = el('g', { transform: `translate(${s.x} ${s.y})` });
    const ring = el('circle', { r: 15, fill: '#fbf9f4', stroke: '#1b2330', 'stroke-width': 6 }, g);
    if (s.future) ring.setAttribute('stroke-dasharray', '6 5');
    const core = el('circle', { r: 5, fill: '#b23a26', opacity: 0 }, g);
    // 랜드마크는 라벨 반대편
    const ig = el('g', { transform: `translate(${s.label === 'up' ? 46 : 46} ${s.label === 'up' ? 44 : -46})` });
    ig.setAttribute('transform', `translate(${s.x + 46} ${s.y + (s.label === 'up' ? 46 : -46)})`);
    icons[s.icon](ig);
    return { ring, core };
  });

  // 열차(현재 위치)
  const train = el('g', {});
  el('rect', { x: -32, y: -15, width: 64, height: 30, rx: 12, fill: '#b23a26', stroke: '#1b2330', 'stroke-width': 3 }, train);
  el('rect', { x: -22, y: -8, width: 12, height: 10, rx: 2, fill: '#fbf9f4' }, train);
  el('rect', { x: -6, y: -8, width: 12, height: 10, rx: 2, fill: '#fbf9f4' }, train);
  el('path', { d: 'M12 -8 H20 C24 -8 26 -4 26 2 H12 Z', fill: '#fbf9f4' }, train);
  el('circle', { cx: 29, cy: 6, r: 2.5, fill: '#fff0a8' }, train);

  /* ---------- 역 버튼(HTML) ---------- */
  const btns = STATIONS.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `st st--${s.label} is-new`;
    b.innerHTML = `<span class="st-time">${s.time}</span><span class="st-name">${s.name}</span>`;
    b.setAttribute('aria-label', `${i === 0 ? '출발역' : i === 5 ? '다음 역' : i + '번째 역'} ${s.name}, ${s.time}`);
    b.addEventListener('click', () => go(i));
    b.addEventListener('focus', () => { if (!dragging) go(i); });
    stationsEl.appendChild(b);
    return b;
  });

  /* ---------- 상태 ---------- */
  let scale = 1, vw = 0, vh = 0;
  let prog = STATIONS[0].len;       // 열차의 현재 거리
  let target = prog;                // 열차가 향하는 거리
  let cam = 0, camTarget = 0;
  let active = -1;
  const visited = new Set();
  let dragging = false;
  let raf = 0;

  const pointAt = (l) => {
    const i = Math.max(0, Math.min(samples.length - 1, Math.round(l / 4)));
    const a = samples[i], b = samples[Math.min(samples.length - 1, i + 1)];
    return { x: a.x, y: a.y, ang: Math.atan2(b.y - a.y, b.x - a.x) };
  };
  const clampProg = (l) => Math.max(STATIONS[0].len, Math.min(STATIONS[5].len, l));

  function layout() {
    vw = viewport.clientWidth; vh = viewport.clientHeight;
    scale = vh / H;
    world.style.width = `${W * scale}px`;
    world.style.height = `${vh}px`;
    STATIONS.forEach((s, i) => {
      btns[i].style.left = `${s.x * scale}px`;
      btns[i].style.top = `${s.y * scale}px`;
    });
    camTarget = camFor(prog);
    cam = camTarget;
    paint();
  }
  function camFor(l) {
    const p = pointAt(l);
    const worldW = W * scale;
    if (worldW <= vw) return (vw - worldW) / 2;
    // 열차가 화면 가로 40% 지점에 오도록: 앞으로 갈 길이 더 보이게
    const want = vw * 0.42 - p.x * scale;
    return Math.max(vw - worldW, Math.min(0, want));
  }

  function paint() {
    const p = pointAt(prog);
    train.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(p.ang * 180 / Math.PI).toFixed(1)})`);
    traveled.setAttribute('stroke-dasharray', `${prog.toFixed(1)} ${total}`);
    world.style.transform = `translate3d(${cam.toFixed(1)}px,0,0)`;
  }

  function nearest(l) {
    let bi = 0;
    STATIONS.forEach((s, i) => { if (Math.abs(s.len - l) < Math.abs(STATIONS[bi].len - l)) bi = i; });
    return bi;
  }

  function tick(now) {
    raf = 0;
    const dist = target - prog;
    if (!dragging) {
      if (reduced || Math.abs(dist) < 0.6) prog = target;
      else {
        // 출발은 부드럽게, 도착은 감속: 거리에 비례한 속도 + 최소 속도
        const step = Math.sign(dist) * Math.min(Math.abs(dist), Math.max(6, Math.abs(dist) * 0.09));
        prog += step;
      }
    }
    camTarget = camFor(prog);
    cam = reduced ? camTarget : cam + (camTarget - cam) * 0.18;
    paint();
    // 역 근처에 오면 도착 처리(끌며 지나갈 때도 발견)
    const n = nearest(prog);
    if (Math.abs(STATIONS[n].len - prog) < 36) arrive(n);
    if (Math.abs(target - prog) > 0.5 || Math.abs(camTarget - cam) > 0.5 || dragging) raf = requestAnimationFrame(tick);
  }
  const help = document.getElementById('map-help');
  let interacted = false;
  const kick = () => {
    if (!interacted && active >= 0) { interacted = true; setTimeout(() => help.classList.add('is-faded'), 2500); }
    if (!raf) raf = requestAnimationFrame(tick);
  };

  function go(i) {
    i = Math.max(0, Math.min(STATIONS.length - 1, i));
    target = STATIONS[i].len;
    kick();
  }

  function arrive(i) {
    if (i === active) return;
    active = i;
    visited.add(i);
    btns.forEach((b, j) => {
      b.toggleAttribute('aria-current', j === i);
      if (j === i) b.setAttribute('aria-current', 'true');
      b.classList.toggle('is-new', !visited.has(j));
    });
    boardLinks.forEach((a) => {
      if (+a.dataset.go === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    markers.forEach((m, j) => {
      m.core.setAttribute('opacity', j === i ? 1 : 0);
      m.ring.setAttribute('fill', visited.has(j) ? '#fbf9f4' : '#fbf9f4');
      m.ring.setAttribute('stroke', j === i ? '#b23a26' : '#1b2330');
    });
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === STATIONS.length - 1;
    odo.innerHTML = `방문 <b>${visited.size}</b>/${STATIONS.length}`;
    renderPlatform(STATIONS[i], i);
  }

  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function renderPlatform(s, i) {
    const num = i === 0 ? '출' : i === 5 ? '→' : String(i);
    const facts = s.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    const shot = s.img ? `<img class="${s.wide ? 'wide' : ''}" src="${s.img}" alt="${esc(s.name)} 화면" width="${s.wide ? 960 : 390}" height="${s.wide ? 600 : 844}">` : '';
    const acts = s.actions.map(([t, href, internal, solid]) =>
      `<a class="btn ${solid || (!internal && i !== 5) ? 'btn--solid' : ''}" href="${href}">${esc(t)}${internal ? ' ↓' : ''}</a>`).join('');
    platform.innerHTML = `
      <div class="pf-sign"><span class="pf-num" aria-hidden="true">${num}</span><div><p class="pf-time">${esc(s.time)}</p><h2 class="pf-title">${esc(s.title)}</h2></div></div>
      ${s.prize ? `<p class="pf-prize">${esc(s.prize)}</p>` : ''}
      <div class="pf-shot">${shot}<div><p class="pf-one">${esc(s.one)}</p></div></div>
      <dl class="pf-facts">${facts}</dl>
      <p class="fill">${esc(s.fill)}</p>
      <div class="pf-actions">${acts}</div>`;
  }

  /* ---------- 조작 ---------- */
  prevBtn.addEventListener('click', () => go((active < 0 ? 0 : active) - 1));
  nextBtn.addEventListener('click', () => go((active < 0 ? 0 : active) + 1));

  viewport.addEventListener('keydown', (e) => {
    const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key in map) {
      e.preventDefault();
      const i = Math.max(0, Math.min(5, active + map[e.key]));
      go(i);
      if (e.target.classList?.contains('st')) btns[i].focus({ preventScroll: true });
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault(); go(e.key === 'Home' ? 0 : 5);
    }
  });

  // 지도 끌기: 왼쪽으로 끌면 앞으로 달린다. 세로 스크롤은 브라우저에 맡긴다(touch-action: pan-y).
  let downX = 0, downY = 0, downProg = 0, pid = null, moved = false;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button, a')) return;
    pid = e.pointerId; downX = e.clientX; downY = e.clientY; downProg = prog; moved = false;
  });
  viewport.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pid) return;
    const dx = e.clientX - downX, dy = e.clientY - downY;
    if (!moved) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      moved = true; dragging = true; viewport.classList.add('is-drag');
      try { viewport.setPointerCapture(pid); } catch (_) {}
    }
    prog = target = clampProg(downProg - (dx / scale) * 1.4);
    kick();
  });
  const release = (e) => {
    if (e.pointerId !== pid) return;
    // 터치는 처음 닿은 요소(svg)에 암묵적 캡처가 걸려 있다가 viewport로 넘어올 때 lostpointercapture가 버블링된다. 그건 무시.
    if (e.type === 'lostpointercapture' && e.target !== viewport) return;
    pid = null;
    if (!moved) return;
    dragging = false; viewport.classList.remove('is-drag');
    go(nearest(prog));
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  viewport.addEventListener('lostpointercapture', release);

  // 트랙패드 가로 스크롤로도 달리기(세로 스크롤은 건드리지 않음)
  let wheelTimer = 0;
  viewport.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    prog = target = clampProg(prog + e.deltaX / scale);
    kick();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => go(nearest(prog)), 180);
  }, { passive: false });

  // 노선 안내판: 지도에서 해당 역으로 이동
  boardLinks.forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    go(+a.dataset.go);
    const r = viewport.getBoundingClientRect();
    if (r.bottom > window.innerHeight || r.top < 0) viewport.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  }));

  new ResizeObserver(layout).observe(viewport);
  layout();
  arrive(0);

  // 시연·캡처용: ?station=2 로 특정 역에서 시작
  const q = new URLSearchParams(location.search).get('station');
  if (q !== null) { const i = +q; for (let k = 0; k <= i; k++) visited.add(k); prog = target = STATIONS[i].len; layout(); arrive(i); }
})();
