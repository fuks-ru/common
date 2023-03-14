import { Injectable } from '@nestjs/common';

import { I18nResolver } from 'common-backend/I18n/services/I18nResolver';

@Injectable()
export class I18nValidationTranslator {
  public constructor(private readonly i18nResolver: I18nResolver) {}

  /**
   * Переводит ошибки валидации.
   */
  public translateErrors(
    errors: Record<string, string[]>,
  ): Record<string, string[]> {
    const i18n = this.i18nResolver.resolve();

    return Object.fromEntries(
      Object.entries(errors).map(([key, value]) => {
        const currentError = value.map((errorItem) => {
          const [translationKey, argsString] = errorItem.split('|');

          if (!translationKey) {
            return errorItem;
          }

          const args = argsString
            ? (JSON.parse(argsString) as Record<string, string>)
            : {};

          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          return i18n.t(translationKey, {
            args: { property: key, ...args },
          }) as string;
        });

        return [key, currentError];
      }),
    );
  }
}
