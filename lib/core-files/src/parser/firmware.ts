const FIRMWARE_MAP = [
  { raw: 0, value: "0" },
  { raw: 450, value: "1.0.0" },
  { raw: 65796, value: "2.0.0" },
  { raw: 131162, value: "2.1.0" },
  { raw: 196628, value: "2.2.0" },
  { raw: 262164, value: "2.3.0" },
  { raw: 201327002, value: "3.0.0" },
  { raw: 201392178, value: "3.0.1" },
  { raw: 201457684, value: "3.0.2" },
  { raw: 268435656, value: "4.0.0" },
  { raw: 268501002, value: "4.0.1" },
  { raw: 269484082, value: "4.1.0" },
  { raw: 335544750, value: "5.0.0" },
  { raw: 335609886, value: "5.0.1" },
  { raw: 335675432, value: "5.0.2" },
  { raw: 336592976, value: "5.1.0" },
  { raw: 402653544, value: "6.0.0" }
];

export function getFirmwareFromString(firmwareStr: string): string {
  return matchRawFirmware(parseInt(firmwareStr));
}

export function matchRawFirmware(firmware: number): string {
  const rawFirmware = firmware % 0x100000000;
  const result = FIRMWARE_MAP.find(x => rawFirmware <= x.raw);

  return result ? result.value : rawFirmware.toString();
}
