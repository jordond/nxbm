export interface ProgressEvent {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

export type OnUploadProgress = (progress: ProgressEvent) => void;
