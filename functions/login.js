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
            .replace(/[\r\n]/g, "") // strip line breaks
            .toLowerCase();
    }

    const normalizedStored = normalize(storedName);
    const normalizedEntered = normalize(name);

    if (normalizedStored === normalizedEntered) {
        return new Response("Login Success");
    }

    // Debug response for mismatches
    return new Response(JSON.stringify({
        stored: storedName,
        entered: name,
        storedNormalized: normalizedStored,
        enteredNormalized: normalizedEntered
    }, null, 2), {
        headers: {
            "Content-Type": "application/json"
        }
    });
}
