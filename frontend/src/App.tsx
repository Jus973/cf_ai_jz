import { EmailForm } from "./components/EmailForm";
import { HistoryList } from "./components/HistoryList";
import { LiveDraft } from "./components/LiveDraft";
import { useEmailWorkflow } from "./hooks/useEmailWorkflow";

function App() {
  const {
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
    setResult, 
  } = useEmailWorkflow();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F0E2CF",
        color: "#5B4636",
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        padding: "2rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr", // left: main, right: history
          gap: "24px",
          width: "100%",
          maxWidth: "1200px",
        }}
      >
        {/* LEFT: title + form + live draft */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ margin: 0 }}>AI Email Generator</h2>

          <EmailForm
            resumeText={resumeText}
            setResumeText={setResumeText}
            jobUrl={jobUrl}
            setJobUrl={setJobUrl}
            onSubmit={startWorkflow}
          />

          <LiveDraft
            status={status}
            result={result}
            feedback={feedback}
            setFeedback={setFeedback}
            onSendFeedback={sendFeedback}
          />
        </div>

        <HistoryList
          historyEntries={historyEntries}
          onSelect={(content) => {
            setResult(content);
          }}
        />
      </div>
    </div>
  );
}

export default App;
