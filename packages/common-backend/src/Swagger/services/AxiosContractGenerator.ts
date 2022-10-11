import fs from 'node:fs';
import childProcess from 'node:child_process';
import path from 'node:path';
import { rollup } from 'rollup';
import typescript from 'rollup-plugin-typescript2';
import ttypescript from 'ttypescript';
import json from '@rollup/plugin-json';
import util from 'node:util';
import { Injectable, Logger } from '@nestjs/common';

const exec = util.promisify(childProcess.exec);

@Injectable()
export class AxiosContractGenerator {
  private readonly logger = new Logger(AxiosContractGenerator.name);

  private readonly targetPackageRootPath = process.cwd();

  private readonly contractDirCachePath = path.join(
    this.targetPackageRootPath,
    '/node_modules/.cache/generate-api-contract/lib/axios',
  );

  private readonly clientTsCachePath = path.join(
    this.contractDirCachePath,
    '/client.ts',
  );

  private readonly axiosSwaggerSchemaCachePath = path.join(
    this.contractDirCachePath,
    '/swagger-schema.json',
  );

  private readonly libOutPath = path.join(
    this.targetPackageRootPath,
    '/dist/client/axios',
  );

  private readonly commonPackageRootPath = path.join(
    // eslint-disable-next-line unicorn/prefer-module
    require.resolve('@fuks-ru/common-backend'),
  );

  private readonly indexTsDistPath = path.join(
    this.commonPackageRootPath,
    '../openApi.ts.dist',
  );

  private readonly indexTsCachePath = path.join(
    this.contractDirCachePath,
    '/index.ts',
  );

  /**
   * Генерация файлов контракта.
   */
  public async generateContractLib(
    swaggerSchemaCachePath: string,
  ): Promise<void> {
    this.createCachePathIfNotExist();

    fs.copyFileSync(swaggerSchemaCachePath, this.axiosSwaggerSchemaCachePath);

    await this.generateClientTs();

    fs.copyFileSync(this.indexTsDistPath, this.indexTsCachePath);

    await this.rollupBundle();

    this.logger.log('Contracts build completed');
  }

  private createCachePathIfNotExist(): void {
    if (fs.existsSync(this.contractDirCachePath)) {
      return;
    }

    fs.mkdirSync(this.contractDirCachePath, { recursive: true });
  }

  private async generateClientTs(): Promise<void> {
    await exec(
      `yarn typegen ${this.axiosSwaggerSchemaCachePath} > ${this.clientTsCachePath} && echo "const defaultBaseUrl = '/';\\nexport { defaultBaseUrl, Components, Paths };" >> ${this.clientTsCachePath}`,
    );
  }

  private async rollupBundle(): Promise<void> {
    const build = await rollup({
      input: this.indexTsCachePath,
      output: {
        format: 'cjs',
        dir: this.libOutPath,
        preserveModules: true,
      },
      plugins: [
        typescript({
          typescript: ttypescript,
          tsconfigOverride: {
            compilerOptions: {
              outDir: this.libOutPath,
              declaration: true,
              declarationDir: this.libOutPath,
              baseUrl: this.contractDirCachePath,
              resolveJsonModule: true,
              module: 'ESNext',
              allowSyntheticDefaultImports: true,
            },
            include: [this.indexTsCachePath],
          },
        }),
        json(),
      ],
      external: ['openapi-client-axios', '@fuks-ru/common'],
    });

    await build.write({
      dir: this.libOutPath,
      format: 'cjs',
    });
  }
}
