import type { AxiosError } from 'axios';

import { ValidationError } from 'common/apiErrors/ValidationError';
import { SystemError } from 'common/apiErrors/SystemError';
import { UnauthorizedError } from 'common/apiErrors/UnauthorizedError';
import { RedirectError } from 'common/apiErrors/RedirectError';
import { IErrorResponse } from 'common/errorResponse/IErrorResponse';
import { CommonErrorCode } from 'common/errorResponse/CommonErrorCode';
import { IRedirectData } from 'common/errorResponse/IRedirectData';

/**
 * Добавляет интерцептор для работы с api.
 */
export const errorInterceptor = (error: AxiosError<IErrorResponse>): void => {
  const { response } = error;

  if (!response) {
    throw new SystemError('Empty response from Backend.');
  }

  if (response.data.code === CommonErrorCode.VALIDATION) {
    const data = response.data.data as Record<string, string[]>;

    throw new ValidationError(data, response.data.message);
  }

  if (response.data.code === CommonErrorCode.REDIRECT) {
    const data = response.data.redirect as IRedirectData;

    window.location.assign(data.location);

    throw new RedirectError();
  }

  if (response.data.code === CommonErrorCode.UNAUTHORIZED) {
    throw new UnauthorizedError();
  }

  throw new SystemError(response.data.message);
};
