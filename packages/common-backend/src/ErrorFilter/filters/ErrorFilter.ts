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
import {
  CommonErrorCode,
  IErrorResponse,
  IRedirectData,
} from '@fuks-ru/common';

import { CookieResponseSetter } from 'common-backend/CookieSetter/services/CookieResponseSetter';
import { RedirectError } from 'common-backend/Redirect/dto/RedirectError';
import { SystemError } from 'common-backend/SystemError/dto/SystemError';
import { IErrorFilterModuleOptions } from 'common-backend/ErrorFilter/types/IErrorFilterModuleOptions';

@Injectable()
export class ErrorFilter implements ExceptionFilter<Error> {
  private readonly logger = new Logger(ErrorFilter.name);

  private readonly statusResolver: Record<CommonErrorCode, HttpStatus> = {
    [CommonErrorCode.ALREADY_AUTH]: HttpStatus.BAD_REQUEST,
    [CommonErrorCode.CONFIG_NOT_FOUND]: HttpStatus.INTERNAL_SERVER_ERROR,
    [CommonErrorCode.REDIRECT]: HttpStatus.INTERNAL_SERVER_ERROR,
    [CommonErrorCode.REMOTE_HOST_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
    [CommonErrorCode.NOT_FOUND_ROUTE]: HttpStatus.NOT_FOUND,
    [CommonErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
    [CommonErrorCode.VALIDATION]: HttpStatus.UNPROCESSABLE_ENTITY,
    [CommonErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
    [CommonErrorCode.UNKNOWN]: HttpStatus.INTERNAL_SERVER_ERROR,
    [CommonErrorCode.I18N_NOT_INIT]: HttpStatus.INTERNAL_SERVER_ERROR,
  };

  public constructor(
    @Inject('ERROR_MODULE_OPTIONS')
    private readonly options: IErrorFilterModuleOptions,
    private readonly cookieResponseSetter: CookieResponseSetter,
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
        errorResponse: this.formatResponse(
          exception.code,
          exception.message,
          exception.data,
        ),
        status: this.resolveStatus(exception.code),
      };
    }

    if (exception instanceof NotFoundException) {
      return {
        errorResponse: this.formatResponse(
          CommonErrorCode.NOT_FOUND_ROUTE,
          exception.message,
        ),
        status: this.resolveStatus(CommonErrorCode.NOT_FOUND_ROUTE),
      };
    }

    if (exception instanceof RedirectError) {
      return {
        errorResponse: this.formatResponse(
          CommonErrorCode.REDIRECT,
          exception.message,
          undefined,
          exception.data,
        ),
        status: this.resolveStatus(CommonErrorCode.REDIRECT),
      };
    }

    return {
      errorResponse: this.formatResponse(
        CommonErrorCode.UNKNOWN,
        exception.message,
      ),
      status: this.resolveStatus(CommonErrorCode.UNKNOWN),
    };
  }

  private resolveStatus(code: number | string): HttpStatus {
    const mergedResolver: { [key: string]: HttpStatus } = {
      ...this.statusResolver,
      ...this.options.statusResolver,
    };

    return mergedResolver[code] || HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private formatResponse<Data>(
    code: number | string,
    message: string,
    data?: Data,
    redirect?: IRedirectData,
  ): IErrorResponse<Data> {
    return {
      code,
      message,
      data,
      redirect,
    };
  }
}
