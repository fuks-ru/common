/* eslint-disable jsdoc/require-jsdoc */
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
    const colorizer = format.colorize();

    const consoleFormat = format.combine(
      format((info) => {
        // eslint-disable-next-line no-param-reassign
        info.level = info.level.toUpperCase();

        return info;
      })(),
      format.timestamp({
        format: this.timestampFormat,
      }),
      format.colorize({
        all: true,
      }),
      format.printf(
        ({
          level,
          message,
          context,
          timestamp,
        }: ILoggerMessage & {
          level?: string;
          timestamp?: string;
        }) => {
          console.log(level);

          return `${colorizer.colorize(
            LoggerLevel.INFO,
            timestamp as string,
          )} [${level as string}][${context as string}]: ${message}`;
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
