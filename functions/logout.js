export async function onRequest(context) {
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "arcos_user=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
    },
  });
}
