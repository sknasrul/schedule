export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const SHEET_ID   = "1OyX6V_7SGFBbTzL6vTpq4gj3PQ0Q5euPUsAYraxyY94";
  const SHEET_NAME = "Sheet1";

  try {
    const { arcosId, name } = await context.request.json();

    if (!arcosId || !name) {
      return new Response(JSON.stringify({ success: false, message: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=select%20*&sheet=${encodeURIComponent(SHEET_NAME)}`;
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

    const user = rows.find(r =>
      r["Arcos ID"]?.toString().trim().toLowerCase() === arcosId.trim().toLowerCase() &&
      r["Name"]?.toString().trim().toLowerCase()     === name.trim().toLowerCase()
    );

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: "Invalid Arcos ID or Name. Please check and try again." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cookieValue = encodeURIComponent(JSON.stringify({
      arcosId: user["Arcos ID"],
      name:    user["Name"],
    }));

    return new Response(JSON.stringify({ success: true, name: user["Name"] }), {
      headers: {
        "Content-Type": "application/json",
        // 30 days cookie
        "Set-Cookie": `arcos_user=${cookieValue}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`,
      },
    });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: "Server error. Try again later." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
