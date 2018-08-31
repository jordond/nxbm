import axios, { AxiosPromise } from "axios";
import { createWriteStream } from "fs";

export function getJSON(url: string): AxiosPromise {
  return axios.get(url, {
    headers: {
      Accept: "application/json"
    }
  });
}

export async function downloadFile(url: string, output: string) {
  const { data } = await axios.get(url, { responseType: "stream" });

  data.pipe(createWriteStream(output));

  return new Promise((resolve, reject) => {
    data.on("end", () => resolve());
    data.on("error", (err: any) => reject(err));
  });
}
