import { open, read } from "fs-extra";
import { Int64LE } from "int64-buffer";

export function read64LEFloat(buffer: Buffer, start: number = 0): number {
  const result = new Int64LE(copyBuffer(buffer, start, 8));
  return parseFloat(result.toString());
}

export function copyBuffer(
  buffer: Buffer,
  start: number = 0,
  length?: number
): Buffer {
  const takeLength = length ? start + length : buffer.length;
  const newBuffer = Buffer.alloc(takeLength);
  buffer.copy(newBuffer, 0, start, takeLength);
  return newBuffer;
}

export function takeBytes() {
  const options: { buffer?: Buffer; skip?: number } = {};
  const factory = {
    from(buffer: Buffer) {
      options.buffer = buffer;
      return factory;
    },
    skip(length: number) {
      options.skip = length;
      return factory;
    },
    take(length: number) {
      return copyBuffer(options.buffer!, options.skip || 0, length);
    }
  };

  return factory;
}

export async function openReadNBytes(
  filePath: string,
  length: number,
  position: number = 0
): Promise<Buffer> {
  const fd = await open(filePath, "r");
  return readNBytes(fd, length, position);
}

export async function readNBytes(
  fd: number,
  length: number,
  position: number = 0
): Promise<Buffer> {
  const { buffer } = await read(fd, Buffer.alloc(length), 0, length, position);
  return buffer;
}

export function readByByte(
  fd: number,
  startPosition: number = 0,
  condition: (num: number) => boolean
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    let pos = startPosition;
    const value: number[] = [];
    let prevVal: number = -1;
    while (condition(prevVal)) {
      try {
        const { buffer } = await read(fd, Buffer.alloc(1), 0, 1, pos);

        prevVal = buffer[0];
        if (condition(prevVal)) {
          value.push(buffer[0]);
          pos += 1;
        }
      } catch (error) {
        reject(error);
      }
    }

    resolve(Buffer.from(value));
  });
}
