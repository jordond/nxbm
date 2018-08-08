// tslint:disable-next-line:no-empty
export function noop() {}

export function format(obj: any) {
  return JSON.stringify(obj, null, 2);
}
