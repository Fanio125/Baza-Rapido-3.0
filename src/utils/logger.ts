/**
 * Professional logger utility that differentiates between DEV and PROD.
 * Cleans up the console in production to improve performance and security.
 */

import { addAdminNotification } from './adminNotifications';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isDev = process.env.NODE_ENV === 'development';

class Logger {
  private log(level: LogLevel, message: string, data?: any) {
    if (!isDev && level !== 'error') return;

    const timestamp = new Date().toISOString();
    const prefix = `[BazaRápido][${level.toUpperCase()}][${timestamp}]`;

    switch (level) {
      case 'info':
        console.log(`%c${prefix} ${message}`, 'color: #3b82f6', data || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, data || '');
        // Also send warning logs to admin if they are relevant
        if (message.includes('Acesso negado') || message.includes('unauthorized') || message.includes('não autorizado')) {
          addAdminNotification('Segurança', 'Tentativa de acesso não autorizado', message);
        } else {
          addAdminNotification('Sistema', message, data ? JSON.stringify(data) : 'Aviso do sistema');
        }
        break;
      case 'error':
        console.error(`${prefix} ${message}`, data || '');
        // Automatically send errors to admin notifications
        addAdminNotification('Erros', message, data ? JSON.stringify(data) : 'Erro técnico do sistema');
        break;
      case 'debug':
        console.debug(`${prefix} ${message}`, data || '');
        break;
    }
  }

  info(message: string, data?: any) { this.log('info', message, data); }
  warn(message: string, data?: any) { this.log('warn', message, data); }
  error(message: string, data?: any) { this.log('error', message, data); }
  debug(message: string, data?: any) { this.log('debug', message, data); }
}

export const logger = new Logger();

