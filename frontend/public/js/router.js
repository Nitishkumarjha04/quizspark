const Router = (() => {
  const routes = [];

  function define(path, handler) {
    routes.push({ path, handler, regex: pathToRegex(path) });
  }

  function pathToRegex(path) {
    return new RegExp('^' + path.replace(/\//g, '\\/').replace(/:\w+/g, '([^/]+)') + '$');
  }

  function extractParams(route, pathname) {
    const keys = [...route.path.matchAll(/:(\w+)/g)].map(m => m[1]);
    const values = pathname.match(route.regex)?.slice(1) || [];
    return Object.fromEntries(keys.map((k, i) => [k, values[i]]));
  }

  function navigate(path, push = true) {
    if (push) history.pushState(null, '', path);
    const pathname = window.location.pathname;
    const matched = routes.find(r => r.regex.test(pathname));
    const view = document.getElementById('view');
    if (!view) return;
    if (matched) {
      const params = extractParams(matched, pathname);
      view.innerHTML = '<div class="spinner"></div>';
      matched.handler(params);
    } else {
      view.innerHTML = `<div class="page text-center"><h1 class="page-title">404</h1><p class="text-muted">Page not found</p><br><a href="/" class="btn-primary" data-link>Go home</a></div>`;
    }
  }

  function init() {
    document.addEventListener('click', e => {
      const link = e.target.closest('[data-link]');
      if (!link) return;
      e.preventDefault();
      navigate(link.getAttribute('href') || link.dataset.href);
    });
    window.addEventListener('popstate', () => navigate(window.location.pathname, false));
    navigate(window.location.pathname, false);
  }

  return { define, navigate, init };
})();
