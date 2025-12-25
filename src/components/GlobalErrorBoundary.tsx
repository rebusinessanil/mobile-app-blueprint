import React, { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * GlobalErrorBoundary
 * Prevents crash loops by rendering a static fallback UI instead of reloading.
 */
export default class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Intentionally minimal to avoid extra work during a crash.
    // eslint-disable-next-line no-console
    console.error("GlobalErrorBoundary caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100svh] bg-background text-foreground flex items-center justify-center p-6">
          <div className="w-full max-w-sm text-center space-y-4">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              The app stopped to prevent an infinite crash/reload loop.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold"
            >
              Reload Manually
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
