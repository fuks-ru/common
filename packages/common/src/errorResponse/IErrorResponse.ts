import { IRedirectData } from './IRedirectData';

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
