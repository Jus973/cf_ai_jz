export default {
  async fetch(req, env) {
    try {
      const result = await env.AI.run(
        "@cf/meta/llama-3.2-1b-instruct ",
        { messages: [{ role: "user", content: "Say hello" }] }
      );
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(err.toString(), { status: 500 });
    }
  },
};
