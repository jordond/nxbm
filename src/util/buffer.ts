import { open, read as fsRead, write } from "fs-extra";
import { Int64LE } from "int64-buffer";
import { ensureOpenWrite } from "./filesystem";

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
  const newBuffer = Buffer.alloc(length || buffer.length);
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
      const skip = options.skip || 0;
      return copyBuffer(options.buffer!, skip, length);
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

export function read(fd: number, length: number, position: number) {
  return fsRead(fd, Buffer.alloc(length), 0, length, position);
}

export async function readNBytes(
  fd: number,
  length: number,
  position: number = 0
): Promise<Buffer> {
  const { buffer } = await read(fd, length, position);
  return buffer;
}

export function readByByte(
  fd: number,
  startPosition: number = 0,
  condition: (num: number) => boolean
): Promise<Buffer> {
  return new Promise(async (finish, reject) => {
    let pos = startPosition;
    const value: number[] = [];
    let prevVal: number = -1;
    while (condition(prevVal)) {
      try {
        const { buffer } = await read(fd, 1, pos);

        prevVal = buffer[0];
        if (condition(prevVal)) {
          value.push(buffer[0]);
          pos += 1;
        }
      } catch (error) {
        reject(error);
      }
    }

    finish(Buffer.from(value));
  });
}

export function readWriteByNBytes(
  fd: number,
  sectorLength: number,
  totalBytesToRead: number,
  outputPath: string,
  startPosition: number = 0
) {
  return new Promise(async (finish, reject) => {
    let pos = 0;
    let remainingBytes = totalBytesToRead;
    let readBytes = 0;
    let totalBytes = 0;

    try {
      const outputFd = await ensureOpenWrite(outputPath);
      do {
        const { buffer, bytesRead } = await read(
          fd,
          sectorLength,
          startPosition + pos
        );
        await write(outputFd, buffer, 0, sectorLength, pos);

        readBytes = bytesRead;
        pos += sectorLength;
        remainingBytes -= bytesRead;
        totalBytes += bytesRead;
      } while (readBytes > 0 && remainingBytes > 0);
      finish(totalBytes);
    } catch (error) {
      reject(error);
    }
  });
}
