export async function onRequestGet(context) {
  const { request, env } = context;

  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  const sessionToken = match ? decodeURIComponent(match[1]) : null;

  if (!sessionToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const sessionRaw = await env.SESSIONS.get(sessionToken);
  if (!sessionRaw) {
    return Response.json({ error: 'Invalid or expired session' }, { status: 401 });
  }
  const session = JSON.parse(sessionRaw); // { id, name }

  const raw = await env.SHIFT.get(session.id);        // 👈 renamed
  if (!raw) {
    return Response.json({ error: 'No schedule found for this user' }, { status: 404 });
  }

  const [today, tomorrow] = raw.split(',').map(s => s.trim());
  return Response.json({ id: session.id, name: session.name, today, tomorrow });
}
