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

    if (url.pathname.startsWith("/store") || url.pathname.startsWith("/list") || url.pathname.startsWith("/get-latest")) {
      const id = env.STATE.idFromName("global");
      return env.STATE.get(id).fetch(req);
    }
    
    if (req.method === "GET" && url.pathname === "/") {
      return new Response(HTML_CONTENT, { headers: { "Content-Type": "text/html" } });
    }
    
    if (req.method === "POST" && url.pathname === "/start") {
      const { resumeText, jobUrl, userId } = await req.json() as any;
      const instance = await env.EMAIL_WORKFLOW.create({
        params: { resumeText, jobUrl, userId },
      });
      return Response.json({ workflowId: instance.id });
    }

    if (req.method === "POST" && url.pathname === "/feedback") {
      const { workflowId, feedback } = await req.json() as any;
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
  }
};

const HTML_CONTENT = `
<html>
  <body style="font-family: system-ui; max-width: 800px; margin: 2rem auto; padding: 0 1rem;">
    <h2>AI Email Generator</h2>
    <form id="email-form">
      <textarea name="resumeText" placeholder="Paste Resume here..." required rows="5" style="width:100%"></textarea><br/><br/>
      <input name="jobUrl" placeholder="Job URL" required style="width:100%" /><br/><br/>
      <button type="submit">Generate Draft</button>
    </form>

    <hr/>
    <p><b>Workflow Status:</b> <span id="status">Idle</span></p>
    
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <h3>Live Draft</h3>
        <pre id="result" style="background:#eee; padding:1rem; white-space:pre-wrap; min-height:200px; border:1px solid #ccc;"></pre>
      </div>
      <div>
        <h3>Feedback</h3>
        <textarea id="feedback" rows="5" style="width:100%" placeholder="e.g. Make it shorter..."></textarea><br/><br/>
        <button id="send-feedback">Update Draft</button>
      </div>
    </div>

    <script>
      let currentWorkflowId = null;

        document.getElementById('email-form').addEventListener('submit', async (e) => {
          e.preventDefault();
        const fd = new FormData(e.target);
        const res = await fetch('/start', {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(fd))
        });
        const data = await res.json();
        currentWorkflowId = data.workflowId;
        poll();
      });

      async function poll() {
        const interval = setInterval(async () => {
          // 1. Get Status
          const sRes = await fetch('/status?workflowId=' + currentWorkflowId);
          const sData = await sRes.json();
          document.getElementById('status').textContent = sData.status;

          // 2. Get the actual content from the Durable Object
          const dRes = await fetch('/get-latest');
          const text = await dRes.text();
          if (text) document.getElementById('result').textContent = text;

          if (sData.status === 'complete' || sData.status === 'errored') clearInterval(interval);
        }, 2000);
      }

      document.getElementById('send-feedback').addEventListener('click', async () => {
        const feedback = document.getElementById('feedback').value;
        await fetch('/feedback', {
          method: 'POST',
          body: JSON.stringify({ workflowId: currentWorkflowId, feedback })
        });
        document.getElementById('feedback').value = '';
      });
    </script>
  </body>
</html>
`;