export async function onRequestGet(context) {

    const cookie =
        context.request.headers.get("Cookie") || "";

    const match =
        cookie.match(/userid=([^;]+)/);

    if(!match){
        return Response.json(
            {success:false},
            {status:401}
        );
    }

    const userId =
        decodeURIComponent(match[1])
        .trim()
        .toUpperCase();

    const csvUrl = new URL(
        "/employees.csv",
        context.request.url
    );

    const csvText =
        await fetch(csvUrl).then(r => r.text());

    const lines =
        csvText.trim().split(/\r?\n/);

    const headers =
        lines[0].split(",");

    for(let i=1;i<lines.length;i++){

        const cols = lines[i].split(",");

        if(
            cols[0]
            .trim()
            .toUpperCase()
            === userId
        ){

            const result = {};

            headers.forEach((h,index)=>{
                result[h.trim()] =
                    cols[index]?.trim() || "";
            });

            return Response.json({
                success:true,
                data:result
            });
        }
    }

    return Response.json({
        success:false
    });
}
