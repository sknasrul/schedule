export async function onRequestPost(context) {

    const form = await context.request.formData();

    const id = (form.get("id") || "").trim();
    const name = (form.get("name") || "").trim();

    const storedName = await context.env.EMPLOYEE_DB.get(id);

    if (!storedName) {
        return Response.redirect(
            new URL("/index.html", context.request.url),
            302
        );
    }

    // Normalize names
    const normalize = str =>
        str
            .trim()                  // Remove leading/trailing spaces
            .replace(/\s+/g, " ")    // Multiple spaces → single space
            .toLowerCase();          // Ignore case

    if (normalize(storedName) !== normalize(name)) {
        return Response.redirect(
            new URL("/index.html", context.request.url),
            302
        );
    }

    return Response.redirect(
        new URL("/home.html", context.request.url),
        302
    );
}
