import childProcess from 'node:child_process';
import path from 'node:path';
import util from 'node:util';
import { Injectable, Logger } from '@nestjs/common';
import { parseConfig, generateEndpoints } from '@rtk-query/codegen-openapi';
import { OperationDefinition } from '@rtk-query/codegen-openapi/lib/types';
import { OpenAPIV3 } from 'openapi-types';
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
      '../emptyApi.ts',
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
  ): Promise<void> {
    await this.createCachePathIfNotExist();
    await fsa.copyFile(
      this.emptyApiPath,
      path.join(this.contractDirCachePath, 'emptyApi.ts'),
    );

    const filterByTag =
      (tag: string) => (_: string, operationDefinition: OperationDefinition) =>
        operationDefinition.operation.tags?.includes(tag) || false;

    const swaggerJson: OpenAPIV3.Document = JSON.parse(
      await fsa.readFile(swaggerSchemaCachePath, 'utf8'),
    );

    const allTags = Object.values(swaggerJson.paths)
      .filter((pathItem): pathItem is OpenAPIV3.PathItemObject => !!pathItem)
      .flatMap((pathItem) =>
        Object.values(pathItem)
          .filter(
            (operation): operation is OpenAPIV3.OperationObject =>
              typeof operation === 'object' && 'responses' in operation,
          )
          .flatMap((operation) => operation.tags)
          .filter((tag): tag is string => !!tag),
      );

    const uniqueTags = [...new Set(allTags)];

    const configs = parseConfig({
      apiFile: './emptyApi.ts',
      apiImport: 'emptyApi',
      schemaFile: swaggerSchemaCachePath,
      outputFiles: Object.fromEntries(
        uniqueTags.map((tag) => [
          tag,
          {
            filterEndpoints: filterByTag(tag),
            exportName: `${tag.charAt(0).toLowerCase()}${tag.slice(1)}Api`,
          },
        ]),
      ),
      hooks: true,
    });

    const apiFilesContent = await Promise.all(
      configs.map(async ({ outputFile, ...config }) => {
        const content = (await generateEndpoints(config)) as string;

        return {
          outputFile: config.exportName || 'api',
          content,
        };
      }),
    );

    await Promise.all(
      apiFilesContent.map(async ({ outputFile, content }) => {
        await fsa.writeFile(
          path.join(this.contractDirCachePath, `${outputFile}.ts`),
          content,
        );
      }),
    );

    const indexFileContent = apiFilesContent
      .map(
        ({ outputFile }) => `export * as ${outputFile} from "./${outputFile}"`,
      )
      .join(';\n');

    await fsa.writeFile(
      path.join(this.contractDirCachePath, 'index.ts'),
      `${indexFileContent};\nexport * from "./emptyApi";`,
    );

    await exec(
      'yarn tsc node_modules/.cache/generate-api-contract/rtk/*.ts --noEmitOnError false --noEmit false --skipLibCheck --declaration --outDir dist/client/rtk',
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
