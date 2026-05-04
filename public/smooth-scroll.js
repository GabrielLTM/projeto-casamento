// Smooth-scroll cinematográfico para anchor links (#historia, #presentes, #pix...)
// Curva easeInOutQuart, ~1100ms — sensação editorial, não browser-padrão.
(function () {
  const DURATION = 1100; // ms
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // easeInOutQuart — começa devagar, acelera no meio, desacelera no fim
  const ease = (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);

  let activeAnim = 0; // id do RAF atual; serve como token de cancelamento

  function jump(y) {
    // Força scroll instantâneo, ignorando qualquer scroll-behavior:smooth do CSS
    window.scrollTo({ top: y, left: 0, behavior: "instant" });
  }

  function scrollTo(targetY, duration) {
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) return;

    // Cancela animação anterior se houver
    if (activeAnim) cancelAnimationFrame(activeAnim);

    const startTime = performance.now();
    let cancelled = false;

    const cancel = () => { cancelled = true; };
    const opts = { passive: true, once: true };
    window.addEventListener("wheel", cancel, opts);
    window.addEventListener("touchstart", cancel, opts);
    window.addEventListener("keydown", cancel, { once: true });

    function step(now) {
      if (cancelled) { activeAnim = 0; return; }
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const y = startY + distance * ease(t);
      jump(y);
      if (t < 1) {
        activeAnim = requestAnimationFrame(step);
      } else {
        activeAnim = 0;
      }
    }
    activeAnim = requestAnimationFrame(step);
  }

  function handleClick(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    const rect = target.getBoundingClientRect();
    const targetY = Math.round(rect.top + window.pageYOffset);

    if (REDUCED) {
      jump(targetY);
    } else {
      scrollTo(targetY, DURATION);
    }

    if (history.pushState) history.pushState(null, "", href);
  }

  document.addEventListener("click", handleClick);
})();
