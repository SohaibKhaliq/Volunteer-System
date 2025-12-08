import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: send this to telemetry / logging
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-lg w-full text-center space-y-6">
            {/* Error icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden="true" />
              </div>
            </div>

            {/* Error message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
              <p className="text-muted-foreground">
                An unexpected error occurred while rendering this page. This has been logged and we'll look into it.
              </p>
            </div>

            {/* Error details (dev mode only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer font-medium text-sm mb-2">Error details</summary>
                <pre className="text-xs overflow-auto max-h-48 text-destructive">{this.state.error.toString()}</pre>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium transition-colors"
                onClick={() => window.location.reload()}
                aria-label="Reload the page"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Reload Page
              </button>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
                aria-label="Go to homepage"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Go Home
              </Link>
            </div>

            {/* Help text */}
            <p className="text-xs text-muted-foreground">
              If this problem persists, please{' '}
              <Link to="/contact" className="text-primary hover:underline">
                contact support
              </Link>
              .
            </p>
          </div>
        </div>
      );
    }

    return this.props.children as any;
  }
}
