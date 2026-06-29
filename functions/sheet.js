export async function onRequest(context) {
  const SHEET_ID   = "1OyX6V_7SGFBbTzL6vTpq4gj3PQ0Q5euPUsAYraxyY94";
  const SHEET_NAME = "Sheet1";

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=select%20*&sheet=${encodeURIComponent(SHEET_NAME)}&headers=2`;
  try {
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

    return new Response(JSON.stringify({ cols, rows }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
