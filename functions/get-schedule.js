// Cloudflare Pages Function: GET /api/get-schedule
//
// Reads the employee's schedule from the "SCHEDULE" KV namespace.
// In your Pages project settings, bind that KV namespace with the
// variable name "schedule" (Settings -> Functions -> KV namespace bindings),
// so it is available here as env.schedule.
//
// The employee's KV key (e.g. "ARL19786") is expected in a cookie
// named "id", set by login.html. Change EMP_ID_COOKIE below if that
// ever changes -- this is the only file that needs to know the name.

const EMP_ID_COOKIE = 'id';

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function onRequestGet({ request, env }) {
  const id = getCookie(request, EMP_ID_COOKIE);

  if (!id) {
    return new Response(JSON.stringify({ error: 'No employee ID cookie found.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!env.schedule) {
    return new Response(JSON.stringify({ error: 'Schedule KV namespace is not bound to this Pages project.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const value = await env.schedule.get(id);

  if (value === null) {
    return new Response(JSON.stringify({ error: 'No schedule found for ID ' + id + '.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ id: id, value: value }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
