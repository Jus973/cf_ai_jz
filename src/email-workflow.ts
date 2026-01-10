import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import type { Env } from './index';

type Params = { resumeText: string; jobUrl: string; userId: string; };

export class EmailWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { resumeText, jobUrl, userId } = event.payload;
    console.log("Full Event Object:", JSON.stringify(event));
    console.log("Fetching URL:", jobUrl);

    if (!jobUrl) {
      throw new Error("Fetch failed: The URL is undefined.");
    }

    const jobText = await step.do("fetch job", async () => {
      const res = await fetch(jobUrl);
      return res.ok ? (await res.text()).slice(0, 3000) : "Job description unavailable";
    });

    const draftResp = await step.do("generate email", async () => {
      return await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt: `Write a short professional job application email. Job: ${jobText} Resume: ${resumeText}`
      });
    });

    let currentEmail = draftResp.response;

    while (true) {
      await step.do("sync to storage", async () => {
        await this.env.STATE.get(this.env.STATE.idFromName("global")).fetch("http://do/store-latest", {
          method: "POST",
          body: currentEmail
        });
      });

      const feedbackEvent = await step.waitForEvent("user_feedback", {
        type: "user_feedback",
        timeout: "5 minutes",
      });

      const feedback = (feedbackEvent.payload as string).trim();
      if (feedback.toLowerCase() === "done") break;

      // 4. Revise
      const revResp = await step.do("revise email", async () => {
        return await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          prompt: `Revise this email: "${currentEmail}" based on this user feedback: "${feedback}"`
        });
      });
      currentEmail = revResp.response;
    }

    return { finalEmail: currentEmail };
  }
}