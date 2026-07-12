export async function onRequest(context) {
    const cookie = context.request.headers.get("Cookie") || "";

    const loggedIn = cookie
        .split(";")
        .some(c => c.trim().startsWith("id="));

    if (!loggedIn) {
        return Response.redirect(new URL("/login.html", context.request.url), 302);
    }

    return context.next();
}
