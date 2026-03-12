import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#fff', background: '#1a1a1f', minHeight: '100vh' }}>
          <h1 style={{ color: '#d4a574', marginBottom: '1rem' }}>Something went wrong</h1>
          <pre style={{ color: '#f87171', whiteSpace: 'pre-wrap', fontSize: '14px' }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ color: '#9ca3af', whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '1rem' }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#d4a574', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Go Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
