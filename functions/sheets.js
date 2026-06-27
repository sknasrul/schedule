export async function onRequest(context) {
  const SHEET_ID = "1OyX6V_7SGFBbTzL6vTpq4gj3PQ0Q5euPUsAYraxyY94";
  const SHEET_NAME = "Sheet1"; // change to your actual tab name

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=select%20*&sheet=${encodeURIComponent(SHEET_NAME)}`;

  const res = await fetch(url);
  const text = await res.text();

  const json = text
    .replace(/^[^(]+\(/, "")
    .replace(/\);?\s*$/, "");

  const data = JSON.parse(json);

  const cols = data.table.cols.map(c => c.label);
  const rows = data.table.rows.map(row => {
    const obj = {};
    row.c.forEach((cell, i) => {
      let val = cell ? cell.v : null;
      if (typeof val === "string" && val.startsWith("Date(")) {
        const parts = val.match(/\d+/g).map(Number);
        val = new Date(parts[0], parts[1], parts[2]).toLocaleDateString("en-IN");
      }
      obj[cols[i]] = val;
    });
    return obj;
  });

  return new Response(JSON.stringify(rows, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
