import childProcess from 'node:child_process';
import path from 'node:path';
import util from 'node:util';
import { Injectable, Logger } from '@nestjs/common';
import { generateEndpoints } from '@rtk-query/codegen-openapi';
import fsa from 'node:fs/promises';
import fs from 'node:fs';

const exec = util.promisify(childProcess.exec);

@Injectable()
export class RtkContractGenerator {
  private readonly logger = new Logger(RtkContractGenerator.name);

  private readonly targetPackageRootPath = process.cwd();

  private readonly emptyApiPath = path.join(
    path.join(
      // eslint-disable-next-line unicorn/prefer-module
      require.resolve('@fuks-ru/common-backend'),
      '../emptyApi.ts.dist',
    ),
  );

  private readonly contractDirCachePath = path.join(
    this.targetPackageRootPath,
    '/node_modules/.cache/generate-api-contract/rtk',
  );

  /**
   * Генерация файлов контракта.
   */
  public async generateContractLib(
    swaggerSchemaCachePath: string,
    apiName?: string,
  ): Promise<void> {
    await this.createCachePathIfNotExist();
    const emptyApiFile = await fsa.readFile(this.emptyApiPath, 'utf8');

    await fsa.writeFile(
      path.join(this.contractDirCachePath, 'emptyApi.ts'),
      emptyApiFile.replace('#apiName#', apiName || 'queryApi'),
    );

    const apiFileContent = await generateEndpoints({
      apiFile: './emptyApi.ts',
      apiImport: 'emptyApi',
      schemaFile: swaggerSchemaCachePath,
      hooks: true,
      flattenArg: true,
    });

    await fsa.writeFile(
      path.join(this.contractDirCachePath, 'api.ts'),
      apiFileContent as string,
    );

    await fsa.writeFile(
      path.join(this.contractDirCachePath, 'index.ts'),
      'export * from "./api";\nexport * from "./emptyApi";',
    );

    this.logger.log('Contracts build completed');
  }

  private async createCachePathIfNotExist(): Promise<void> {
    if (fs.existsSync(this.contractDirCachePath)) {
      return;
    }

    await fsa.mkdir(this.contractDirCachePath, { recursive: true });
  }
}
