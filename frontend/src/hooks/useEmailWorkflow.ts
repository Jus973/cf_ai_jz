import { useEffect, useRef, useState } from "react";

export type WorkflowStatus =
  | "Idle"
  | "queued"
  | "running"
  | "waiting-for-event"
  | "complete"
  | "errored"
  | "terminated";

export function useEmailWorkflow() {
  const [resumeText, setResumeText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<WorkflowStatus>("Idle");
  const [result, setResult] = useState("");
  const [historyEntries, setHistoryEntries] = useState<[string, any][]>([]);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  const pollingIntervalRef = useRef<number | null>(null);

  const startWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult("Starting workflow...");
    setStatus("queued");

    const res = await fetch("/start", {
      method: "POST",
      body: JSON.stringify({ resumeText, jobUrl })
    });

    const data = await res.json();
    setWorkflowId(data.workflowId);
    poll(data.workflowId);
  };

  const poll = (id: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = window.setInterval(async () => {
      try {
        const sRes = await fetch(`/status?workflowId=${id}`);
        const sData = await sRes.json();
        setStatus(sData.status);

        if (sData.status !== "queued") {
          const dRes = await fetch("/get-latest-draft");
          const text = await dRes.text();
          if (text && text !== "No draft found") setResult(text);
        }

        if (
          sData.status === "complete" ||
          sData.status === "errored" ||
          sData.status === "terminated"
        ) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          loadHistory();
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  };

  const sendFeedback = async () => {
    if (!workflowId) {
      alert("Start a generation first!");
      return;
    }

    await fetch("/feedback", {
      method: "POST",
      body: JSON.stringify({ workflowId, feedback })
    });

    setFeedback("");
    setStatus("waiting-for-event");
  };

  const loadHistory = async () => {
    try {
      const res = await fetch("/list-drafts");
      if (!res.ok) return;

      const historyData = await res.json();
      const entries = Object.entries(historyData).reverse() as [string, any][];
      setHistoryEntries(entries);
    } catch (err) {
      console.error("History load error:", err);
    }
  };

  useEffect(() => {
    loadHistory();
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    resumeText,
    setResumeText,
    jobUrl,
    setJobUrl,
    feedback,
    setFeedback,
    status,
    result,
    historyEntries,
    startWorkflow,
    sendFeedback,
    setResult
  };
}
