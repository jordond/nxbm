import { platform } from "os";

// tslint:disable-next-line:no-empty
export function noop() {}

export function format(obj: any) {
  return JSON.stringify(obj, null, 2);
}

export function olderThan(start: Date, hours: number): boolean {
  const now = new Date().getTime();
  const endTime = new Date(start).getTime() + hourToMs(hours);
  return now > endTime;
}

export function youngerThan(start: Date, hours: number): boolean {
  return !olderThan(start, hours);
}

export function hourToMs(hours: number): number {
  return 1000 * 60 * 60 * hours;
}

export function prettyDateTime(date: Date): string {
  return `${date.toLocaleDateString()} - ${date.toLocaleTimeString()}`;
}

export function create0toNArray(length: number): number[] {
  return [...Array(length).keys()];
}

export function create1toNArray(length: number): number[] {
  return Array(length)
    .fill(null)
    .map((_, index) => index + 1);
}

export function isWindows(): boolean {
  return platform() === "win32";
}

export interface AnyObject {
  [key: string]: any;
}

export function removeDuplicates<T>(target: T[], prop: string) {
  return target.filter(
    (obj, index) =>
      target
        .map(mapObj => (mapObj as any)[prop])
        .indexOf((obj as any)[prop]) === index
  );
}

export function flatten<T>(arr: any[]): T[] {
  return arr.reduce((acc: any, val: any) => acc.concat(val), []);
}

export function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}
