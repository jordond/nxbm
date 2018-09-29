export interface Categories {
  category: string[];
}

export interface GameUS {
  game_code: string;
  buyonline: boolean;
  front_box_art: string;
  eshop_price: number;
  nsuid: string;
  video_link: string;
  number_of_players: string;
  ca_price: number;
  id: string;
  title: string;
  system: string;
  free_to_start: boolean;
  digitaldownload: boolean;
  release_date: string;
  categories: Categories;
  slug: string;
  buyitnow: boolean;
}
