export async function onRequestGet(context) {
  const { request, env } = context;

  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)id=([^;]+)/);
  const id = match ? decodeURIComponent(match[1]) : null;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Use the binding NAME "SHIFT", not the namespace name "shift"
  const raw = await env.SHIFT.get(id);

  if (raw === null) {
    return new Response(JSON.stringify({ error: 'No shift data found for this id' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  const today = parts[0] || null;
  const tomorrow = parts[1] || null;

  return new Response(JSON.stringify({ id, today, tomorrow }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
