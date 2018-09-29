export interface TGDBResponse {
  code: number;
  status: string;
  data: {
    count: number;
    games: TGDBApiGame[];
  };
  include: {
    boxart: {
      base_url: TGDBApiUrls;
      data: TGDBApiImageMap;
    };
  };
  pages: {
    previous?: string;
    current?: string;
    next?: string;
  };
  remaining_monthly_allowance: number;
  extra_allowance: number;
}

export interface TGDBApiImageMap {
  [id: string]: TGDBApiImage[];
}

export interface TGDBApiUrls {
  original: string;
  small: string;
  thumb: string;
  cropped_center_thumb: string;
  medium: string;
  large: string;
}

export interface TGDBApiGame {
  id: number;
  game_title: string;
  release_date: string;
  overview: string;
  rating: string;
  youtube: string;
  players: number;
}

export interface TGDBApiImage {
  id: number;
  type: string;
  side: string;
  filename: string;
  resolution: string;
}

export interface DownloadResult {
  base_url: TGDBApiUrls;
  games: TGDBApiGame[];
  images: TGDBApiImageMap;
}

export interface TGDBGame extends TGDBApiGame {
  images: TGDBGameImages;
}

export interface TGDBGameImages {
  [side: string]: TGDBGameImageSide;
}

export interface TGDBGameImageSide {
  [size: string]: string;
}
