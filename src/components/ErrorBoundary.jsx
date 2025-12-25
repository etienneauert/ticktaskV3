import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#1a1a1a",
            color: "#ff6b6b",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          <h1>Something went wrong.</h1>
          <p style={{ maxWidth: "600px", margin: "20px 0" }}>
            {this.state.error && this.state.error.toString()}
          </p>
          <details style={{ whiteSpace: "pre-wrap", textAlign: "left" }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px",
                backgroundColor: "#d5ff05",
                color: "black",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Reload App
            </button>

            <button
              onClick={async () => {
                try {
                  console.log("Perfoming hard reset...");
                  localStorage.clear();
                  if (window.indexedDB && window.indexedDB.databases) {
                    const dbs = await window.indexedDB.databases();
                    dbs.forEach((db) => {
                      window.indexedDB.deleteDatabase(db.name);
                    });
                  }
                  // Force reload ignoring cache
                  window.location.reload(true);
                } catch (e) {
                  console.error("Hard reset failed", e);
                  window.location.reload();
                }
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#ff3333",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Fix Crash (Reset Data)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
