export async function onRequestPost(context) {

    const formData = await context.request.formData();

    const id = String(formData.get("id") || "")
        .trim()
        .toUpperCase();

    const name = String(formData.get("name") || "")
        .trim()
        .toUpperCase();

    const csvUrl = new URL(
        "/employees.csv",
        context.request.url
    );

    const csvText = await fetch(csvUrl).then(r => r.text());

    const lines = csvText.split(/\r?\n/);

    let found = false;

    for(let i=1;i<lines.length;i++){

        const cols = lines[i].split(",");

        if(cols.length < 2) continue;

        const csvId = cols[0]
            .trim()
            .toUpperCase();

        const csvName = cols[1]
            .trim()
            .toUpperCase();

        if(csvId === id && csvName === name){
            found = true;
            break;
        }
    }

    if(!found){
        return Response.json({
            success:false
        });
    }

    return new Response(
        JSON.stringify({success:true}),
        {
            headers:{
                "Content-Type":"application/json",

                "Set-Cookie":
`userid=${encodeURIComponent(id)}; Path=/; Max-Age=604800; SameSite=Lax`
            }
        }
    );
}
