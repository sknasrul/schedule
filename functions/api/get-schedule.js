const EMP_ID_COOKIE = 'id';
const ID_PATTERN = /^[A-Z0-9]{3,20}$/;

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function onRequestGet({ request, env }) {
  const rawId = getCookie(request, EMP_ID_COOKIE);

  if (!rawId) {
    return jsonResponse({ error: 'No employee ID cookie found.' }, 401);
  }

  const id = rawId.trim().toUpperCase();

  if (!ID_PATTERN.test(id)) {
    return jsonResponse({ error: 'Invalid employee ID.' }, 400);
  }

  if (!env.SCHEDULE) {
    return jsonResponse({ error: 'Schedule KV namespace is not bound to this Pages project.' }, 500);
  }

  let value;
  try {
    value = await env.SCHEDULE.get(id);
  } catch (err) {
    return jsonResponse({ error: 'Failed to read schedule.' }, 502);
  }

  if (value === null) {
    return jsonResponse({ error: 'No schedule found for ID ' + id + '.' }, 404);
  }

  return jsonResponse({ id, value }, 200);
}
