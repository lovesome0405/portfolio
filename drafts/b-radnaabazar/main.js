// 시안 B: 스크롤 진행선, 구간 도착 표시, 하단 현재 위치 표시. 외부 라이브러리 없음.
(function () {
  var track = document.querySelector('[data-track]');
  var fill = document.querySelector('[data-fill]');
  var stops = Array.prototype.slice.call(document.querySelectorAll('[data-stop]'));
  var where = document.querySelector('[data-where]');
  var whereLabel = document.querySelector('[data-where-label]');
  var whereLinks = where ? Array.prototype.slice.call(where.querySelectorAll('a')) : [];
  var route = document.getElementById('route');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!track || !fill) return;

  var line = track.querySelector('.track-line');
  var last = stops[stops.length - 1];
  function fitLine() {
    // 선이 마지막 점에서 끝나도록 길이를 맞춘다
    if (!line || !last) return;
    var end = last.offsetTop + 15;
    line.style.bottom = 'auto';
    line.style.height = Math.max(0, end - 8) + 'px';
  }
  fitLine();
  window.addEventListener('load', fitLine);
  window.addEventListener('resize', fitLine);

  var ticking = false;
  var current = -1;

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var mark = vh * 0.45; // 화면 위에서 45% 지점을 '지금 읽는 곳'으로 본다
    var r = (line || track).getBoundingClientRect();
    var p = reduce.matches ? 1 : Math.min(1, Math.max(0, (mark - r.top) / r.height));
    fill.style.setProperty('--p', p.toFixed(4));

    var active = 0;
    stops.forEach(function (s, i) {
      var top = s.getBoundingClientRect().top;
      var reached = reduce.matches || top < mark;
      s.classList.toggle('is-reached', reached);
      if (top < mark) active = i;
    });

    if (where && route) {
      var rr = route.getBoundingClientRect();
      var inRoute = rr.top < vh * 0.6 && rr.bottom > vh * 0.4;
      where.hidden = !inRoute;
      if (active !== current) {
        current = active;
        whereLabel.textContent = stops[active].getAttribute('data-label');
        whereLinks.forEach(function (a, i) {
          if (i === active) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      }
    }
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (reduce.addEventListener) reduce.addEventListener('change', onScroll);
  update();
})();
