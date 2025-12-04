export class StateDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    console.log("DO fetch", url.pathname);
    
    if (url.pathname === "/store") {
      const body = await request.text();

      let emails = (await this.state.storage.get("emails")) || [];
      emails.push({
        email: body,
        timestamp: Date.now()
      });

      await this.state.storage.put("emails", emails);
      return new Response("saved");
    }

    if (url.pathname === "/list") {
      const emails = (await this.state.storage.get("emails")) || [];
      return new Response(JSON.stringify(emails, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("durable object active");
  }
}