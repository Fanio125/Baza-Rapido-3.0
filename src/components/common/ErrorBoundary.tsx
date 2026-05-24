import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught error in ErrorBoundary:', { error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center animate-bounce">
            <AlertTriangle size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black font-display tracking-tight text-gray-900">Eita! Algo deu errado.</h1>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Ocorreu um erro técnico inesperado. Por favor, tenta recarregar ou voltar ao início.
            </p>
          </div>
          
          <div className="flex flex-col w-full gap-3 pt-4">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full bg-primary text-white"
            >
              <RefreshCw size={20} />
              <span>Tentar Novamente</span>
            </button>
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 p-4 text-gray-500 font-bold text-sm bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all"
            >
              <Home size={18} />
              <span>Ir para o Início</span>
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
             <pre className="mt-8 p-4 bg-gray-900 text-red-400 text-[10px] text-left rounded-xl w-full overflow-auto max-h-40">
               {this.state.error?.stack}
             </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
