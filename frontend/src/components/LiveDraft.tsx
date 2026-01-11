import type { WorkflowStatus } from "../hooks/useEmailWorkflow";

type LiveDraftProps = {
  status: WorkflowStatus;
  result: string;
  feedback: string;
  setFeedback: (v: string) => void;
  onSendFeedback: () => void;
};

export function LiveDraft({
  status,
  result,
  feedback,
  setFeedback,
  onSendFeedback,
}: LiveDraftProps) {
  return (
    <div
      style={{
        marginTop: "20px",
        background: "#F5E6D3",
        padding: "1.5rem",
        borderRadius: "12px",
        border: "1px solid #E0C8A8",
        boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, color: "#5B4636" }}>Live Draft</h3>
        <span
          style={{
            padding: "4px 12px",
            borderRadius: "999px",
            fontSize: "0.8rem",
            background: "#EAD5BC",
            color: "#5B4636",
          }}
        >
          {status}
        </span>
      </div>

      <pre
        style={{
          background: "#FBF4EC",
          padding: "1rem",
          whiteSpace: "pre-wrap",
          minHeight: "250px",
          border: "1px solid #E7D4BE",
          marginTop: "15px",
          fontFamily: "inherit",
          color: "#5B4636",
        }}
      >
        {result}
      </pre>

      <div style={{ marginTop: "15px" }}>
        <label>
          <b>Refine with Feedback</b>
        </label>
        <textarea
          rows={3}
          style={{
            width: "100%",
            marginTop: "5px",
            border: "1px solid #D3B58F",
            borderRadius: "8px",
            padding: "10px",
            background: "#FBF4EC",
            color: "#5B4636",
          }}
          placeholder="e.g. Make it more professional..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
        <button
          type="button"
          onClick={onSendFeedback}
          style={{
            marginTop: "10px",
            background: "#D9A25F",
            color: "#FFF8F0",
            border: "none",
            padding: "8px 15px",
            borderRadius: "999px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Update Draft
        </button>
      </div>
    </div>
  );
}
