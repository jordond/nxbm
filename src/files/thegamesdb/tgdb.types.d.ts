interface TGDBResponse {
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

interface TGDBApiImageMap {
  [id: string]: TGDBApiImage[];
}

interface TGDBApiUrls {
  original: string;
  small: string;
  thumb: string;
  cropped_center_thumb: string;
  medium: string;
  large: string;
}

interface TGDBApiGame {
  id: number;
  game_title: string;
  release_date: string;
  overview: string;
  rating: string;
  youtube: string;
  players: number;
}

interface TGDBApiImage {
  id: number;
  type: string;
  side: string;
  filename: string;
  resolution: string;
}

interface DownloadResult {
  base_url: TGDBApiUrls;
  games: TGDBApiGame[];
  images: TGDBApiImageMap;
}

interface TGDBGame extends TGDBApiGame {
  images: TGDBGameImages;
}

interface TGDBGameImages {
  [side: string]: TGDBGameImageSide;
}

interface TGDBGameImageSide {
  [size: string]: string;
}
