import { getSheetData, findUser, json } from "../_utils.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: "Could not read the form. Please try again." }, 400);
  }

  const arcosId = (body.arcosId || "").toString().trim();
  const name = (body.name || "").toString().trim();

  if (!arcosId || !name) {
    return json({ success: false, message: "Enter both your Arcos ID and your name." }, 400);
  }

  try {
    const { headers, rows } = await getSheetData(env);
    const user = findUser(rows, headers, arcosId, name);

    if (!user) {
      return json({ success: false, message: "Arcos ID or name doesn't match our records." }, 401);
    }

    const token = btoa(JSON.stringify({ arcosId: user.arcosId, name: user.name }));
    const cookie = `session=${token}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=2592000`;

    return json({ success: true, name: user.name }, 200, { "Set-Cookie": cookie });
  } catch (err) {
    return json({ success: false, message: "Couldn't reach the schedule sheet. Try again shortly." }, 502);
  }
}
