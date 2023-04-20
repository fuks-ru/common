import { IRedirectData } from 'common/errorResponse/IRedirectData';

export interface IValidationError {
  type: 'validation';
  data: Record<string, string[]>;
}

export interface ISystemError {
  type: 'system';
  message: string;
}

export interface IRedirectError {
  type: 'redirect';
  data: IRedirectData;
}

export interface IForbiddenError {
  type: 'forbidden';
}

export interface IUnauthorizedError {
  type: 'unauthorized';
}

export interface IAlreadyAuthError {
  type: 'already-auth';
}

export interface INotFoundError {
  type: 'not-found';
}

/**
 * HTTP ответ при ошибке.
 */
export type IErrorResponse =
  | IValidationError
  | ISystemError
  | IRedirectError
  | IForbiddenError
  | IUnauthorizedError
  | IAlreadyAuthError
  | INotFoundError;

export const isErrorResponse = (error: unknown): error is IErrorResponse =>
  typeof error === 'object' &&
  error !== null &&
  'data' in error &&
  typeof error.data === 'object' &&
  error.data !== null &&
  'type' in error.data &&
  typeof (error.data as { type: unknown }).type === 'string';
