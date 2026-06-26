import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import * as Sentry from '@sentry/react';

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
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });

    // Reportar a servicio de monitoreo Sentry
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack }
    });
  }

  public handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[100vh] flex items-center justify-center p-[2rem] bg-[linear-gradient(135deg,_#667eea_0%,_#764ba2_100%)] text-[#ffffff]">







          
          <div className="max-w-[600px] text-center bg-[rgba(255,_255,_255,_0.1)] backdrop-filter-[blur(10px)] rounded-[20px] p-[3rem] box-shadow-[0_20px_60px_rgba(0,_0,_0,_0.3)]">







            
            <div className="w-[80px] h-[80px] m-[0_auto_1.5rem] bg-[rgba(239,_68,_68,_0.2)] rounded-[50%] flex items-center justify-center">








              
              <AlertTriangle size={40} color="#ef4444" />
            </div>

            <h1 className="text-[2rem] font-[800] mb-[1rem] m-[0_0_1rem_0]">




              
              Oops! Algo salió mal
            </h1>

            <p className="text-[1rem] line-height-[1.6] mb-[2rem] opacity-[0.9]">




              
              Ha ocurrido un error inesperado. No te preocupes, nuestro equipo ha sido notificado.
            </p>

            {import.meta.env.DEV && this.state.error &&
            <div className="bg-[rgba(0,_0,_0,_0.2)] rounded-[12px] p-[1.5rem] mb-[2rem] text-left text-[0.85rem] font-family-[monospace] max-height-[200px] overflow-[auto]">









              
                <div className="text-[#fca5a5] mb-[0.5rem]">
                  <Bug size={16} className="display-[inline] mr-[0.5rem]" />
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo &&
              <div className="text-[#cbd5e1] mt-[1rem]">
                    {this.state.errorInfo.componentStack}
                  </div>
              }
              </div>
            }

            <div className="flex gap-[1rem] justify-center">
              <button
                onClick={this.handleReset} className="p-[1rem_2rem] bg-[#ffffff] text-[#667eea] border-none rounded-[12px] font-[700] text-[1rem] cursor-pointer flex items-center gap-[0.5rem] transition-[transform_0.2s,_box-shadow_0.2s]">














                
                <RefreshCw size={20} />
                Recargar página
              </button>

              <button
                onClick={() => window.history.back()} className="p-[1rem_2rem] bg-[rgba(255,_255,_255,_0.2)] text-[#ffffff] border-[2px_solid_rgba(255,_255,_255,_0.3)] rounded-[12px] font-[700] text-[1rem] cursor-pointer transition-[background_0.2s]">











                
                Volver atrás
              </button>
            </div>
          </div>
        </div>);

    }

    return this.props.children;
  }
}

export default ErrorBoundary;