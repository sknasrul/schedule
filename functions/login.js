export async function onRequestPost(context) {

    const form = await context.request.formData();

    const id = (form.get("id") || "").trim();
    const name = (form.get("name") || "").trim();

    const storedName = await context.env.EMPLOYEE_DB.get(id);

    if (storedName === null) {
        return new Response("ID not found");
    }

    function normalize(str) {
        return String(str)
            .trim()
            .replace(/\s+/g, " ")   // collapse multiple spaces
            .replace(/\r/g, "")
            .replace(/\n/g, "")
            .toLowerCase();
    }

    if (normalize(storedName) === normalize(name)) {
        return new Response("Login Success");
    }

    return new Response(
        return new Response(JSON.stringify({
    stored: storedName,
    entered: name,
    storedNormalized: normalize(storedName),
    enteredNormalized: normalize(name)
}, null, 2), {
    headers: {
        "Content-Type": "application/json"
    }
});
    );
}
