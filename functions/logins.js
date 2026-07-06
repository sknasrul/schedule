export async function onRequest() {
  return new Response("Hi, user", {
    headers: {
      "Content-Type": "text/plain; charset=UTF-8"
    }
  });
}
