/**
 * Является ли строкой.
 */
export const isString = (val: unknown): val is string =>
  typeof val === 'string';

/**
 * Является ли объектом.
 */
export const isObject = (fn: unknown): fn is object =>
  !isNil(fn) && typeof fn === 'object';

/**
 * Является ли простым объектом.
 */
export const isPlainObject = (fn: unknown): fn is object => {
  if (!isObject(fn)) {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const proto = Object.getPrototypeOf(fn);

  if (proto === null) {
    return true;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const ctor =
    Object.prototype.hasOwnProperty.call(proto, 'constructor') &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    proto.constructor;

  return (
    typeof ctor === 'function' &&
    ctor instanceof ctor &&
    Function.prototype.toString.call(ctor) ===
      Function.prototype.toString.call(Object)
  );
};

/**
 * Является ли null или undefined.
 */
export const isNil = (val: unknown): val is null | undefined =>
  isUndefined(val) || val === null;

/**
 * Является ли undefined.
 */
export const isUndefined = (obj: unknown): obj is undefined =>
  typeof obj === 'undefined';
