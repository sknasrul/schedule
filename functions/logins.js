export async function onRequestPost(context) {

    const form = await context.request.formData();

    // Get form values
    const id = (form.get("id") || "").trim().toUpperCase();
    const name = (form.get("name") || "").trim();

    // Lookup ID in KV
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

    // Name doesn't match
    if (normalize(storedName) !== normalize(name)) {
        return Response.redirect(
            new URL("/index.html", context.request.url),
            302
        );
    }

    // Prepare response headers
    const headers = new Headers();

    // Delete existing cookies
    const cookieHeader = context.request.headers.get("Cookie") || "";

    cookieHeader.split(";").forEach(cookie => {
        const cookieName = cookie.split("=")[0]?.trim();
        if (cookieName) {
            headers.append(
                "Set-Cookie",
                `${cookieName}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
            );
        }
    });

    // Set login cookies
    headers.append(
        "Set-Cookie",
        `id=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`
    );

    headers.append(
        "Set-Cookie",
        `name=${encodeURIComponent(storedName)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`
    );

    // Redirect after login
    headers.set("Location", "/home");

    return new Response(null, {
        status: 302,
        headers
    });

}
