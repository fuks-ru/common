export class ValidationError<
  Data extends Record<string, string[]> = Record<string, string[]>,
> extends Error {
  public constructor(public data: Data, message: string) {
    super(message);
  }
}
