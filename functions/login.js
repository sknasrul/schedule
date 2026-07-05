export async function onRequestPost(context) {

    const form = await context.request.formData();

    // Normalize ID for KV lookup
    const id = (form.get("id") || "").trim().toUpperCase();

    // Original name (used for cookie)
    const name = (form.get("name") || "").trim();

    // Get stored name from KV
    const storedName = await context.env.EMPLOYEE_DB.get(id);

    // ID not found
    if (storedName === null) {
        return Response.redirect(
            new URL("/index.html", context.request.url),
            302
        );
    }

    // Normalize names for comparison
    function normalize(str) {
        return String(str)
            .trim()
            .replace(/\s+/g, " ")
            .replace(/[\r\n]/g, "")
            .toLowerCase();
    }

    const normalizedStored = normalize(storedName);
    const normalizedEntered = normalize(name);

    // Login successful
    if (normalizedStored === normalizedEntered) {

        return new Response(null, {
            status: 302,
            headers: {
                "Location": "/home.html",
                "Set-Cookie": `${encodeURIComponent(name)}=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`
            }
        });

    }

    // Login failed
    return Response.redirect(
        new URL("/index.html", context.request.url),
        302
    );

}
