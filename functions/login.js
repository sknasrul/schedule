export async function onRequestPost(context) {

    const form = await context.request.formData();

    const arcos = form.get("arcos");
    const name = form.get("name");

    const response = await fetch(
        "https://script.google.com/macros/s/AKfycbyDfnNPFSlqyXySGI5L3fFwcDawvsf31hc2ISgl0bZCNj15v1RoI5SetTBNesaPfmXg/exec",
        {
            method: "POST",
            body: new URLSearchParams({
                arcos,
                name
            })
        }
    );

    const result = await response.json();

    if(result.success){

        return Response.redirect(
            new URL("/home.html", context.request.url),
            302
        );

    }

    return Response.redirect(
        new URL("/index.html", context.request.url),
        302
    );

}
