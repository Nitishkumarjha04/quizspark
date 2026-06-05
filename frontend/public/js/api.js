const API = (() => {
  const base = () => window.CONFIG?.API_URL || 'http://localhost:4000';

  async function request(method, path, body, auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('qs_token');
    if (auth && token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${base()}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  }

  return {
    get:    (path, auth)        => request('GET',    path, null, auth),
    post:   (path, body, auth)  => request('POST',   path, body, auth),
    put:    (path, body, auth)  => request('PUT',    path, body, auth),
    patch:  (path, body, auth)  => request('PATCH',  path, body, auth),
    delete: (path, auth)        => request('DELETE', path, null, auth),

    auth: {
      register: b => request('POST', '/auth/register', b, false),
      login:    b => request('POST', '/auth/login',    b, false),
      me:       ()  => request('GET',  '/auth/me'),
    },
    quiz: {
      list:      (q='')  => request('GET', `/quiz?${q}`),
      get:       id      => request('GET', `/quiz/${id}`),
      create:    b       => request('POST', '/quiz', b),
      update:    (id, b) => request('PUT', `/quiz/${id}`, b),
      delete:    id      => request('DELETE', `/quiz/${id}`),
      duplicate: id      => request('POST', `/quiz/${id}/duplicate`),
      mine:      ()      => request('GET', '/quiz?mine=true'),
    },
    room: {
      create:  b    => request('POST', '/room', b),
      get:     code => request('GET', `/room/${code}`, null, false),
      my:      ()   => request('GET', '/room/my'),
      results: code => request('GET', `/room/${code}/results`, null, false),
    },
    wsUrl: () => base(),
  };
})();
