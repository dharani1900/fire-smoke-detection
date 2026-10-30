import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
            <div className="inline-flex bg-red-600/20 p-4 rounded-2xl text-red-500 mb-4 border border-red-500/30">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Safety Console Notice</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              An unexpected application state occurred during rendering. Click below to reset local state and launch the console.
            </p>
            {this.state.error && (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-left mb-6 overflow-x-auto text-[11px] font-mono text-red-400">
                {this.state.error.message || 'Unknown render error'}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Console</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
