export async function onRequestPost(context) {

    const form = await context.request.formData();

    const arcos = (form.get("arcos") || "").trim();
    const name = (form.get("name") || "").trim().toLowerCase();

    // Read CSV from your project
    const csv = await fetch(new URL("/users.csv", context.request.url))
        .then(r => r.text());

    const lines = csv.split(/\r?\n/);

    // Skip header row
    let valid = false;

    for (let i = 1; i < lines.length; i++) {

        if (!lines[i].trim()) continue;

        const [csvArcos, csvName] = lines[i].split(",");

        if (
            csvArcos.trim() === arcos &&
            csvName.trim().toLowerCase() === name
        ) {
            valid = true;
            break;
        }
    }

    if (!valid) {
        return new Response("Invalid Arcos ID or Name", {
            status: 401
        });
    }

    // Login successful
    const home = await fetch(new URL("/home.html", context.request.url));

        return new Response(home.body, {
            headers: {
                "Content-Type": "text/html",
                "Set-Cookie": "user=12345; Path=/; HttpOnly; SameSite=Lax"
            }
        });
    }

}
