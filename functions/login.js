export async function onRequestPost(context) {

    const form = await context.request.formData();

    const id = (form.get("id") || "").trim();
    const name = (form.get("name") || "").trim();

    // Get the name stored for this ID
    const storedName = await context.env.EMPLOYEE_DB.get(id);

    // ID not found
    if (storedName === null) {
        return Response.redirect(
            new URL("/index.html", context.request.url),
            302
        );
    }

    // Compare names (case-insensitive)
    if (storedName.toLowerCase() !== name.toLowerCase()) {
        return Response.redirect(
            new URL("/index.html", context.request.url),
            302
        );
    }

    // Login successful
    return Response.redirect(
        new URL("/home.html", context.request.url),
        302
    );
}
