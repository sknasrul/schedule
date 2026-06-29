export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const SHEET_ID   = "1OyX6V_7SGFBbTzL6vTpq4gj3PQ0Q5euPUsAYraxyY94";
  const SHEET_NAME = "Sheet1";
  const HEADER_ROW = 2; // ← change this to whichever row has "Arcos ID", "Name" etc.

  try {
    const { arcosId, name } = await context.request.json();

    if (!arcosId || !name) {
      return new Response(JSON.stringify({ success: false, message: "Please enter both Arcos ID and name." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=select%20*&sheet=${encodeURIComponent(SHEET_NAME)}&headers=${HEADER_ROW}`;

    const res  = await fetch(url);
    const text = await res.text();

    const json = text
      .replace(/^[^(]+\(/, "")
      .replace(/\);?\s*$/, "");

    const data = JSON.parse(json);
    const cols = data.table.cols.map(c => c.label);

    const rows = data.table.rows.map(row => {
      const obj = {};
      row.c.forEach((cell, i) => { obj[cols[i]] = cell ? cell.v : null; });
      return obj;
    });

    // Find columns flexibly — handles casing/spacing variations
    const arcosCol = cols.find(c =>
      c?.toLowerCase().replace(/\s+/g, " ").trim() === "arcos id"
    );
    const nameCol = cols.find(c =>
      c?.toLowerCase().trim() === "name"
    );

    if (!arcosCol || !nameCol) {
      return new Response(JSON.stringify({
        success: false,
        message: "Sheet configuration error.",
        debug: { cols, arcosCol, nameCol }
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const inputId   = arcosId.trim().toLowerCase();
    const inputName = name.trim().toLowerCase();

    const user = rows.find(r => {
      const rowId   = r[arcosCol]?.toString().trim().toLowerCase();
      const rowName = r[nameCol]?.toString().trim().toLowerCase();
      return rowId === inputId && rowName === inputName;
    });

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: "Invalid Arcos ID or Name. Please check and try again.",
        debug: {
          cols,
          arcosCol,
          nameCol,
          inputId,
          inputName,
          sampleIds:   rows.slice(0, 5).map(r => r[arcosCol]),
          sampleNames: rows.slice(0, 5).map(r => r[nameCol]),
        }
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cookieValue = encodeURIComponent(JSON.stringify({
      arcosId: user[arcosCol],
      name:    user[nameCol],
    }));

    return new Response(JSON.stringify({ success: true, name: user[nameCol] }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `arcos_user=${cookieValue}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`,
      },
    });

  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      message: "Server error. Try again later.",
      debug: e.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
