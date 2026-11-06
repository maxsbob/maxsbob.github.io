(() => {
  const figure = document.querySelector('[data-life]');
  if (!figure) return;
  figure.dataset.runtime = 'waiting';
  const media = matchMedia('screen and (min-width: 641px) and (min-height: 680px) and (pointer: fine)');
  const source = new URL(document.currentScript.src);
  const runtime = new URL('life-runtime.mjs', source);
  runtime.search = source.search;
  let scheduled = false, loaded = false;

  function queue() {
    if (!media.matches || document.hidden || scheduled || loaded) return;
    if (document.readyState !== 'complete') {
      window.addEventListener('load', queue, { once: true });
      return;
    }
    scheduled = true;
    const boot = () => {
      scheduled = false;
      if (!media.matches || document.hidden || loaded) return;
      loaded = true;
      figure.dataset.runtime = 'loading';
      import(runtime.href).then(() => {
        figure.dataset.runtime = 'ready';
        media.removeEventListener('change', queue);
        document.removeEventListener('visibilitychange', queue);
      }).catch(() => { loaded = false; figure.hidden = true; figure.dataset.runtime = 'error'; });
    };
    if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1500 });
    else setTimeout(boot, 250);
  }
  media.addEventListener('change', queue);
  document.addEventListener('visibilitychange', queue);
  queue();
})();
