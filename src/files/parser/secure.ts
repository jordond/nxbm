export function getNCADetails(details: Details): Detail {
  let master: number = -9223372036854775808;
  return details.reduce<Detail>(
    (prev, curr) => {
      if (curr.size > master) {
        master = curr.size;
        return curr;
      }
      return prev;
    },
    { size: -1, offset: -1 }
  );
}

export type Details = Detail[];

export interface Detail {
  size: number;
  offset: number;
}
