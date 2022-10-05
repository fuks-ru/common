import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import requestContext from 'request-context';

import {
  REQUEST_CONTEXT_ID,
  REQUEST_ID_KEY,
  REQUEST_SESSION_ID_KEY,
} from 'common-backend/Logger/utils/constants';
import { ILoggerMessage } from 'common-backend/Logger/types/ILoggerMessage';
import {
  isPlainObject,
  isString,
} from 'common-backend/Logger/utils/typeGuards';
import { LoggerLevel } from 'common-backend/Logger/enums/LoggerLevel';

/**
 * Контекст запроса.
 */
interface IRequestContext {
  /**
   * Id запроса.
   */
  [REQUEST_ID_KEY]: string;
  /**
   * Id сессии.
   */
  [REQUEST_SESSION_ID_KEY]: string;
}

/**
 * @see https://github.com/nestjs/nest/blob/master/packages/common/services/console-logger.service.ts
 */
@Injectable()
export class Logger implements LoggerService {
  public constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winstonLogger: WinstonLogger,
  ) {}

  /**
   * Логи уровня info.
   */
  public log(message: string, ...options: unknown[]): void {
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...options,
    ]);

    this.printMessages(messages, context, LoggerLevel.INFO);
  }

  /**
   * Логи уровня error.
   */
  public error(message: unknown, ...options: unknown[]): void {
    const { messages, context, stack } =
      this.getContextAndStackAndMessagesToPrint([message, ...options]);

    this.printMessages(messages, context, LoggerLevel.ERROR);

    if (stack) {
      this.printMessages(messages, context, LoggerLevel.ERROR);
    }
  }

  /**
   * Логи уровня warning.
   */
  public warn(message: string, ...options: unknown[]): void {
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...options,
    ]);

    this.printMessages(messages, context, LoggerLevel.WARNING);
  }

  /**
   * Логи уровня debug.
   */
  public debug(message: string, ...options: unknown[]): void {
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...options,
    ]);

    this.printMessages(messages, context, LoggerLevel.DEBUG);
  }

  /**
   * Логи уровня verbose.
   */
  public verbose(message: string, ...options: unknown[]): void {
    const { messages, context } = this.getContextAndMessagesToPrint([
      message,
      ...options,
    ]);

    this.printMessages(messages, context, LoggerLevel.VERBOSE);
  }

  private getContextAndStackAndMessagesToPrint(args: unknown[]) {
    const { messages, context } = this.getContextAndMessagesToPrint(args);

    console.log(args);

    if (messages.length <= 1) {
      return { messages, context };
    }

    const lastElement = messages[messages.length - 1];
    const isStack = isString(lastElement);

    if (!isStack) {
      return { messages, context };
    }

    return {
      stack: lastElement,
      messages: messages.slice(0, -1),
      context,
    };
  }

  private printMessages(
    messages: unknown[],
    context = '',
    logLevel: LoggerLevel = LoggerLevel.INFO,
  ): void {
    const loggerRequestContext = requestContext.get<
      IRequestContext | undefined
    >(REQUEST_CONTEXT_ID);
    const requestId = loggerRequestContext?.[REQUEST_ID_KEY];
    const sessionId = loggerRequestContext?.[REQUEST_SESSION_ID_KEY];

    for (const message of messages) {
      const formattedMessage = this.stringifyMessage(message);

      const loggerMessage: ILoggerMessage = {
        message: formattedMessage,
        context,
        requestId,
        sessionId,
      };

      this.winstonLogger.log(logLevel, loggerMessage);
    }
  }

  private stringifyMessage(message: unknown): string {
    return isPlainObject(message) || Array.isArray(message)
      ? JSON.stringify(message)
      : (message as string);
  }

  private getContextAndMessagesToPrint(args: unknown[]) {
    if (args.length <= 1) {
      return { messages: args, context: '' };
    }

    const lastElement = args[args.length - 1];

    const isContext = isString(lastElement);

    if (!isContext) {
      return { messages: args, context: '' };
    }

    return {
      context: lastElement,
      messages: args.slice(0, -1),
    };
  }
}
