import { IRedirectData } from 'common/errorResponse/IRedirectData';

export class RedirectError extends Error {
  public constructor(public readonly data: IRedirectData) {
    super('Redirect');
  }
}
