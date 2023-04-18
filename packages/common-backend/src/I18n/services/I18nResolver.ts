import { Injectable } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

import { SystemErrorFactory } from 'common-backend/SystemError/services/SystemErrorFactory';
import { CommonErrorCode } from 'common-backend/SystemError/enums/CommonErrorCode';

@Injectable()
export class I18nResolver {
  public constructor(private readonly systemErrorFactory: SystemErrorFactory) {}

  /**
   * Получает request-scoped инстанс i18n-сервиса.
   */
  public resolve(): I18nContext {
    const i18n = I18nContext.current();

    if (!i18n) {
      throw this.systemErrorFactory.create(
        CommonErrorCode.CONFIG_NOT_FOUND,
        'i18n not init',
      );
    }

    return i18n;
  }
}
