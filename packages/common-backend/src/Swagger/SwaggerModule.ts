import { DynamicModule, Global, Module } from '@nestjs/common';

import { SwaggerService } from 'common-backend/Swagger/services/SwaggerService';
import { AxiosContractGenerator } from 'common-backend/Swagger/services/AxiosContractGenerator';
import {
  ISwaggerModuleAsyncOptions,
  ISwaggerModuleOptions,
} from 'common-backend/Swagger/types/ISwaggerModuleOptions';
import { DartContractGenerator } from 'common-backend/Swagger/services/DartContractGenerator';

@Global()
@Module({})
export class SwaggerModule {
  /**
   * Регистрирует модуль.
   */
  public static forRoot(options: ISwaggerModuleOptions): DynamicModule {
    return {
      module: SwaggerModule,
      global: true,
      providers: [
        SwaggerService,
        AxiosContractGenerator,
        DartContractGenerator,
        {
          provide: 'SWAGGER_MODULE_OPTIONS',
          useValue: options,
        },
      ],
    };
  }

  /**
   * Регистрирует модуль асинхронно.
   */
  public static forRootAsync(
    options: ISwaggerModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: SwaggerModule,
      imports: options.imports,
      providers: [
        SwaggerService,
        AxiosContractGenerator,
        DartContractGenerator,
        {
          provide: 'SWAGGER_MODULE_OPTIONS',
          inject: options.inject,
          useFactory: options.useFactory,
        },
      ],
    };
  }
}
