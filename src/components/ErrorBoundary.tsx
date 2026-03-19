import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });

    // Reportar a servicio de monitoreo (ej: Sentry)
    // if (typeof window.Sentry !== 'undefined') {
    //   window.Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    // }
  }

  public handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff'
        }}>
          <div style={{
            maxWidth: '600px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '3rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1.5rem',
              background: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={40} color="#ef4444" />
            </div>

            <h1 style={{
              fontSize: '2rem',
              fontWeight: '800',
              marginBottom: '1rem',
              margin: '0 0 1rem 0'
            }}>
              Oops! Algo salió mal
            </h1>

            <p style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              marginBottom: '2rem',
              opacity: 0.9
            }}>
              Ha ocurrido un error inesperado. No te preocupes, nuestro equipo ha sido notificado.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                textAlign: 'left',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <div style={{ color: '#fca5a5', marginBottom: '0.5rem' }}>
                  <Bug size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <div style={{ color: '#cbd5e1', marginTop: '1rem' }}>
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '1rem 2rem',
                  background: '#ffffff',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <RefreshCw size={20} />
                Recargar página
              </button>

              <button
                onClick={() => window.history.back()}
                style={{
                  padding: '1rem 2rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Volver atrás
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
