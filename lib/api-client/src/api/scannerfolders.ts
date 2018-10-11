import { ScannerFolderRoutes } from "@nxbm/api-endpoints";
import { ScannerFolder } from "@nxbm/types";

import { client } from "../client";

const endpoints = ScannerFolderRoutes.Endpoints;

class ScannerFolders extends ScannerFolderRoutes {
  public getFolders = () => {
    const url = this.joinUrl(endpoints.getFolders.url());
    return client.get<ScannerFolder[]>(url);
  };

  public postAddFolder = (payload: Partial<ScannerFolder>) => {
    const url = this.joinUrl(endpoints.postAddFolder.url());
    return client.post<ScannerFolder, ScannerFolder>(url, payload);
  };

  public putUpdateFolder = (payload: ScannerFolder) => {
    const url = this.joinUrl(endpoints.putUpdateFolder.url());
    return client.put<ScannerFolder, ScannerFolder>(url, payload);
  };

  public deleteFolder = (folderId: string, hardDelete: boolean = false) => {
    const url = this.joinUrl(endpoints.deleteFolder.url(folderId));
    return client.delete<boolean>(url, { query: { hardDelete } });
  };
}

export const games = new ScannerFolders();
