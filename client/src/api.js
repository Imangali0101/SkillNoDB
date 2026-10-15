const cacheKey = (path) => `skillswap-cache:${localStorage.getItem('token') || 'guest'}:${path}`;

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const key = cacheKey(path);
  let res;
  try {
    res = await fetch('/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    // Network-only fallback: return the last cached GET result while offline.
    if (method === 'GET') {
      const cached = localStorage.getItem(key);
      if (cached) return JSON.parse(cached);
    }
    throw error;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) localStorage.removeItem('token');
    throw new Error(data.error || 'Ошибка запроса');
  }
  if (method === 'GET') localStorage.setItem(key, JSON.stringify(data));
  else {
    // Invalidate cached GET responses after a successful write.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(`skillswap-cache:${token || 'guest'}:`)) localStorage.removeItem(k);
    }
  }
  return data;
}
