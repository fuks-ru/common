import childProcess from 'node:child_process';
import path from 'node:path';
import util from 'node:util';
import { Injectable, Logger } from '@nestjs/common';
import fsa from 'node:fs/promises';
import fs from 'node:fs';

const exec = util.promisify(childProcess.exec);

@Injectable()
export class NestContractGenerator {
  private readonly logger = new Logger(NestContractGenerator.name);

  private readonly targetPackageRootPath = process.cwd();

  private readonly contractDirCachePath = path.join(
    this.targetPackageRootPath,
    '/node_modules/.cache/generate-api-contract/nest',
  );

  /**
   * Генерация файлов контракта.
   */
  public async generateContractLib(
    swaggerSchemaCachePath: string,
  ): Promise<void> {
    await this.createCachePathIfNotExist();

    const openApiCliPath = path.join(
      path.dirname(
        require.resolve('@openapitools/openapi-generator-cli/package.json'),
      ),
      'main.js',
    );

    const tscCliPath = path.join(
      path.dirname(require.resolve('typescript/package.json')),
      'bin/tsc',
    );

    await exec(
      `yarn node ${openApiCliPath} generate -i ${swaggerSchemaCachePath} -g typescript-nestjs -o ${this.contractDirCachePath}`,
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
