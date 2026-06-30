// Shared helpers used by the API functions.
// Filename starts with "_" so Cloudflare Pages does NOT turn this into a route.

// ---- Configure these two values for your sheet ----
// Open your sheet, copy the long ID from the URL between /d/ and /edit
const DEFAULT_SHEET_ID = "1OyX6V_7SGFBbTzL6vTpq4gj3PQ0Q5euPUsAYraxyY94";
// The gid is the number after "gid=" in the URL when you're on the right tab (0 = first tab)
const DEFAULT_GID = "0";
// -----------------------------------------------------

export async function getSheetData(env) {
  const sheetId = (env && env.SHEET_ID) || DEFAULT_SHEET_ID;
  const gid = (env && env.SHEET_GID) || DEFAULT_GID;
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;

  const res = await fetch(url, { cf: { cacheTtl: 30, cacheEverything: true } });
  if (!res.ok) throw new Error("Could not reach the schedule sheet");

  const text = await res.text();
  const match = text.match(/setResponse\(([\s\S]*)\);?\s*$/);
  if (!match) throw new Error("Unexpected response from the sheet");

  const parsed = JSON.parse(match[1]);
  const table = parsed.table;
  if (!table || !table.rows) throw new Error("Sheet has no data");

  // Google sometimes fails to detect the header row and leaves col labels blank.
  // Detect that case and fall back to using the first data row as the header.
  let headers = (table.cols || []).map((c) => (c.label || "").trim());
  let rows = table.rows;

  const realHeaderCount = headers.filter(Boolean).length;
  if (realHeaderCount < 2 && rows.length > 0) {
    headers = rows[0].c.map((cell) => (cell && cell.v != null ? String(cell.v).trim() : ""));
    rows = rows.slice(1);
  }

  const dataRows = rows.map((r) =>
    (r.c || []).map((cell) => (cell ? cell.v : null))
  );

  return { headers, rows: dataRows };
}

export function findUser(rows, headers, arcosId, name) {
  const idIdx = headers.findIndex((h) => h.toLowerCase().replace(/\s/g, "").includes("arcos"));
  const nameIdx = headers.findIndex((h) => h.toLowerCase().trim() === "name");
  if (idIdx === -1 || nameIdx === -1) return null;

  const wantId = String(arcosId).trim().toLowerCase();
  const wantName = String(name).trim().toLowerCase();

  for (const row of rows) {
    const rowId = row[idIdx] != null ? String(row[idIdx]).trim().toLowerCase() : "";
    const rowName = row[nameIdx] != null ? String(row[nameIdx]).trim().toLowerCase() : "";
    if (rowId === wantId && rowName === wantName) {
      const schedule = {};
      headers.forEach((h, i) => {
        if (i !== idIdx && i !== nameIdx && h) {
          schedule[h] = row[i] != null ? String(row[i]).trim() : "";
        }
      });
      return {
        arcosId: String(row[idIdx]).trim(),
        name: String(row[nameIdx]).trim(),
        schedule,
      };
    }
  }
  return null;
}

export function parseCookie(cookieHeader, key) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    const k = p.slice(0, eq);
    const v = p.slice(eq + 1);
    if (k === key) return v;
  }
  return null;
}

// Produces labels like "30-Jun" to match columns such as "12-Jun"
export function todayLabel(offsetDays = 0) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(Date.now() + offsetDays * 86400000);
  return `${d.getDate()}-${months[d.getMonth()]}`;
}

export function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
