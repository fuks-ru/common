/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  UseMutation,
  UseMutationStateOptions,
  UseMutationStateResult,
} from '@reduxjs/toolkit/dist/query/react/buildHooks';
import { BaseQueryFn, MutationDefinition } from '@reduxjs/toolkit/query';
import { IErrorResponse } from '@fuks-ru/common';
import { MutationResultSelectorResult } from '@reduxjs/toolkit/dist/query/core/buildSelectors';
import { Form, FormInstance } from 'antd';
import { QueryArgFrom } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { useEffect, useRef } from 'react';
import { MutationActionCreatorResult } from '@reduxjs/toolkit/dist/query/core/buildInitiate';

export const useFormMutation = <
  Result,
  D extends MutationDefinition<
    any,
    BaseQueryFn<any, any, IErrorResponse>,
    any,
    Result
  >,
  BodyKey extends keyof QueryArgFrom<D>,
  R extends MutationResultSelectorResult<D> = MutationResultSelectorResult<D>,
>(
  hook: UseMutation<D>,
  options?: UseMutationStateOptions<D, R> & {
    bodyKey: BodyKey;
  },
): readonly [
  (
    body: BodyKey extends keyof QueryArgFrom<D>
      ? QueryArgFrom<D>[BodyKey]
      : QueryArgFrom<D>,
    additionalData?: Omit<QueryArgFrom<D>, BodyKey>,
  ) => MutationActionCreatorResult<D>,
  UseMutationStateResult<D, R> & {
    form: FormInstance<QueryArgFrom<D>>;
  },
] => {
  const [trigger, data] = hook(options);
  const [form] = Form.useForm<QueryArgFrom<D>>();
  const { error } = data;
  const lastBody = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!error) {
      return;
    }

    form.setFields(
      Object.keys(lastBody.current || {}).map((name) => ({
        name,
        errors: undefined,
      })),
    );

    if ('type' in error && error.type === 'validation') {
      form.setFields(
        Object.entries(error.data).map(([name, errors]) => ({ name, errors })),
      );
    }
  }, [error, form]);

  const onFinish = (
    arg: BodyKey extends keyof QueryArgFrom<D>
      ? QueryArgFrom<D>[BodyKey]
      : QueryArgFrom<D>,
    additionalData?: Omit<QueryArgFrom<D>, BodyKey>,
  ): MutationActionCreatorResult<D> => {
    const body = options?.bodyKey ? { [options.bodyKey]: arg } : arg;

    lastBody.current = body;

    return trigger({ ...body, ...additionalData } as QueryArgFrom<D>);
  };

  return [
    onFinish,
    { ...data, form } as unknown as UseMutationStateResult<D, R> & {
      form: FormInstance<QueryArgFrom<D>>;
    },
  ];
};

/* eslint-enable */
