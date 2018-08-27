export function hexToGb(hex: number, isStr = false): number {
  switch (hex) {
    case 0xfa:
      return 1;
    case 0xf8:
      return 2;
    case 0xf0:
      return 4;
    case 0xe0:
      return 8;
    case 0xe1:
      return 16;
    case 0xe2:
      return 32;
    default:
      return 0;
  }
}

export function hexToGbStr(hex: number): string {
  return `${hexToGb(hex)}GB`;
}

export function fileSize(bytes: number, si: boolean = true) {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return `${bytes}B`;
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];

  let unit = -1;
  let remainingBytes = bytes;
  do {
    remainingBytes /= thresh;
    unit += 1;
  } while (Math.abs(remainingBytes) >= thresh && unit < units.length - 1);

  return `${remainingBytes.toFixed(2)}${units[unit]}`;
}

export function formatTitleId(titleID: number): string {
  return titleID ? `0${titleID.toString(16).toUpperCase()}` : "";
}
