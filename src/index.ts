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

    if (url.pathname.startsWith("/store") || url.pathname.startsWith("/list-drafts") || url.pathname.startsWith("/get-latest-draft")) {
      const id = env.STATE.idFromName("global");
      return env.STATE.get(id).fetch(req);
    }
    
    if (req.method === "GET" && url.pathname === "/") {
      return new Response(HTML_CONTENT, { headers: { "Content-Type": "text/html" } });
    }
    
    if (req.method === "POST" && url.pathname === "/start") {
      console.log("!!! WORKFLOW START TRIGGERED !!!");

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
  <body style="font-family: system-ui; max-width: 1000px; margin: 2rem auto; padding: 0 1rem; background: #f4f7f6;">
    <h2 style="color: #2c3e50;">AI Email Generator</h2>
    
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 30px;">
      
      <div>
        <form id="email-form" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <label><b>Resume Text</b></label>
          <textarea name="resumeText" placeholder="Paste Resume here..." required rows="6" style="width:100%; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; padding: 8px;"></textarea>
          
          <label><b>Target Job URL</b></label>
          <input name="jobUrl" placeholder="https://linkedin.com/jobs/..." required style="width:100%; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; padding: 8px;" />
          
          <button type="submit" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">Generate Draft</button>
        </form>

        <div style="margin-top: 20px; background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="display:flex; justify-content: space-between; align-items: center;">
            <h3 style="margin:0;">Live Draft</h3>
            <span id="status" style="padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; background: #eee;">Idle</span>
          </div>
          <pre id="result" style="background:#f9f9f9; padding:1rem; white-space:pre-wrap; min-height:250px; border:1px solid #eee; margin-top: 15px; font-family: inherit;"></pre>
          
          <div style="margin-top: 15px;">
            <label><b>Refine with Feedback</b></label>
            <textarea id="feedback" rows="3" style="width:100%; margin-top:5px; border: 1px solid #ddd; border-radius: 4px; padding: 8px;" placeholder="e.g. Make it more professional..."></textarea>
            <button id="send-feedback" style="margin-top: 10px; background: #2ecc71; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">Update Draft</button>
          </div>
        </div>
      </div>

      <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-height: 800px; overflow-y: auto;">
        <h3 style="margin-top:0;">Past Drafts</h3>
        <div id="history-list">
          <p style="color: #888;">No drafts saved yet.</p>
        </div>
      </div>

    </div>

    <script>
      let currentWorkflowId = null;

      document.getElementById('email-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        document.getElementById('result').textContent = "Starting workflow...";
        const fd = new FormData(e.target);
        const res = await fetch('/start', {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(fd))
        });
        const data = await res.json();
        currentWorkflowId = data.workflowId;
        poll();
      });

      let pollingInterval = null; // Move this to top level

      async function poll() {
        // Clear any existing pollers before starting a new one
        if (pollingInterval) clearInterval(pollingInterval);

        pollingInterval = setInterval(async () => {
          try {
            const sRes = await fetch('/status?workflowId=' + currentWorkflowId);
            const sData = await sRes.json();
            
            const statusEl = document.getElementById('status');
            statusEl.textContent = sData.status;

            // Only fetch draft if the workflow is active or complete
            if (sData.status !== 'queued') {
              const dRes = await fetch('/get-latest-draft');
              const text = await dRes.text();
              // Only update the UI if there is actual content
              if (text && text !== "No draft found") {
                document.getElementById('result').textContent = text;
              }
            }

            // Stop polling if finished
            if (sData.status === 'complete' || sData.status === 'errored' || sData.status === 'terminated') {
              clearInterval(pollingInterval);
              loadHistory();
            }
          } catch (err) {
            console.error("Polling error:", err);
          }
        }, 2000);
      }

      document.getElementById('send-feedback').addEventListener('click', async () => {
        const feedback = document.getElementById('feedback').value;
        if (!currentWorkflowId) return alert("Start a generation first!");
        
        await fetch('/feedback', {
          method: 'POST',
          body: JSON.stringify({ workflowId: currentWorkflowId, feedback })
        });
        document.getElementById('feedback').value = '';
        document.getElementById('status').textContent = "waiting-for-event";
      });

      async function loadHistory() {
        console.log("Loading history...");
        const res = await fetch('/list-drafts');
        if (!res.ok) return;
        
        const historyData = await res.json(); // This expects a Map/Object from DO storage.list()
        const container = document.getElementById('history-list');
        container.innerHTML = '';

        // Sort items by key (assuming keys are timestamps) to show newest first
        const entries = Object.entries(historyData).reverse();

        if (entries.length === 0) {
          container.innerHTML = '<p style="color: #888;">No drafts saved yet.</p>';
          return;
        }

        entries.forEach(([key, value]) => {
          const item = document.createElement('div');
          item.style = "padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; font-size: 0.9rem;";
          
          // If value is an object with a draft, show a snippet
          const content = typeof value === 'object' ? value.draft : value;
          const snippet = content.substring(0, 60) + "...";
          
          item.innerHTML = \`
            <div style="font-weight: bold; color: #3498db;">\${key.replace('draft:', '')}</div>
            <div style="color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">\${snippet}</div>
          \`;
          
          item.onclick = () => {
            document.getElementById('result').textContent = content;
            document.getElementById('status').textContent = "Viewing History";
          };
          container.appendChild(item);
        });
      }

      // Load history when the page first opens
      loadHistory();
    </script>
  </body>
</html>
`;