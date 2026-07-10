export async function onRequest(context) {
    const cookie = context.request.headers.get("Cookie") || "";

    const id = cookie.match(/(?:^|;\s*)id=([^;]+)/)?.[1];

    if (!id) {
        return Response.json({ error: "No ID cookie" }, { status: 401 });
    }

    const value = await context.env.SHIFTS.get(decodeURIComponent(id));

    if (!value) {
        return Response.json({ error: "Shift not found" }, { status: 404 });
    }

    const [today, tomorrow] = value.split(",").map(v => v.trim());

    return Response.json({
        today,
        tomorrow
    });
}
