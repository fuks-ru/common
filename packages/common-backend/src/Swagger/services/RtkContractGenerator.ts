import childProcess from 'node:child_process';
import path from 'node:path';
import util from 'node:util';
import { Injectable, Logger } from '@nestjs/common';
import { parseConfig, generateEndpoints } from '@rtk-query/codegen-openapi';
import { OperationDefinition } from '@rtk-query/codegen-openapi/lib/types';
import { OpenAPIV3 } from 'openapi-types';
import fs from 'node:fs/promises';

const exec = util.promisify(childProcess.exec);

@Injectable()
export class RtkContractGenerator {
  private readonly logger = new Logger(RtkContractGenerator.name);

  private readonly emptyApiPath = path.join(
    path.join(
      // eslint-disable-next-line unicorn/prefer-module
      require.resolve('@fuks-ru/common-backend'),
      '../emptyApi.ts',
    ),
  );

  /**
   * Генерация файлов контракта.
   */
  public async generateContractLib(
    swaggerSchemaCachePath: string,
  ): Promise<void> {
    const filterByTag =
      (tag: string) => (_: string, operationDefinition: OperationDefinition) =>
        operationDefinition.operation.tags?.includes(tag) || false;

    const swaggerJson: OpenAPIV3.Document = JSON.parse(
      await fs.readFile(swaggerSchemaCachePath, 'utf8'),
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
      apiFile: this.emptyApiPath,
      schemaFile: swaggerSchemaCachePath,
      outputFiles: Object.fromEntries(
        uniqueTags.map((tag) => [
          tag,
          {
            filterEndpoints: filterByTag(tag),
            exportName: `${tag.charAt(0).toUpperCase()}${tag.slice(1)}Api`,
          },
        ]),
      ),
      hooks: true,
    });

    const apiFilesContent = await Promise.all(
      configs.map(({ outputFile, ...config }) => generateEndpoints(config)),
    );

    console.log(apiFilesContent);

    this.logger.log('Contracts build completed');
  }
}
