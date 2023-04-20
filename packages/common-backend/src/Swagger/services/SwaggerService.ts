import { INestApplication, Inject, Injectable, Logger } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import path from 'node:path';
import fs from 'node:fs';
import fsa from 'node:fs/promises';
import util from 'node:util';
import childProcess from 'node:child_process';

import { RtkContractGenerator } from 'common-backend/Swagger/services/RtkContractGenerator';
import { DartContractGenerator } from 'common-backend/Swagger/services/DartContractGenerator';
import { ISwaggerModuleOptions } from 'common-backend/Swagger/types/ISwaggerModuleOptions';
import { NestContractGenerator } from 'common-backend/Swagger/services/NestContractGenerator';

const exec = util.promisify(childProcess.exec);

@Injectable()
export class SwaggerService {
  private readonly logger = new Logger(SwaggerService.name);

  private readonly targetPackageRootPath = process.cwd();

  private readonly contractDirCachePath = path.join(
    this.targetPackageRootPath,
    '/node_modules/.cache/generate-api-contract',
  );

  private readonly swaggerSchemaCachePath = path.join(
    this.contractDirCachePath,
    '/swagger-schema.json',
  );

  private readonly buildPath = path.join(
    this.targetPackageRootPath,
    'dist/client',
  );

  private readonly tsFilesPath = path.join(
    this.contractDirCachePath,
    '**/*.ts',
  );

  public constructor(
    private readonly rtkContractGenerator: RtkContractGenerator,
    private readonly dartContractGenerator: DartContractGenerator,
    private readonly nestContractGenerator: NestContractGenerator,
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

    const existsRtk = this.swaggerOptions.generators?.includes('rtk');
    const existsNest = this.swaggerOptions.generators?.includes('nest');

    await Promise.all([
      existsRtk
        ? this.rtkContractGenerator.generateContractLib(
            this.swaggerSchemaCachePath,
            this.swaggerOptions.apiName,
          )
        : Promise.resolve(),
      this.swaggerOptions.generators?.includes('dart')
        ? this.dartContractGenerator.generateContractLib(
            this.swaggerSchemaCachePath,
          )
        : Promise.resolve(),
      existsNest
        ? this.nestContractGenerator.generateContractLib(
            this.swaggerSchemaCachePath,
          )
        : Promise.resolve(),
    ]);

    if (!existsRtk && !existsNest) {
      return;
    }

    const indexFilePath = path.join(this.contractDirCachePath, 'index.ts');

    await fsa.writeFile(indexFilePath, '');

    if (existsNest) {
      await fsa.appendFile(indexFilePath, "export * from './nest'\n");
    }

    if (existsRtk) {
      await fsa.appendFile(indexFilePath, "export * from './rtk'");
    }

    const tscCliPath = path.join(
      path.dirname(require.resolve('typescript/package.json')),
      'bin/tsc',
    );

    await exec(
      `yarn node ${tscCliPath} ${this.tsFilesPath} --noEmitOnError false --noEmit false --skipLibCheck --declaration --experimentalDecorators --outDir ${this.buildPath}`,
    );

    // await fsa.rm(this.contractDirCachePath, { recursive: true });
    this.logger.log('Contracts transpile completed');
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
