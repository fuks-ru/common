import type { AxiosError } from 'axios';

import { ValidationError } from 'common/apiErrors/ValidationError';
import { SystemError } from 'common/apiErrors/SystemError';
import { ForbiddenError } from 'common/apiErrors/ForbiddenError';
import { RedirectError } from 'common/apiErrors/RedirectError';
import { IErrorResponse } from 'common/errorResponse/IErrorResponse';
import { CommonErrorCode } from 'common/errorResponse/CommonErrorCode';
import { IRedirectData } from 'common/errorResponse/IRedirectData';
import { UnauthorizedError } from 'common/apiErrors/UnauthorizedError';
import { AlreadyAuthError } from 'common/apiErrors/AlreadyAuthError';

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

    throw new RedirectError(data);
  }

  if (response.data.code === CommonErrorCode.FORBIDDEN) {
    throw new ForbiddenError(response.data.message);
  }

  if (response.data.code === CommonErrorCode.UNAUTHORIZED) {
    throw new UnauthorizedError(response.data.message);
  }

  if (response.data.code === CommonErrorCode.ALREADY_AUTH) {
    throw new AlreadyAuthError(response.data.message);
  }

  throw new SystemError(response.data.message);
};
