import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { AxiosInstance } from 'axios';
import {
  TApiBody,
  TApiArgs,
  TApiResponse,
  TBaseOperationsMethods,
  ValidationError,
  SystemError,
  ForbiddenError,
  UnauthorizedError,
  RedirectError,
} from '@fuks-ru/common';

/**
 * Ответ в случае ошибки.
 */
export interface IRtkResponseError {
  /**
   * Сообщение.
   */
  message: string;
  /**
   * Ошибки валидации.
   */
  validation?: { [key: string]: string[] };
}

type TBaseQueryFn<
  OperationMethods extends TBaseOperationsMethods<
    keyof Omit<OperationMethods, 'paths' | 'api' | keyof AxiosInstance>
  >,
> = {
  [key in keyof OperationMethods]: BaseQueryFn<
    {
      body: TApiBody<OperationMethods, key>;
      params: TApiArgs<OperationMethods, key>;
      method: key;
    },
    TApiResponse<OperationMethods, key>,
    IRtkResponseError
  >;
}[keyof OperationMethods];

interface IGetBaseQueryOptions<
  OperationMethods extends TBaseOperationsMethods<
    keyof Omit<OperationMethods, 'paths' | 'api' | keyof AxiosInstance>
  >,
> {
  getClient: () => Promise<OperationMethods>;
  onError?: (message?: string) => void;
  onForbidden?: () => void;
}

/**
 * Получает базовую функцию rtk-query.
 */
export const getBaseQuery =
  <
    OperationMethods extends TBaseOperationsMethods<
      keyof Omit<OperationMethods, 'paths' | 'api' | keyof AxiosInstance>
    >,
    BaseQuery extends TBaseQueryFn<OperationMethods>,
  >({
    getClient,
    onError,
    onForbidden,
  }: IGetBaseQueryOptions<OperationMethods>): BaseQuery =>
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async (args) => {
    const client = await getClient();

    const method = client[args.method].bind(client);

    try {
      const response = await method(args.params, args.body);

      return {
        data: response.data,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        if (onError) {
          onError(error.message);
        }

        return {
          error: {
            message: error.message,
            validation: error.data,
          },
        };
      }

      if (error instanceof SystemError) {
        if (onError) {
          onError(error.message);
        }

        return {
          error: {
            message: error.message,
          },
        };
      }

      if (
        error instanceof ForbiddenError ||
        error instanceof UnauthorizedError
      ) {
        if (onForbidden) {
          onForbidden();
        }

        return {
          error: {
            message: error.message,
          },
        };
      }

      if (error instanceof RedirectError) {
        window.location.assign(error.data.location);

        return {
          error: {
            message: error.message,
          },
        };
      }

      if (onError) {
        onError();
      }

      return {
        error: {
          message: 'Unknown error',
        },
      };
    }
  };
