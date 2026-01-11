import { StateDO } from "./state-do";
import { EmailWorkflow } from "./email-workflow";

export { StateDO, EmailWorkflow };

export interface Env {
  STATE: DurableObjectNamespace;
  EMAIL_WORKFLOW: Workflow;
  AI: any;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (
      url.pathname.startsWith("/store") ||
      url.pathname.startsWith("/list-drafts") ||
      url.pathname.startsWith("/get-latest-draft")
    ) {
      const id = env.STATE.idFromName("global");
      return env.STATE.get(id).fetch(req);
    }

    if (req.method === "POST" && url.pathname === "/start") {
      console.log("!!! WORKFLOW START TRIGGERED !!!");

      const { resumeText, jobUrl, userId } = (await req.json()) as any;
      const instance = await env.EMAIL_WORKFLOW.create({
        params: { resumeText, jobUrl, userId },
      });
      return Response.json({ workflowId: instance.id });
    }

    if (req.method === "POST" && url.pathname === "/feedback") {
      const { workflowId, feedback } = (await req.json()) as any;
      const instance = await env.EMAIL_WORKFLOW.get(workflowId);
      await instance.sendEvent({ type: "user_feedback", payload: feedback });
      return Response.json({ status: "sent" });
    }

    if (req.method === "GET" && url.pathname === "/status") {
      const workflowId = url.searchParams.get("workflowId");
      if (!workflowId) return new Response("Missing ID", { status: 400 });

      const instance = await env.EMAIL_WORKFLOW.get(workflowId);
      const status = await instance.status();
      return Response.json(status);
    }

    return new Response("Not found", { status: 404 });
  },
};