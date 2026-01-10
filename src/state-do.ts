import { DurableObject } from 'cloudflare:workers';

export class StateDO extends DurableObject {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/store-latest-draft") {
      const body = await request.text();
      const parsed = JSON.parse(body) as { draft: string; createdAt: string };

      await this.ctx.storage.put("latest-draft", parsed.draft);

      const key = `draft:${parsed.createdAt}`;
      await this.ctx.storage.put(key, parsed);

      return new Response("stored-draft");
    }

    if (url.pathname === "/get-latest-draft") {
      const latest = await this.ctx.storage.get("latest-draft");
      return new Response((latest as string) || "");
    }

    if (url.pathname === "/list-drafts") {
      const list = await this.ctx.storage.list(); // Map-like: Map<string, any>

      const obj: Record<string, any> = {};
      for (const [key, value] of list.entries ? list.entries() : (list as any)) {
        obj[key] = value;
      }

      return new Response(JSON.stringify(obj), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }
}
