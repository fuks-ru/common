import fs from 'node:fs';
import childProcess from 'node:child_process';
import path from 'node:path';
import util from 'node:util';
import { Injectable, Logger } from '@nestjs/common';

const exec = util.promisify(childProcess.exec);

@Injectable()
export class DartContractGenerator {
  private readonly logger = new Logger(DartContractGenerator.name);

  private readonly targetPackageRootPath = process.cwd();

  private readonly commonPackageRootPath = path.join(
    // eslint-disable-next-line unicorn/prefer-module
    require.resolve('@fuks-ru/common-backend'),
  );

  private readonly licenseDistPath = path.join(
    this.commonPackageRootPath,
    '../LICENSE',
  );

  private readonly outputPath = path.join(
    this.targetPackageRootPath,
    '/dist/client/dart',
  );

  private readonly licenseOutputPath = path.join(this.outputPath, '/LICENSE');

  private readonly configPath = path.join(
    this.targetPackageRootPath,
    '/openapi-config-dart.yaml',
  );

  private readonly changelogDistPath = path.join(
    this.targetPackageRootPath,
    '/CHANGELOG-DART.md',
  );

  private readonly changelogOutPath = path.join(
    this.outputPath,
    '/CHANGELOG.md',
  );

  /**
   * Генерация файлов контракта.
   */
  public async generateContractLib(
    swaggerSchemaCachePath: string,
  ): Promise<void> {
    await this.generateDartPackage(swaggerSchemaCachePath);

    this.logger.log('Contracts build completed');
  }

  private async generateDartPackage(
    swaggerSchemaCachePath: string,
  ): Promise<void> {
    const openApiCliPath = path.join(
      path.dirname(
        require.resolve('@openapitools/openapi-generator-cli/package.json'),
      ),
      'main.js',
    );

    await exec(
      `yarn node ${openApiCliPath} generate -o ${this.outputPath} -i ${swaggerSchemaCachePath} -g dart-dio -c ${this.configPath}`,
    );
    fs.copyFileSync(this.licenseDistPath, this.licenseOutputPath);
    fs.copyFileSync(this.changelogDistPath, this.changelogOutPath);
    await exec('flutter pub get', {
      cwd: this.outputPath,
    });
    await exec('flutter pub run build_runner build', {
      cwd: this.outputPath,
    });
  }
}
