import { getSheetData, findUser, parseCookie, todayLabel, json } from "../_utils.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const cookieHeader = request.headers.get("Cookie") || "";
  const session = parseCookie(cookieHeader, "session");

  if (!session) return json({ success: false }, 401);

  let saved;
  try {
    saved = JSON.parse(atob(session));
  } catch {
    return json({ success: false }, 401);
  }

  try {
    const { headers, rows } = await getSheetData(env);
    const user = findUser(rows, headers, saved.arcosId, saved.name);
    if (!user) return json({ success: false }, 401);

    const today = todayLabel();
    const todayShift = user.schedule[today] || "";

    return json({
      success: true,
      arcosId: user.arcosId,
      name: user.name,
      today,
      todayShift,
      schedule: user.schedule,
    });
  } catch (err) {
    return json({ success: false, message: "Couldn't reach the schedule sheet." }, 502);
  }
}
