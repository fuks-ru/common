import {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
} from '@nestjs/common';

/**
 * Описывает конфиг модуля.
 */
export interface ISwaggerModuleOptions {
  /**
   * Генераторы для openApi.
   */
  generators?: Array<'axios' | 'dart'>;
}

/**
 * Описывает конфиг асинхронный модуля обработки ошибок.
 */
export interface ISwaggerModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Сервисы для DI.
   */
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  /**
   * Функция, возвращающая конфиг.
   */
  useFactory: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<ISwaggerModuleOptions>;
}
