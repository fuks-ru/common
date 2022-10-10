import {
  OperationResponse,
  AxiosInstance,
  Parameters,
} from 'openapi-client-axios';
import { AxiosRequestConfig } from 'axios';

/**
 * Описывает базовый метод для работы с api.
 */
export type TBaseOperationsMethod = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any,
  config?: AxiosRequestConfig,
) => OperationResponse<unknown>;

/**
 * Описывает набор базовых методов для работы с api.
 */
export type TBaseOperationsMethods<Method extends string | number | symbol> = {
  [key in Method]: TBaseOperationsMethod;
};

/**
 * Описания типа тела запроса.
 */
export type TApiBody<
  OperationMethods extends TBaseOperationsMethods<
    keyof Omit<OperationMethods, 'paths' | 'api' | keyof AxiosInstance>
  >,
  Method extends keyof OperationMethods,
> = OperationMethods[Method] extends (...args: infer Args) => unknown
  ? Exclude<Args[1], undefined>
  : never;

/**
 * Описания типа возвращаемого с бэка значения.
 */
export type TApiResponse<
  OperationMethods extends TBaseOperationsMethods<
    keyof Omit<OperationMethods, 'paths' | 'api' | keyof AxiosInstance>
  >,
  Method extends keyof OperationMethods,
> = ReturnType<OperationMethods[Method]> extends OperationResponse<
  infer Response
>
  ? Response
  : never;

/**
 * Описания типа аргументов url'а запроса.
 */
export type TApiArgs<
  OperationMethods extends TBaseOperationsMethods<
    keyof Omit<OperationMethods, 'paths' | 'api' | keyof AxiosInstance>
  >,
  Method extends keyof OperationMethods,
> = OperationMethods[Method] extends (...args: infer Args) => unknown
  ? Exclude<Args[0], undefined | null> extends Parameters<infer Params>
    ? Params
    : never
  : never;
