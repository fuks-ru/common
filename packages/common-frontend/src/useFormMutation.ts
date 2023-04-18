import {
  MutationTrigger,
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

export const useFormMutation = <
  Result,
  D extends MutationDefinition<
    any,
    BaseQueryFn<any, any, IErrorResponse>,
    any,
    Result
  >,
  R extends MutationResultSelectorResult<D>,
>(
  hook: UseMutation<D>,
  options?: UseMutationStateOptions<D, R>,
): readonly [
  MutationTrigger<D>,
  UseMutationStateResult<D, R> & {
    form: FormInstance<QueryArgFrom<D>>;
  },
] => {
  const [trigger, data] = hook(options);
  const [form] = Form.useForm<QueryArgFrom<D>>();
  const { error } = data;
  const lastBody = useRef<QueryArgFrom<D> | null>(null);

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

  const onFinish: MutationTrigger<D> = (arg) => {
    lastBody.current = arg;

    return trigger(arg);
  };

  return [
    onFinish,
    { ...data, form } as unknown as UseMutationStateResult<D, R> & {
      form: FormInstance<QueryArgFrom<D>>;
    },
  ];
};
