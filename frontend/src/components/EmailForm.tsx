type Props = {
  resumeText: string;
  setResumeText: (v: string) => void;
  jobUrl: string;
  setJobUrl: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function EmailForm({
  resumeText,
  setResumeText,
  jobUrl,
  setJobUrl,
  onSubmit,
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: "#F5E6D3",    
        padding: "1.5rem",
        borderRadius: "12px",
        border: "1px solid #E0C8A8",
        boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
      }}
    >
      <label>
        <b>Resume Text</b>
      </label>
      <textarea
        placeholder="Paste Resume here..."
        required
        rows={6}
        style={{
          width: "100%",
          margin: "10px 0",
          border: "1px solid #D3B58F",
          borderRadius: "8px",
          padding: "10px",
          background: "#FBF4EC",
          color: "#5B4636",
        }}
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
      />

      <label>
        <b>Target Job URL</b>
      </label>
      <input
        placeholder="https://linkedin.com/jobs/..."
        required
        style={{
          width: "100%",
          margin: "10px 0",
          border: "1px solid #D3B58F",
          borderRadius: "8px",
          padding: "10px",
          background: "#FBF4EC",
          color: "#5B4636",
        }}
        value={jobUrl}
        onChange={(e) => setJobUrl(e.target.value)}
      />

      <button
        type="submit"
        style={{
          background: "#D9A25F",
          color: "#FFF8F0",
          border: "none",
          padding: "10px 20px",
          borderRadius: "999px",
          cursor: "pointer",
          fontWeight: "bold",
          marginTop: "8px",
        }}
      >
        Generate Draft
      </button>
    </form>
  );
}
