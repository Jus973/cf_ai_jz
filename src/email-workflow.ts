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
        prompt: `Write a short professional job application email. Job: ${jobText} Resume: ${resumeText}`,
        max_tokens: 2048
      });
    });

    let currentEmail = draftResp.response;

    await step.do("sync to storage", async () => {
      await this.env.STATE.get(this.env.STATE.idFromName("global")).fetch(
        "http://do/store-latest-draft",
        {
          method: "POST",
          body: currentEmail,
        }
      );
    });

    while (true) {
      const feedbackEvent = await step.waitForEvent("user_feedback", {
        type: "user_feedback",
        timeout: "5 minutes",
      });

      // If no feedback within timeout, finish with currentEmail
      if (!feedbackEvent) {
        console.log("No feedback received within timeout; finishing workflow.");
        break;
      }

      const feedback = (feedbackEvent.payload as string).trim();

      // If user says "done", end the loop
      if (feedback.toLowerCase() === "done") {
        console.log("User finished editing.");
        break;
      }

      if (!feedback) {
        console.log("Empty feedback received; skipping revision.");
        continue;
      }

      const revResp = await step.do("revise email", async () => {
        return await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          prompt: `Revise this email: "${currentEmail}" based on this user feedback: "${feedback}"`,
          max_tokens: 2048,
        });
      });

      currentEmail = revResp.response;

      await step.do("sync to storage", async () => {
        const stub = this.env.STATE.get(this.env.STATE.idFromName("global"));
        const timestamp = new Date().toISOString();

        await stub.fetch("http://do/store-latest-draft", {
          method: "POST",
          body: JSON.stringify({
            draft: currentEmail,
            createdAt: timestamp,
          }),
        });
      });

    }

    return { finalEmail: currentEmail };
  }
}