/**
 * Описывает коды базовых ошибок.
 */
export enum CommonErrorCode {
  UNKNOWN = 'unknown',
  CONFIG_NOT_FOUND = 'config_not_found',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  REDIRECT = 'redirect',
  ALREADY_AUTH = 'already-auth',
  I18N_NOT_INIT = 'i18n-not-init',
  REMOTE_HOST_ERROR = 'remote-host-error',
}
