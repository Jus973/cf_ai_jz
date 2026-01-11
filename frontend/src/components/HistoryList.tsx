type HistoryProps = {
  historyEntries: [string, any][];
  onSelect: (content: string) => void;
};

export function HistoryList({ historyEntries, onSelect }: HistoryProps) {
  return (
    <div
      style={{
        background: "#F5E6D3",
        padding: "1.5rem",
        borderRadius: "12px",
        border: "1px solid #E0C8A8",
        maxHeight: "80vh",
        overflowY: "auto",
        boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#5B4636" }}>Past Drafts</h3>
      <div>
        {Array.isArray(historyEntries) && historyEntries.length === 0 ? (
          <p style={{ color: "#9A7C5C" }}>No drafts saved yet.</p>
        ) : (
          Array.isArray(historyEntries) &&
          historyEntries.map(([key, rawValue]) => {
            const value = rawValue ?? "";
            const content =
              typeof value === "object" && value !== null && "draft" in value
                ? String((value as any).draft ?? "")
                : String(value ?? "");

            const safeContent = content ?? "";
            const snippet =
              safeContent.length > 60
                ? safeContent.substring(0, 60) + "..."
                : safeContent;

            return (
              <div
                key={key}
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #E7D4BE",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
                onClick={() => onSelect(safeContent)}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    color: "#C07A3F",
                  }}
                >
                  {key.replace("draft:", "")}
                </div>
                <div
                  style={{
                    color: "#7B5E45",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {snippet}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
