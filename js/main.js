/* MB2 clinic — интерактив */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  document.documentElement.classList.add('js');

  /* ---------- WebGL: мягкий свет на петроль-фоне ---------- */
  function lightField(canvas, opts) {
    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fs = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec2 m;uniform float k;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.02;a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/r; vec2 p=uv*vec2(r.x/r.y,1.)*1.6;
 float tt=t*.045;
 vec2 q=vec2(fbm(p+tt),fbm(p+vec2(5.2,1.3)-tt));
 vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)+tt*1.3),fbm(p+3.*q+vec2(8.3,2.8)));
 float f=fbm(p+2.6*w+(m-.5)*.6);
 vec3 petrol=vec3(.110,.271,.337); vec3 deep=vec3(.051,.145,.192);
 vec3 lil=vec3(.663,.612,.867); vec3 pearl=vec3(.86,.93,.95);
 vec3 c=mix(deep,petrol,smoothstep(.15,.75,f));
 float band=smoothstep(.62,.9,f)*smoothstep(1.1,.55,length(w));
 c=mix(c,pearl,band*.35*k);
 c+=lil*pow(smoothstep(.55,.95,q.y*f*1.6),3.)*.35*k;
 float d=length((uv-m)*vec2(r.x/r.y,1.));
 c+=pearl*.08*exp(-d*d*6.)*k;
 c*=1.-.35*pow(length(uv-vec2(.5,.45)),2.);
 gl_FragColor=vec4(c,1.);}`;
    function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(pr, 'r'), uT = gl.getUniformLocation(pr, 't'), uM = gl.getUniformLocation(pr, 'm'), uK = gl.getUniformLocation(pr, 'k');
    let mx = .65, my = .55, tx = mx, ty = my, visible = true, start = performance.now();
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * (opts && opts.lowres ? .5 : .75);
    function size() { canvas.width = canvas.clientWidth * scale; canvas.height = canvas.clientHeight * scale; gl.viewport(0, 0, canvas.width, canvas.height); }
    size(); addEventListener('resize', size);
    canvas.parentElement.addEventListener('pointermove', e => { const rc = canvas.getBoundingClientRect(); tx = (e.clientX - rc.left) / rc.width; ty = 1 - (e.clientY - rc.top) / rc.height; });
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) loop(); }).observe(canvas);
    function frame(now) {
      mx += (tx - mx) * .04; my += (ty - my) * .04;
      gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uT, reduce ? 20 : (now - start) / 1000 + 20);
      gl.uniform2f(uM, mx, my); gl.uniform1f(uK, (opts && opts.k) || 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    let raf = 0;
    function loop() { cancelAnimationFrame(raf); const tick = now => { frame(now); if (visible && !reduce) raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); }
    loop();
  }
  document.querySelectorAll('canvas[data-light]').forEach(c => lightField(c, { k: +c.dataset.light || 1, lowres: c.dataset.lowres === '1' }));

  /* ---------- видео первого экрана ----------
     Файлы указываются в build.py (HERO_VIDEO). Пока видео нет или оно не загрузилось,
     остаётся световой фон и фото врачей. */
  (function heroVideo() {
    const hero = document.querySelector('.hero'), v = hero && hero.querySelector('.hero__video');
    if (!v) return;
    const conn = navigator.connection || {};
    if (reduce || conn.saveData) return;
    const mobile = matchMedia('(max-width: 860px)').matches;
    const src = (mobile && hero.dataset.videoMobile) || hero.dataset.videoDesktop;
    if (!src) return;
    const btn = hero.querySelector('.hero__pause');
    v.addEventListener('playing', () => { hero.classList.add('has-video'); if (btn) btn.hidden = false; }, { once: true });
    v.addEventListener('error', () => hero.classList.remove('has-video'));
    if (hero.dataset.videoPoster) v.poster = hero.dataset.videoPoster;
    const start = () => { v.src = src; v.load(); v.play().catch(() => {}); };
    if (document.readyState === 'complete') start(); else addEventListener('load', start);
    btn && btn.addEventListener('click', () => {
      const paused = !v.paused; paused ? v.pause() : v.play();
      btn.setAttribute('aria-pressed', String(paused));
      btn.setAttribute('aria-label', paused ? 'Включить видео' : 'Остановить видео');
    });
    new IntersectionObserver(es => { if (btn && btn.getAttribute('aria-pressed') === 'true') return; es[0].isIntersecting ? v.play().catch(() => {}) : v.pause(); }).observe(hero);
  })();

  /* ---------- плавный скролл ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: .08, smoothWheel: true });
    if (hasGsap && window.ScrollTrigger) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const r = t => { lenis.raf(t); requestAnimationFrame(r); }; requestAnimationFrame(r); }
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return; const el = document.querySelector(id); if (!el) return;
    e.preventDefault(); lenis ? lenis.scrollTo(el, { offset: -80 }) : el.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- шапка ---------- */
  const hdr = document.querySelector('.hdr');
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY;
    hdr.classList.toggle('is-solid', y > 60);
    hdr.classList.toggle('is-hidden', y > 400 && y > lastY && !document.body.classList.contains('menu-open'));
    lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- мобильное меню ---------- */
  const menu = document.querySelector('.menu');
  function setMenu(open) {
    menu.classList.toggle('is-open', open); document.body.classList.toggle('menu-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  document.querySelector('.burger')?.addEventListener('click', () => setMenu(true));
  menu?.querySelector('.menu__close').addEventListener('click', () => setMenu(false));
  menu?.querySelectorAll('a,[data-book]').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- модалка записи ---------- */
  const modal = document.getElementById('book-modal');
  let lastFocus = null;
  function openModal(service) {
    lastFocus = document.activeElement;
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('.is-sent')?.classList.remove('is-sent');
    if (service) { const s = modal.querySelector('select'); [...s.options].forEach(o => { if (o.text === service) s.value = o.value; }); }
    if (lenis) lenis.stop();
    setTimeout(() => modal.querySelector('input').focus(), 200);
  }
  function closeModal() {
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start(); lastFocus && lastFocus.focus();
  }
  document.querySelectorAll('[data-book]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openModal(b.dataset.book); }));
  modal?.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (modal.classList.contains('is-open')) closeModal(); if (menu.classList.contains('is-open')) setMenu(false); } });

  /* ---------- формы ----------
     Чтобы заявки приходили в Telegram или на почту, укажите адрес обработчика
     в атрибуте data-endpoint у <form> (например, скрипт на сервере или вебхук). */
  document.querySelectorAll('.phone').forEach(inp => inp.addEventListener('input', () => {
    let d = inp.value.replace(/\D/g, ''); if (d.startsWith('8')) d = '7' + d.slice(1); if (!d.startsWith('7')) d = '7' + d; d = d.slice(0, 11);
    let s = '+7'; if (d.length > 1) s += ' (' + d.slice(1, 4); if (d.length >= 4) s += ') ' + d.slice(4, 7); if (d.length >= 7) s += '-' + d.slice(7, 9); if (d.length >= 9) s += '-' + d.slice(9, 11);
    inp.value = s;
  }));
  document.querySelectorAll('form.form').forEach(f => f.addEventListener('submit', async e => {
    e.preventDefault();
    let ok = true;
    f.querySelectorAll('[required]').forEach(i => {
      const bad = i.type === 'checkbox' ? !i.checked : i.classList.contains('phone') ? i.value.replace(/\D/g, '').length < 11 : !i.value.trim();
      i.closest('.field, .consent').classList.toggle('err', bad); if (bad) ok = false;
    });
    if (!ok) { f.querySelector('.err input')?.focus(); return; }
    const data = Object.fromEntries(new FormData(f));
    const ep = f.dataset.endpoint;
    if (ep) { try { await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch (_) { } }
    f.parentElement.classList.add('is-sent'); f.reset();
  }));

  /* ---------- до/после: ползунок двигает границу ---------- */
  // до/после на телефоне: сначала три работы, остальные по кнопке
  document.querySelectorAll('.cases__more').forEach(b => b.addEventListener('click', () => {
    b.previousElementSibling.classList.add('is-open');
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }));

  document.querySelectorAll('.ba').forEach(ba => {
    const r = ba.querySelector('input');
    const set = v => { ba.style.setProperty('--x', v + '%'); };
    r.addEventListener('input', () => set(r.value));
    set(r.value);
    // подсказка: когда блок появился, граница сама проезжает туда-обратно
    if (!reduce && window.gsap) {
      const o = { v: 50 };
      new IntersectionObserver((es, io) => {
        if (!es[0].isIntersecting) return; io.disconnect();
        gsap.timeline({ delay: .4 }).to(o, { v: 78, duration: .9, ease: 'power2.inOut', onUpdate: () => set(o.v) })
          .to(o, { v: 50, duration: 1.1, ease: 'power3.inOut', onUpdate: () => set(o.v), onComplete: () => { r.value = 50; } });
      }, { threshold: .5 }).observe(ba);
    }
  });

  /* ---------- сертификаты: просмотр крупно ---------- */
  const lb = document.querySelector('.lightbox');
  if (lb) {
    const img = lb.querySelector('img');
    document.querySelectorAll('.cert').forEach(c => c.addEventListener('click', () => {
      img.src = c.dataset.full; img.alt = c.querySelector('b').textContent;
      lb.showModal(); if (lenis) lenis.stop();
    }));
    lb.addEventListener('close', () => { if (lenis) lenis.start(); });
    lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lightbox__x')) lb.close(); });
  }

  /* ---------- фильтр услуг ---------- */
  document.querySelectorAll('.chips[data-filter]').forEach(ch => ch.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    ch.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const v = b.dataset.v;
    document.querySelectorAll(ch.dataset.filter).forEach(el => { el.hidden = v !== 'all' && !el.dataset.for.split(' ').includes(v); });
    if (hasGsap) gsap.fromTo(document.querySelectorAll(ch.dataset.filter + ':not([hidden])'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: .5 });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }));

  /* ---------- поиск по прайсу ---------- */
  const ps = document.getElementById('price-search');
  ps?.addEventListener('input', () => {
    const q = ps.value.trim().toLowerCase();
    document.querySelectorAll('.pgroup').forEach(g => {
      let any = false;
      g.querySelectorAll('tr').forEach(tr => { const hit = !q || tr.textContent.toLowerCase().includes(q); tr.hidden = !hit; if (hit) any = true; });
      g.hidden = !any; if (q && any) g.open = true;
    });
  });

  /* ---------- анимации GSAP ---------- */
  if (!hasGsap || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  // hero: строки заголовка, линия-логотип, фото
  const heroLines = document.querySelectorAll('.hero h1 .ln>span, .phero h1 .ln>span');
  if (heroLines.length) gsap.from(heroLines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: .1, delay: .15 });
  gsap.from('.hero .eyebrow, .hero .lead, .hero .hero__cta, .phero .eyebrow, .phero .lead, .crumbs', { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: .08, delay: .5 });
  const line = document.querySelector('.hero__line path');
  if (line) {
    const L = line.getTotalLength(); line.style.strokeDasharray = L; line.style.strokeDashoffset = L;
    gsap.to(line, { strokeDashoffset: 0, duration: 3.2, ease: 'power2.inOut', delay: .3 });
    gsap.to('.hero__line', { yPercent: -60, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
  const logoPath = document.querySelectorAll('.logo svg path');
  logoPath.forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; gsap.fromTo(p, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut', delay: .2 }); });
  // первый экран: видео со сканером (кадры на canvas), при прокрутке камера влетает в монитор, на котором уже открыт сайт
  const scan = document.querySelector('.scan');
  if (scan && window.ScrollTrigger) {
    const v = scan.querySelector('.scan__video'), cam = scan.querySelector('.scan__cam'), scr = scan.querySelector('.scan__screen'),
      mini = scan.querySelector('.scan__mini'), hero = scan.querySelector('.scan__hero'), stage = scan.querySelector('.scan__stage');
    // на мониторе копия первого экрана с шапкой, без фокуса и подписей для скринридеров
    const copy = hero.cloneNode(true), bar = document.querySelector('.hdr__in').cloneNode(true);
    [copy, bar].forEach(n => n.querySelectorAll('a,button').forEach(a => a.tabIndex = -1));
    copy.querySelectorAll('img').forEach(i => i.alt = '');
    copy.querySelectorAll('.scan__text [style]').forEach(n => n.removeAttribute('style'));
    mini.append(copy, bar);
    scan.classList.add('scan--on');

    // кадры: набор под ширину экрана, первый грузим сразу, остальные следом
    const ctx = v.getContext('2d'), N = +v.dataset.count, sizes = v.dataset.sizes.split(',').map(Number);
    const need = Math.max(innerWidth, innerHeight * 16 / 9) * Math.min(devicePixelRatio || 1, 2);
    const fw = sizes.find(x => x >= need * .85) || sizes[sizes.length - 1];
    const imgs = [], src = n => v.dataset.src.replace('{w}', fw).replace('{n}', String(n + 1).padStart(3, '0'));
    // pos — дробный номер кадра: соседние кадры смешиваются, поэтому 24 кадра в секунду не дёргаются при медленной прокрутке
    let pos = 0, drawn = -1;
    const ready = i => imgs[i] && imgs[i].complete && imgs[i].naturalWidth;
    function draw(force) {
      if (!force && Math.abs(pos - drawn) < .01) return;
      let i = Math.floor(pos); while (i > 0 && !ready(i)) i--;
      if (!ready(i)) return;
      const im = imgs[i];
      if (v.width !== im.naturalWidth) { v.width = im.naturalWidth; v.height = im.naturalHeight; }
      ctx.globalAlpha = 1; ctx.drawImage(im, 0, 0);
      const f = pos - Math.floor(pos);
      if (i === Math.floor(pos) && f > .02 && ready(i + 1)) { ctx.globalAlpha = f; ctx.drawImage(imgs[i + 1], 0, 0); ctx.globalAlpha = 1; }
      drawn = pos;
    }
    for (let n = 0; n < N; n++) { const im = new Image(); im.decoding = 'async'; im.onload = () => { if (n <= pos + 1) draw(true); }; im.src = src(n); imgs.push(im); }

    // кадр 1920×1080; углы экрана монитора на последнем кадре; прямоугольник внутри экрана для финального приближения;
    // FX — где врач в начале ролика (по нему держим кадр на узком экране)
    const VW = 1920, VH = 1080, MW = 1440, MH = 900, FX = 650;
    const Q = [[133, 75], [1493, 97], [1484, 967], [108, 949]], IN = { x: 133, y: 97, w: 1351, h: 852 };
    const L = { c: 1, ox0: 0, ox1: 0, oy: 0 }, zoom = { x: 0, y: 0, s: 1 }, st = { t: 0 };
    // matrix3d, который кладёт прямоугольник w×h на четырёхугольник p (по часовой от левого верхнего)
    function quad(w, h, p) {
      const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = p;
      const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
      const den = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / den, k = (dx1 * sy - sx * dy1) / den;
      const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
      return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${x0},${y0},0,1)`;
    }
    const clampX = (w, x) => Math.min(0, Math.max(w - VW * L.c, x));
    function layout() {
      const w = stage.clientWidth, h = stage.clientHeight, c = L.c = Math.max(w / VW, h / VH);
      // на узком экране в начале держим в кадре врача, к концу сдвигаемся на монитор
      L.ox0 = clampX(w, w / 2 - FX * c); L.ox1 = clampX(w, w / 2 - (IN.x + IN.w / 2) * c); L.oy = (h - VH * c) / 2;
      v.style.width = VW * c + 'px'; v.style.height = VH * c + 'px'; v.style.top = L.oy + 'px';
      scr.style.transform = quad(MW, MH, Q.map(([x, y]) => [L.ox1 + x * c, L.oy + y * c]));
      const s = Math.max(w / (IN.w * c), h / (IN.h * c)) * 1.04;
      zoom.s = s; zoom.x = w / 2 - s * (L.ox1 + (IN.x + IN.w / 2) * c); zoom.y = h / 2 - s * (L.oy + (IN.y + IN.h / 2) * c);
      frame();
    }
    function frame() {
      const k = Math.min(1, st.t / .85);
      v.style.left = (L.ox0 + (L.ox1 - L.ox0) * (k * k * (3 - 2 * k))) + 'px';
      pos = Math.min(N - 1, st.t * (N - 1)); draw();
    }
    layout();
    ScrollTrigger.addEventListener('refreshInit', layout);

    const heroBits = hero.querySelectorAll('h1 .ln>span'), heroRest = hero.querySelectorAll('.eyebrow, .lead, .hero__cta'), facts = [...hero.querySelectorAll('.scan__facts li')];
    // заставка: название, потом подписи
    gsap.from('.scan__brand', { yPercent: 40, opacity: 0, duration: 1.3, ease: 'expo.out', delay: .3 });
    gsap.from('.scan__tag, .scan__sub, .scan__intro .scan__hint', { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: .12, delay: .7 });
    // размытие в движении: чем быстрее крутят, тем сильнее (до 2,5px), и плавно гаснет, когда прокрутка остановилась
    const blur = { b: 0 }, setBlur = gsap.quickTo(blur, 'b', { duration: .35, ease: 'power2.out', onUpdate: () => { v.style.filter = blur.b > .05 ? `blur(${blur.b.toFixed(2)}px)` : ''; } });
    let calm = 0;
    gsap.timeline({ scrollTrigger: { trigger: scan, start: 'top top', end: '+=170%', pin: stage, scrub: 1, invalidateOnRefresh: true,
        onUpdate: self => { setBlur(Math.min(2.5, Math.abs(self.getVelocity()) / 1600)); clearTimeout(calm); calm = setTimeout(() => setBlur(0), 120); } } })
      // экран включается, когда видео дошло до последнего кадра: углы монитора замерены на нём
      .to(st, { t: 1, ease: 'none', duration: 3.4, onUpdate: frame }, 0)
      .to('.scan__intro', { opacity: 0, y: -30, duration: .6 }, .2)
      .fromTo(scr, { opacity: 0, filter: 'brightness(2.4)' }, { opacity: 1, filter: 'brightness(1)', duration: .6 }, 3.4)
      // влёт: плавный разгон и торможение, на середине камера чуть размывается
      .to(cam, { x: () => zoom.x, y: () => zoom.y, scale: () => zoom.s, ease: 'power2.inOut', duration: 1.4 }, 3.9)
      .fromTo(cam, { filter: 'blur(0px)' }, { filter: 'blur(5px)', ease: 'power1.in', duration: .8 }, 4.4)
      // настоящий экран проявляется из размытия поверх копии на мониторе
      .fromTo(hero, { autoAlpha: 0, scale: 1.04, filter: 'blur(12px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', ease: 'power2.out', duration: .7 }, 4.95)
      .fromTo(heroBits, { yPercent: 110 }, { yPercent: 0, duration: .6, stagger: .07 }, 5.3)
      .fromTo(heroRest, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .05 }, 5.45)
      .fromTo(facts.map(f => f.firstElementChild), { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: .5, stagger: .08 }, 5.35);

    // подсветка фактов по кругу: идёт, когда влёт закончился и первый экран на виду
    let hot = 0, hotTimer = 0, done = false, inView = true;
    const spin = () => {
      const on = done && inView;
      if (on === !!hotTimer) return;
      clearInterval(hotTimer); hotTimer = 0; facts.forEach(f => f.classList.remove('is-hot'));
      if (!on) return;
      // по кругу только среди видимых: на невысоком экране часть фактов скрыта
      const next = () => { const vis = facts.filter(f => f.offsetParent); facts.forEach(f => f.classList.remove('is-hot')); if (vis.length) vis[hot++ % vis.length].classList.add('is-hot'); };
      next(); hotTimer = setInterval(next, 2600);
    };
    ScrollTrigger.create({ trigger: scan, start: 'top top', end: () => '+=' + stage.offsetHeight * 1.7, onUpdate: self => { done = self.progress > .97; spin(); }, onLeave: () => { done = true; spin(); } });
    new IntersectionObserver(es => { inView = es[0].isIntersecting; spin(); }).observe(stage);
  }

  // общие появления
  gsap.utils.toArray('[data-reveal]').forEach(el => {
    gsap.from(el.dataset.reveal === 'kids' ? el.children : el, {
      y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: .08,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });
  gsap.utils.toArray('h2').forEach(h => gsap.from(h, { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 90%' } }));

  // параллакс картинок
  gsap.utils.toArray('[data-parallax] img').forEach(img => {
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.utils.toArray('.tech__img img').forEach(img => gsap.fromTo(img, { scale: 1.25 }, { scale: 1.05, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // путь пациента — горизонтальный пин
  const track = document.querySelector('.path__track');
  if (track) {
    ScrollTrigger.matchMedia({
      '(min-width: 761px)': function () {
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 40);
        gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.path__pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
        gsap.to('.path__bar i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.path__pin', start: 'top top', end: () => '+=' + dist(), scrub: true } });
      }
    });
  }

  // магнитные кнопки
  if (matchMedia('(pointer:fine)').matches) document.querySelectorAll('.btn').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .18, y: (e.clientY - r.top - r.height / 2) * .3, duration: .4 }); });
    b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.4)' }));
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
