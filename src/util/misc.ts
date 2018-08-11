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
