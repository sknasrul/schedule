export async function onRequest(context) {
  const SHEET_ID   = "1OyX6V_7SGFBbTzL6vTpq4gj3PQ0Q5euPUsAYraxyY94";
  const SHEET_NAME = "Sheet1";

  try {
    const cookieHeader = context.request.headers.get("Cookie") || "";
    const match        = cookieHeader.match(/arcos_user=([^;]+)/);

    if (!match) {
      return new Response(JSON.stringify({ loggedIn: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = JSON.parse(decodeURIComponent(match[1]));

    const url  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=select%20*&sheet=${encodeURIComponent(SHEET_NAME)}&headers=2`;
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

    const dateCols = cols.filter(c => c && c !== "Arcos ID" && c !== "Name");

    const userRow = rows.find(r =>
      r["Arcos ID"]?.toString().trim().toLowerCase() === user.arcosId?.toString().trim().toLowerCase()
    );

    if (!userRow) {
      return new Response(JSON.stringify({ loggedIn: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const schedule = dateCols.map(col => ({
      date:  col,
      shift: userRow[col] || null,
    }));

    return new Response(JSON.stringify({
      loggedIn: true,
      arcosId:  userRow["Arcos ID"],
      name:     userRow["Name"],
      schedule,
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ loggedIn: false, error: e.message }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
