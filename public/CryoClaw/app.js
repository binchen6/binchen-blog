/* CryoClaw 官网交互 —— 2026.10 R3
   1) 主题切换（浅色默认 / 暗色独立调参，token 双通道承担）
   2) Release 元信息多源获取：本站 API → GitHub API → gh-proxy 国内镜像
   3) 三通道下载：国内镜像（主） / 本站中转 / GitHub 官方
   4) 滚动入场、导航进度、聚光 hover、磁吸按钮、跑马灯、氛围粒子
   全部渐进增强：无 JS 时页面与下载仍可用。 */
(() => {
  'use strict';

  /* ── 主题切换 ── */
  const root = document.documentElement;
  const stored = (() => { try { return localStorage.getItem('cryoclaw-theme'); } catch { return null; } })();
  const theme = stored === 'dark' || stored === 'light'
    ? stored
    : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.setAttribute('data-theme', theme);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('cryoclaw-theme', next); } catch { /* 隐私模式忽略 */ }
  });

  /* ── Release 元信息（多源兜底，任一通路成功即可） ── */
  const OFFICIAL_RELEASES = 'https://github.com/binchen6/CryoClaw/releases/latest';
  const MIRROR = 'https://gh-proxy.com/';
  const SOURCES = [
    '/api/cryoclaw-release',
    'https://api.github.com/repos/binchen6/CryoClaw/releases/latest',
    MIRROR + 'https://api.github.com/repos/binchen6/CryoClaw/releases/latest',
  ];
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };

  async function fetchRelease() {
    for (const url of SOURCES) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) throw new Error('bad status');
        const data = await res.json();
        if (data && /^v?\d+(\.\d+){2}$/.test(data.tag_name || '')) return data;
      } catch { /* 尝试下一通道 */ }
    }
    return null;
  }

  fetchRelease().then(data => {
    if (!data) return;
    const version = data.tag_name.replace(/^v/, '');
    set('hero-version', 'v' + version);
    set('download-version', '最新版本 v' + version);
    set('terminal-version', 'Office workspace · v' + version);

    const asset = (data.assets || []).find(a => /^CryoClaw-Setup-.*-x64\.exe$/i.test(a.name));
    const site = document.getElementById('dl-site');
    const mirror = document.getElementById('dl-mirror');
    const github = document.getElementById('dl-github');
    const hero = document.getElementById('download-hero');

    if (site) site.href = '/api/cryoclaw-dl?v=' + encodeURIComponent(version);
    if (asset && /^https:\/\/github\.com\/binchen6\/CryoClaw\/releases\/download\//.test(asset.browser_download_url)) {
      const mirrorUrl = MIRROR + asset.browser_download_url;
      if (mirror) {
        mirror.href = mirrorUrl;
        mirror.setAttribute('download', '');
      }
      if (hero) hero.href = mirrorUrl;
      if (github) github.href = asset.browser_download_url;
      set('download-size', 'Windows x64 · ' + Math.round(asset.size / 1048576) + ' MB');
      set('dl-mirror-note', asset.name + ' · 断点续传');
      set('dl-github-note', ' Releases · ' + asset.name);
    }
    if (data.published_at && !isNaN(Date.parse(data.published_at))) {
      set('download-date', new Date(data.published_at).toLocaleDateString('zh-CN') + ' 发布');
    }
    const box = document.getElementById('whatsnew');
    if (box) {
      const a = document.createElement('a');
      a.href = OFFICIAL_RELEASES;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = '查看 v' + version + ' 完整更新 →';
      box.replaceChildren(a);
      box.classList.add('is-on');
    }
  }).catch(() => { /* 元信息不可用时保持页面默认文案 */ });

  /* ── 滚动入场（IntersectionObserver，一镜入场） ── */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach(el => {
    if (reduced.matches) el.classList.add('is-in');
    else io.observe(el);
  });

  /* ── 导航：滚动态 + 阅读进度 ── */
  const nav = document.getElementById('nav');
  const progress = document.getElementById('nav-progress');
  let navFrame = 0;
  function onScroll() {
    if (navFrame) return;
    navFrame = requestAnimationFrame(() => {
      navFrame = 0;
      const y = scrollY;
      if (nav) nav.classList.toggle('is-scrolled', y > 8);
      if (progress) {
        const max = document.documentElement.scrollHeight - innerHeight;
        progress.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
      }
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Bento 聚光 hover：光斑跟随指针 ── */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-spot]').forEach(card => {
      card.addEventListener('pointermove', event => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (event.clientX - r.left) + 'px');
        card.style.setProperty('--my', (event.clientY - r.top) + 'px');
      }, { passive: true });
    });

    /* 磁吸按钮：轻微迎向指针 */
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', event => {
        const r = el.getBoundingClientRect();
        const x = (event.clientX - r.left - r.width / 2) / r.width;
        const y = (event.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = 'translate(' + (x * 6) + 'px,' + (y * 4) + 'px)';
      }, { passive: true });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ── 跑马灯：复制一份内容，实现无缝循环 ── */
  const track = document.getElementById('provider-track');
  if (track) {
    const clone = track.cloneNode(true);
    clone.removeAttribute('id');
    clone.setAttribute('aria-hidden', 'true');
    track.after(clone);
  }

  /* ── 氛围粒子：每帧按需绘制，无空闲动画循环 ── */
  const canvas = document.createElement('canvas');
  canvas.className = 'ambient-particles';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  let frame = 0;
  let enabled = !reduced.matches;
  function draw() {
    frame = 0;
    const width = innerWidth, height = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!enabled) return;
    const style = getComputedStyle(root);
    const colors = [style.getPropertyValue('--accent').trim(), style.getPropertyValue('--accent-2').trim()];
    const count = Math.min(36, Math.floor(width / 28));
    for (let i = 0; i < count; i++) {
      const speed = 0.035 + (i % 5) * 0.012;
      const x = ((i * 137.508 + Math.sin(scrollY * 0.001 + i) * 16) % width + width) % width;
      const y = ((i * 193.71 - scrollY * speed) % height + height) % height;
      ctx.globalAlpha = 0.1 + (i % 3) * 0.04;
      ctx.fillStyle = colors[i % 2];
      ctx.beginPath();
      ctx.arc(x, y, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  reduced.addEventListener('change', () => { enabled = !reduced.matches; schedule(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', schedule);
  schedule();
})();
