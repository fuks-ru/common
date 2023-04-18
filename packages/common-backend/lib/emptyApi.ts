import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { BaseQueryApi, BaseQueryFn, FetchArgs } from '@reduxjs/toolkit/query';
import { IErrorResponse } from '@fuks-ru/common';
import { MaybePromise } from '@reduxjs/toolkit/dist/query/tsHelpers';

interface IConfig {
  reducerPath: string,
  baseUrl: string,
  prepareHeaders?: (headers: Headers, api: Pick<BaseQueryApi, 'getState' | 'extra' | 'endpoint' | 'type' | 'forced'>) => MaybePromise<Headers | void>;
}


const defaultConfig: IConfig = {
  reducerPath: 'queryApi',
  baseUrl: '/',
}

const customBaseQuery = (): BaseQueryFn<string | FetchArgs,
  unknown,
  IErrorResponse> => {
  return async (args, api, extraOptions) => {
    const baseQuery = fetchBaseQuery({ baseUrl: defaultConfig.baseUrl, prepareHeaders: defaultConfig.prepareHeaders });

    const { data, error } = await baseQuery(args, api, extraOptions);

    if (data) {
      return { data }
    }

    if (!error) {
      return { data };
    }

    if (typeof error.status === 'number') {
      return { error: error.data as IErrorResponse }
    }

    return { error: { type: 'system', message: 'Unknown error' } }
  }
}

export let emptyApi = createApi({
  reducerPath: defaultConfig.reducerPath,
  baseQuery: customBaseQuery(),
  endpoints: () => ({}),
})

export const initApi = (config: Partial<IConfig>) => {
  defaultConfig.baseUrl = config.baseUrl ?? defaultConfig.baseUrl;
  defaultConfig.prepareHeaders = config.prepareHeaders ?? defaultConfig.prepareHeaders;
}
