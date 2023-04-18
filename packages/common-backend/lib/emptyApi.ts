import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface Config {
  baseUrl: string
}

const defaultConfig: Config = {
  baseUrl: '/',
}

export const emptyApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: defaultConfig.baseUrl }),
  endpoints: () => ({}),
})

export const initApi = (config: Config) => {
  defaultConfig.baseUrl = config.baseUrl;
}
