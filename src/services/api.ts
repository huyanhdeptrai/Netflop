import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE_URL = 'https://phimapi.com';

export interface Movie {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  poster_url: string;
  thumb_url: string;
  year: number;
  modified: {
    time: string;
  };
}

export interface MovieDetail extends Movie {
  content: string;
  type: string;
  status: string;
  time: string;
  episode_current: string;
  episode_total: string;
  quality: string;
  lang: string;
  notify: string;
  showtimes: string;
  actor: string[];
  director: string[];
  category: { id: string; name: string; slug: string }[];
  country: { id: string; name: string; slug: string }[];
  episodes: {
    server_name: string;
    server_data: {
      name: string;
      slug: string;
      filename: string;
      link_embed: string;
      link_m3u8: string;
    }[];
  }[];
}

export const getImageUrl = (url: string) => {
  if (url.startsWith('http')) return `https://phimapi.com/image.php?url=${encodeURIComponent(url)}`;
  return `https://phimimg.com/${url}`;
};

export const fetchMovies = async (page = 1) => {
  const res = await fetch(`${API_BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`);
  return res.json();
};

export const fetchMovieDetail = async (slug: string) => {
  const res = await fetch(`${API_BASE_URL}/phim/${slug}`);
  return res.json();
};

export const searchMovies = async (keyword: string, page = 1) => {
  const res = await fetch(`${API_BASE_URL}/v1/api/tim-kiem?keyword=${keyword}&page=${page}`);
  return res.json();
};

export const fetchCategoryMovies = async (category: string, page = 1) => {
  const res = await fetch(`${API_BASE_URL}/v1/api/danh-sach/${category}?page=${page}`);
  return res.json();
};

export const fetchGenreMovies = async (genre: string, page = 1) => {
  const res = await fetch(`${API_BASE_URL}/v1/api/the-loai/${genre}?page=${page}`);
  return res.json();
};
