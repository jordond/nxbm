// TODO
// export function getMasterKey(keys: MasterKeys, keyRevision: number) {}

/**
 * Convert the master key byte value to a human readable string
 *
 * @see https://github.com/gibaBR/Switch-Backup-Manager/blob/master/Switch%20Backup%20Manager/Util.cs#L1242-L1316
 * @param id Raw byte value for master key
 */
export function getMasterKeyStr(id: number) {
  if (id < 1) return "N/A";

  const map: { [key: string]: string } = {
    1: "MasterKey0 (1.0.0-2.3.0)",
    2: "MasterKey1 (3.0.0)",
    3: "MasterKey2 (3.0.1-3.0.2)",
    4: "MasterKey3 (4.0.0-4.1.0)",
    5: "MasterKey4 (5.0.0+)"
  };

  const value = map[id];
  return value || `MasterKey${id} (?)`;
}
