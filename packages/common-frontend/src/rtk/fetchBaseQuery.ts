import {
  FetchArgs,
  fetchBaseQuery as defaultFetchBaseQuery,
  FetchBaseQueryArgs,
} from '@reduxjs/toolkit/dist/query/fetchBaseQuery';
import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { CommonErrorCode, IErrorResponse } from '@fuks-ru/common';

const isErrorResponse = (data: unknown): data is IErrorResponse =>
  typeof data === 'object' && data !== null && 'code' in data;

interface IParams extends FetchBaseQueryArgs {

}

export const fetchBaseQuery = (
  fetchArgs: FetchBaseQueryArgs,
): BaseQueryFn<string | FetchArgs> => {
  const baseQuery = defaultFetchBaseQuery(fetchArgs);

  return async (args, api, extraOptions) => {
    const { error, data } = await baseQuery(args, api, extraOptions);

    if (!error) {
      return { data };
    }

    if (typeof error.status === 'number' && isErrorResponse(error.data)) {
      if (error.data.code === CommonErrorCode.FORBIDDEN) {

      }

      return { error };
    }

    return { data };
  };
};
