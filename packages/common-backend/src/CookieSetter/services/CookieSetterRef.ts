import { Injectable } from '@nestjs/common';
import { CookieOptions } from 'express';
import requestContext from 'request-context';

import {
  COOKIE,
  COOKIE_CLEAR,
  REQUEST_CONTEXT_ID,
} from 'common-backend/CookieSetter/utils/constants';

type ICookie = Record<
  string,
  {
    /**
     * Значение куки.
     */
    value: string;
    /**
     * Параметры куки.
     */
    options?: CookieOptions;
  }
>;

type ICookieToRemove = Record<string, CookieOptions | undefined>;

/**
 * Контекст запроса.
 */
interface IRequestContext {
  /**
   * Объект с куками для ответа.
   */
  [COOKIE]?: ICookie;
  /**
   * Объект с куками для очистки.
   */
  [COOKIE_CLEAR]?: ICookieToRemove;
}

@Injectable()
export class CookieSetterRef {
  /**
   * Установить куку.
   */
  public setCookie(name: string, value: string, options?: CookieOptions): void {
    const context = requestContext.get<IRequestContext>(REQUEST_CONTEXT_ID);

    const prevCookiesClear = context[COOKIE_CLEAR] || [];
    const prevCookiesAdd = context[COOKIE] || {};

    const newCookiesAdd = {
      ...prevCookiesAdd,
      [name]: { value, options },
    };
    const newCookiesClear = Object.keys(prevCookiesClear).filter(
      (clearCookieName) => clearCookieName !== name,
    );

    requestContext.set(
      `${REQUEST_CONTEXT_ID}:${COOKIE_CLEAR}`,
      newCookiesClear,
    );
    requestContext.set(`${REQUEST_CONTEXT_ID}:${COOKIE}`, newCookiesAdd);
  }

  /**
   * Добавляет куку в список для удаления.
   */
  public clearCookie(name: string, options?: CookieOptions): void {
    const context = requestContext.get<IRequestContext>(REQUEST_CONTEXT_ID);

    const prevCookiesClear = context[COOKIE_CLEAR] || {};
    const prevCookiesAdd = context[COOKIE] || {};

    const newCookiesClear: ICookieToRemove = {
      ...prevCookiesClear,
      [name]: options,
    };
    const newCookiesAdd = Object.fromEntries(
      Object.entries(prevCookiesAdd).filter(
        ([addCookieName]) => addCookieName !== name,
      ),
    );

    requestContext.set(
      `${REQUEST_CONTEXT_ID}:${COOKIE_CLEAR}`,
      newCookiesClear,
    );
    requestContext.set(`${REQUEST_CONTEXT_ID}:${COOKIE}`, newCookiesAdd);
  }

  /**
   * Получить куки.
   */
  public getCookies(): ICookie {
    const context = requestContext.get<IRequestContext>(REQUEST_CONTEXT_ID);

    return context[COOKIE] || {};
  }

  /**
   * Получить куки для удаления.
   */
  public getClearCookies(): ICookieToRemove {
    const context = requestContext.get<IRequestContext>(REQUEST_CONTEXT_ID);

    return context[COOKIE_CLEAR] || {};
  }
}
