import React from 'react';
import { Link } from 'react-router-dom';

type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // TODO: send this to telemetry / logging
    // console.error('ErrorBoundary caught', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-lg text-center bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-600 mb-4">An unexpected error occurred while rendering this page.</p>
            <div className="flex gap-2 justify-center">
              <button className="px-4 py-2 rounded bg-slate-100" onClick={() => window.location.reload()}>
                Reload
              </button>
              <Link to="/" className="px-4 py-2 rounded bg-primary text-white">
                Go home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children as any;
  }
}
