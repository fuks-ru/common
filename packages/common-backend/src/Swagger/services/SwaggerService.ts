import { INestApplication, Inject, Injectable } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import path from 'node:path';
import fs from 'node:fs';

import { RtkContractGenerator } from 'common-backend/Swagger/services/RtkContractGenerator';
import { DartContractGenerator } from 'common-backend/Swagger/services/DartContractGenerator';
import { ISwaggerModuleOptions } from 'common-backend/Swagger/types/ISwaggerModuleOptions';
import fsa from 'node:fs/promises';

@Injectable()
export class SwaggerService {
  private readonly targetPackageRootPath = process.cwd();

  private readonly contractDirCachePath = path.join(
    this.targetPackageRootPath,
    '/node_modules/.cache/generate-api-contract',
  );

  private readonly swaggerSchemaCachePath = path.join(
    this.contractDirCachePath,
    '/swagger-schema.json',
  );

  public constructor(
    private readonly rtkContractGenerator: RtkContractGenerator,
    private readonly dartContractGenerator: DartContractGenerator,
    @Inject('SWAGGER_MODULE_OPTIONS')
    private readonly swaggerOptions: ISwaggerModuleOptions,
  ) {}

  /**
   * Создает документ для Swagger схемы.
   */
  public createDocument(name: string, app: INestApplication): OpenAPIObject {
    const config = new DocumentBuilder()
      .setTitle(name)
      .setVersion('1.0')
      .addServer('/')
      .build();

    return SwaggerModule.createDocument(app, config);
  }

  /**
   * Генерирует api-контракты в файл.
   */
  public async generateApiContract(document: OpenAPIObject): Promise<void> {
    this.createCachePathIfNotExist();
    this.generateSchemaJson(document);

    await Promise.all([
      this.swaggerOptions.generators?.includes('rtk')
        ? this.rtkContractGenerator.generateContractLib(
            this.swaggerSchemaCachePath,
          )
        : Promise.resolve(),
      this.swaggerOptions.generators?.includes('dart')
        ? this.dartContractGenerator.generateContractLib(
            this.swaggerSchemaCachePath,
          )
        : Promise.resolve(),
    ]);

    await fsa.rm(this.contractDirCachePath, { recursive: true });
  }

  /**
   * Создает маршрут для просмотра swagger-схемы в браущере.
   */
  public setupRoute(
    pathName: string,
    app: INestApplication,
    document: OpenAPIObject,
  ): void {
    SwaggerModule.setup(pathName, app, document);
  }

  private generateSchemaJson(document: OpenAPIObject): void {
    fs.writeFileSync(this.swaggerSchemaCachePath, JSON.stringify(document));
  }

  private createCachePathIfNotExist(): void {
    if (fs.existsSync(this.contractDirCachePath)) {
      return;
    }

    fs.mkdirSync(this.contractDirCachePath, { recursive: true });
  }
}
