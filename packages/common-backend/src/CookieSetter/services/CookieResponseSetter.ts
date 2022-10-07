import { Injectable } from '@nestjs/common';
import { Response } from 'express';

import { CookieSetterRef } from 'common-backend/CookieSetter/services/CookieSetterRef';

@Injectable()
export class CookieResponseSetter {
  public constructor(private readonly cookieSetterRef: CookieSetterRef) {}

  /**
   * Устанавливает куку для ответа.
   */
  public set(response: Response): void {
    for (const [name, { value, options = {} }] of Object.entries(
      this.cookieSetterRef.getCookies(),
    )) {
      response.cookie(name, value, options);
    }

    for (const [name, options] of Object.entries(
      this.cookieSetterRef.getClearCookies(),
    )) {
      response.clearCookie(name, options);
    }
  }
}
