/**
 * Сообщения логгера.
 */
export interface ILoggerMessage {
  /**
   * Id запроса.
   */
  requestId?: string;
  /**
   * Id сессии.
   */
  sessionId?: string;
  /**
   * Текст сообщения.
   */
  message: string;
  /**
   * Контекст запроса.
   */
  context?: string;
}
