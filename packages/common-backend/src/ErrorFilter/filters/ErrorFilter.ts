import {
  ArgumentsHost,
  ExceptionFilter,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { IErrorResponse } from '@fuks-ru/common';

import { CookieResponseSetter } from 'common-backend/CookieSetter/services/CookieResponseSetter';
import { RedirectError } from 'common-backend/Redirect/dto/RedirectError';
import { SystemError } from 'common-backend/SystemError/dto/SystemError';
import { IErrorFilterModuleOptions } from 'common-backend/ErrorFilter/types/IErrorFilterModuleOptions';
import { CommonErrorCode } from 'common-backend/SystemError/enums/CommonErrorCode';
import { ValidationError } from 'common-backend/Validation/dto/ValidationError';
import { I18nResolver } from 'common-backend/I18n/services/I18nResolver';

@Injectable()
export class ErrorFilter implements ExceptionFilter<Error> {
  private readonly logger = new Logger(ErrorFilter.name);

  private readonly statusResolver: Record<CommonErrorCode, HttpStatus> = {
    [CommonErrorCode.ALREADY_AUTH]: HttpStatus.BAD_REQUEST,
    [CommonErrorCode.CONFIG_NOT_FOUND]: HttpStatus.INTERNAL_SERVER_ERROR,
    [CommonErrorCode.REDIRECT]: HttpStatus.INTERNAL_SERVER_ERROR,
    [CommonErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
    [CommonErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
    [CommonErrorCode.UNKNOWN]: HttpStatus.INTERNAL_SERVER_ERROR,
    [CommonErrorCode.I18N_NOT_INIT]: HttpStatus.INTERNAL_SERVER_ERROR,
  };

  public constructor(
    @Inject('ERROR_MODULE_OPTIONS')
    private readonly options: IErrorFilterModuleOptions,
    private readonly cookieResponseSetter: CookieResponseSetter,
    private readonly i18nResolver: I18nResolver,
  ) {}

  /**
   * Обрабатывает все ошибки приложения.
   */
  public catch(exception: Error, host: ArgumentsHost): void {
    const type = host.getType();

    if (type !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.cookieResponseSetter.set(response);

    if (!request.url.includes('_next')) {
      this.logger.error(exception.message, exception.stack);
    }

    const isApi = request.url.includes(this.options.apiPrefix);

    if (exception instanceof RedirectError && !isApi) {
      response.status(HttpStatus.FOUND).redirect(exception.data.location);

      return;
    }

    const { errorResponse, status } = this.getResponseData(exception);

    response.status(status);

    if (isApi || !this.options.errorPageName) {
      response.json(errorResponse);

      return;
    }

    response.render(this.options.errorPageName, errorResponse);
  }

  private getResponseData(exception: Error): {
    /**
     * Ошибка в response.
     */
    errorResponse: IErrorResponse;
    /**
     * Статус ответа.
     */
    status: HttpStatus;
  } {
    if (exception instanceof SystemError) {
      return {
        errorResponse: this.getSystemErrorResponse(exception),
        status: this.resolveStatus(exception.code),
      };
    }

    if (exception instanceof ValidationError) {
      return {
        errorResponse: {
          type: 'validation',
          data: exception.data as ValidationError['data'],
        },
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      };
    }

    if (exception instanceof NotFoundException) {
      return {
        errorResponse: {
          type: 'not-found',
        },
        status: HttpStatus.NOT_FOUND,
      };
    }

    if (exception instanceof RedirectError) {
      return {
        errorResponse: {
          type: 'redirect',
          data: exception.data,
        },
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    const i18n = this.i18nResolver.resolve();

    return {
      errorResponse: {
        type: 'system',
        message: i18n.t('unknownError'),
      },
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }

  private getSystemErrorResponse(exception: SystemError): IErrorResponse {
    if (exception.code === CommonErrorCode.FORBIDDEN) {
      return {
        type: 'forbidden',
      };
    }

    if (exception.code === CommonErrorCode.UNAUTHORIZED) {
      return {
        type: 'unauthorized',
      };
    }

    if (exception.code === CommonErrorCode.ALREADY_AUTH) {
      return {
        type: 'already-auth',
      };
    }

    return {
      type: 'system',
      message: exception.message,
    };
  }

  private resolveStatus(code: number | string): HttpStatus {
    const mergedResolver: { [key: string]: HttpStatus } = {
      ...this.statusResolver,
      ...this.options.statusResolver,
    };

    return mergedResolver[code] || HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
