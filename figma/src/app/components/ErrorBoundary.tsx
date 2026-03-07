import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FDF8F3",
            padding: "24px",
            fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div
              style={{
                width: 64,
                height: 64,
                margin: "0 auto 24px",
                borderRadius: "50%",
                backgroundColor: "#C4613A1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 32, color: "#C4613A" }}
              >
                error_outline
              </span>
            </div>
            <h1
              style={{
                fontSize: 24,
                color: "#1A1410",
                fontFamily: "var(--font-display, 'Playfair Display', serif)",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: "#57534e", marginBottom: 24, lineHeight: 1.6 }}>
              We encountered an unexpected error. Please try again or return to the home page.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#C4613A",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "white",
                  color: "#1A1410",
                  border: "1px solid #E8DDD4",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV !== "production" && this.state.error && (
              <pre
                style={{
                  marginTop: 24,
                  padding: 16,
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#991b1b",
                  textAlign: "left",
                  overflow: "auto",
                  maxHeight: 200,
                }}
              >
                {this.state.error.message}
                {"\n"}
                {this.state.error.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
