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

    if (normalize(storedName) !== normalize(name)) {
        return Response.redirect(
            new URL("/index.html", context.request.url),
            302
        );
    }

    // Delete all existing cookies sent by the browser
    const cookieHeader = context.request.headers.get("Cookie") || "";
    const cookies = cookieHeader
        .split(";")
        .map(c => c.trim())
        .filter(Boolean);

    const headers = new Headers();

    // Expire every existing cookie
    for (const cookie of cookies) {
        const cookieName = cookie.split("=")[0];
        headers.append(
            "Set-Cookie",
            `${cookieName}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
        );
    }

    // Set the new login cookie (name=id)
    headers.append(
        "Set-Cookie",
        `${encodeURIComponent(name)}=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`
    );

    headers.set("Location", "/home.html");

    return new Response(null, {
        status: 302,
        headers
    });

}
