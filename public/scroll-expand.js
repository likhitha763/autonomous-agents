// Vanilla JS implementation of React Bits <ScrollExpand /> component

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

function initScrollExpand(options = {}) {
  const {
    containerId = 'scrollExpand',
    startWidth = 42,
    startHeight = 58,
    startRadius = 24,
    endRadius = 0,
    mediaZoom = 1.35,
    scrollDistance = 1.2,
    holdDistance = 0.35,
    smoothing = 0.22,
    overlayScrim = 0.55,
    useWindowScroll = false,
    enabled = true
  } = options;

  const root = document.getElementById(containerId);
  if (!root) return;

  const track = root.querySelector('.scroll-expand__track');
  const stage = root.querySelector('.scroll-expand__stage');
  const frame = root.querySelector('.scroll-expand__frame');
  const media = root.querySelector('.scroll-expand__media');
  const title = root.querySelector('.scroll-expand__title');
  const overlay = root.querySelector('.scroll-expand__overlay');
  const scrim = root.querySelector('.scroll-expand__scrim');
  const hint = root.querySelector('.scroll-expand__hint');

  if (!track || !stage || !frame || !media) return;

  const applyProgress = (p) => {
    if (!frame || !media) return;

    const e = smoothstep(0, 1, p);

    const w = startWidth + (100 - startWidth) * e;
    const h = startHeight + (100 - startHeight) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = startRadius + (endRadius - startRadius) * e;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;

    media.style.transform = `scale(${mediaZoom + (1 - mediaZoom) * e})`;

    if (scrim) scrim.style.opacity = `${overlayScrim * e}`;

    if (title) {
      const out = smoothstep(0.35, 0.85, p);
      title.style.opacity = `${1 - out}`;
      title.style.transform = `translate3d(0, ${-28 * out}px, 0) scale(${1 + 0.06 * out})`;
    }

    if (hint) {
      const gone = smoothstep(0, 0.12, p);
      hint.style.opacity = `${1 - gone}`;
      hint.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
    }

    if (overlay) {
      const inn = smoothstep(0.65, 1, p);
      overlay.style.opacity = `${inn}`;
      overlay.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`;
    }
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let raf = 0;
  let current = 0;
  let target = 0;
  let stageH = 0;
  let running = false;

  const measure = () => {
    stageH = useWindowScroll ? window.innerHeight : root.clientHeight;
    if (stageH <= 0) return;
    stage.style.height = `${stageH}px`;
    track.style.height = `${stageH * (1 + Math.max(0, scrollDistance) + Math.max(0, holdDistance))}px`;

    const w = root.clientWidth || stageH;
    stage.style.setProperty('--se-title-size', `${clamp(w * 0.045, 16, 32)}px`);
  };

  const readProgress = () => {
    if (!enabled) return 1;
    const span = stageH * Math.max(0.01, scrollDistance);
    if (useWindowScroll) {
      const top = track.getBoundingClientRect().top;
      return clamp(-top / span, 0, 1);
    }
    return clamp(root.scrollTop / span, 0, 1);
  };

  const tick = () => {
    const k = smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * smoothing));
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.0004) {
      current = target;
      running = false;
    }
    applyProgress(current);
    if (running) raf = requestAnimationFrame(tick);
  };

  const kick = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(tick);
  };

  const onScroll = () => {
    target = readProgress();
    if (smoothing <= 0 || reduceMotion) {
      current = target;
      applyProgress(current);
      return;
    }
    kick();
  };

  const onResize = () => {
    measure();
    target = readProgress();
    current = target;
    applyProgress(current);
  };

  measure();
  target = readProgress();
  current = target;
  applyProgress(current);

  const scroller = useWindowScroll ? window : root;
  scroller.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(onResize);
    ro.observe(root);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollExpand({ containerId: 'scrollExpandHero' });
});
