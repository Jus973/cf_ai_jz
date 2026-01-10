import { DurableObject } from 'cloudflare:workers';

export class StateDO extends DurableObject {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/store-latest") {
      const text = await request.text();
      await this.ctx.storage.put("latest", text);
      return new Response("stored");
    }

    if (url.pathname === "/get-latest") {
      const latest = await this.ctx.storage.get("latest");
      return new Response(latest as string || "");
    }

    return new Response("Not found", { status: 404 });
  }
}