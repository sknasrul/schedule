export async function onRequestPost(context) {
    const form = await context.request.formData();

    // Normalize ID for lookup: trim + uppercase (assuming your keys are stored uppercase)
    const id = (form.get("id") || "").trim().toUpperCase();
    const name = (form.get("name") || "").trim();

    const storedName = await context.env.EMPLOYEE_DB.get(id);
    if (storedName === null) {
        return new Response("ID not found");
    }

    function normalize(str) {
        return String(str)
            .trim()
            .replace(/\s+/g, " ")
            .replace(/[\r\n]/g, "")
            .toLowerCase();
    }

    const normalizedStored = normalize(storedName);
    const normalizedEntered = normalize(name);

    if (normalizedStored === normalizedEntered) {
        return new Response("Login Success");
    }

    return new Response(JSON.stringify({
        stored: storedName,
        entered: name,
        storedNormalized: normalizedStored,
        enteredNormalized: normalizedEntered
    }, null, 2), {
        headers: { "Content-Type": "application/json" }
    });
}
