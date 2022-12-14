import { WinstonModuleOptions } from 'nest-winston';
import { format, transports } from 'winston';
import { Injectable } from '@nestjs/common';
import path from 'node:path';
import Transport from 'winston-transport';

import 'winston-daily-rotate-file';

import { ILoggerModuleOptions } from 'common-backend/Logger/types/ILoggerModuleOptions';
import { ILoggerMessage } from 'common-backend/Logger/types/ILoggerMessage';
import { LoggerLevel } from 'common-backend/Logger/enums/LoggerLevel';

@Injectable()
export class WinstonOptionsFactory {
  private readonly timestampFormat = 'DD.MM.YYYY HH:MM:SS';

  private readonly logErrorFilename = path.join(
    process.cwd(),
    '/var/logs/error-%DATE%.log',
  );

  private readonly logCombineFilename = path.join(
    process.cwd(),
    '/var/logs/combined-%DATE%.log',
  );

  private readonly maxFiles = '14d';

  private readonly logDatePattern = 'DD-MM-YYYY';

  /**
   * Создает транспорты для winston библиотеки.
   */
  public create(
    options: ILoggerModuleOptions | undefined,
  ): WinstonModuleOptions {
    const { colorize } = format.colorize();

    const consoleFormat = format.combine(
      format.timestamp({
        format: this.timestampFormat,
      }),
      format.printf(
        ({
          level = LoggerLevel.INFO,
          message,
          context,
          timestamp,
        }: ILoggerMessage & {
          /**
           * Уровень лога.
           */
          level?: string;
          /**
           * Время.
           */
          timestamp?: string;
        }) => {
          const levelStyled = `[${colorize(level, level.toUpperCase())}]`;
          const contextStyled = context
            ? `[\u001B[36m${context}\u001B[0m]`
            : '';
          const timestampStyled = timestamp ? ` - ${timestamp} - ` : '';
          const messageStyled = colorize(level, message);

          return `${levelStyled}${contextStyled}${timestampStyled}${messageStyled}`;
        },
      ),
    );

    const fileFormat = format.combine(
      format.timestamp({
        format: this.timestampFormat,
      }),
      format.json(),
    );

    const resultTransports: Transport[] = [
      new transports.Console({
        silent: options?.isToConsoleDisable,
        format: consoleFormat,
      }),

      new transports.DailyRotateFile({
        silent: options?.isToFileDisable,
        level: LoggerLevel.ERROR,
        filename: this.logErrorFilename,
        format: fileFormat,
        maxFiles: this.maxFiles,
        datePattern: this.logDatePattern,
      }),

      new transports.DailyRotateFile({
        silent: options?.isToFileDisable,
        level: LoggerLevel.INFO,
        filename: this.logCombineFilename,
        format: fileFormat,
        maxFiles: this.maxFiles,
        datePattern: this.logDatePattern,
      }),
    ];

    return {
      transports: resultTransports,
    };
  }
}
