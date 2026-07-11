// functions/schedule.js
// Reads Arcos ID from cookie, fetches the Google Sheet via gviz,
// and returns ONLY that employee's row as JSON.

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = decodeURIComponent(pair.slice(idx + 1).trim());
    cookies[key] = value;
  });
  return cookies;
}

// Strips the google.visualization.Query.setResponse(...) wrapper
function parseGvizResponse(text) {
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/);
  if (!match) throw new Error("Unexpected gviz response format");
  return JSON.parse(match[1]);
}

export async function onRequestGet(context) {
  const { request, env } = context;

  // 1. Get Arcos ID from cookie
  const cookies = parseCookies(request.headers.get("Cookie"));
  const arcosId = cookies.arcosId; // adjust key name if yours differs
  const employeeName = cookies.employeeName;

  if (!arcosId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const targetId = arcosId.trim().toUpperCase();

  // 2. Fetch sheet via gviz
  // Set SHEET_ID as a Cloudflare Pages environment variable:
  //   SHEET_ID = 1OyX6V_7SGFBbTzL6vTpq4gj3PQ0Q5euPUsAYraxyY94
  // Falls back to the known value below only if the env var isn't set.
  const SHEET_ID = env.SHEET_ID || "1OyX6V_7SGFBbTzL6vTpq4gj3PQ0Q5euPUsAYraxyY94";
  const GID = env.SHEET_GID || "0"; // Sheet1 tab
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;

  const sheetRes = await fetch(gvizUrl);
  if (!sheetRes.ok) {
    return new Response(JSON.stringify({ error: "Failed to fetch sheet" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawText = await sheetRes.text();
  let gviz;
  try {
    gviz = parseGvizResponse(rawText);
  } catch (e) {
    return new Response(JSON.stringify({ error: "Failed to parse sheet response" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cols = gviz.table.cols;
  const rows = gviz.table.rows;

  // 3. Header-detection fallback: find Arcos ID / Name columns by label,
  // fall back to positional (0 = ID, 1 = Name) if labels are blank/missing.
  let idColIdx = cols.findIndex((c) => (c.label || "").toLowerCase().includes("arcos"));
  let nameColIdx = cols.findIndex((c) => (c.label || "").toLowerCase().includes("name"));
  if (idColIdx === -1) idColIdx = 0;
  if (nameColIdx === -1) nameColIdx = 1;

  // Date columns = everything else, in original order
  const dateCols = cols
    .map((c, i) => ({ index: i, label: c.label }))
    .filter((c) => c.index !== idColIdx && c.index !== nameColIdx && c.label && c.label.trim() !== "");

  // 4. Find the matching row
  const matchRow = rows.find((r) => {
    const cellVal = r.c[idColIdx]?.v;
    return cellVal && String(cellVal).trim().toUpperCase() === targetId;
  });

  if (!matchRow) {
    return new Response(JSON.stringify({ error: "Employee not found in sheet" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5. Build the response: only this employee's data
  const schedule = {};
  dateCols.forEach((col) => {
    const cell = matchRow.c[col.index];
    schedule[col.label] = cell && cell.v !== null && cell.v !== undefined ? String(cell.v) : "";
  });

  const result = {
    arcosId: targetId,
    name: matchRow.c[nameColIdx]?.v || employeeName || "",
    schedule, // { "12-Jun": "Day Present", "13-Jun": "Week Off", ... }
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
