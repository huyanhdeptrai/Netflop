import React from 'react';
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
  if (!url) return '';
  
  // If it's already an absolute URL
  if (url.startsWith('http')) {
    let cleanUrl = url;
    // Replace broken/unsupported images.kkphim.com or potentially blocked phimimg.com with the official fast CDN img.phimapi.com
    if (cleanUrl.includes('images.kkphim.com')) {
      cleanUrl = cleanUrl.replace('images.kkphim.com', 'img.phimapi.com');
    } else if (cleanUrl.includes('phimimg.com')) {
      cleanUrl = cleanUrl.replace('phimimg.com', 'img.phimapi.com');
    }
    return cleanUrl;
  }
  
  // If it's a relative path, prepend the official PhimApi CDN domain (img.phimapi.com)
  return `https://img.phimapi.com/${url}`;
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  // If img.phimapi.com failed, attempt to fall back to the raw phimimg.com domain
  if (target.src.includes('img.phimapi.com')) {
    target.src = target.src.replace('img.phimapi.com', 'phimimg.com');
  } 
  // If the raw domain also failed or we are on other domain, fall back to a high-quality dark cinematic placeholder
  else if (target.src.includes('phimimg.com')) {
    target.src = 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400&auto=format&fit=crop';
  }
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

export const fetchCountryMovies = async (country: string, page = 1) => {
  const res = await fetch(`${API_BASE_URL}/v1/api/quoc-gia/${country}?page=${page}`);
  return res.json();
};

export const GENRES = [
  { slug: 'hanh-dong', name: 'Hành Động' },
  { slug: 'co-trang', name: 'Cổ Trang' },
  { slug: 'chien-tranh', name: 'Chiến Tranh' },
  { slug: 'vien-tuong', name: 'Viễn Tưởng' },
  { slug: 'kinh-di', name: 'Kinh Dị' },
  { slug: 'tai-lieu', name: 'Tài Liệu' },
  { slug: 'tam-ly', name: 'Tâm Lý' },
  { slug: 'tinh-cam', name: 'Tình Cảm' },
  { slug: 'hinh-su', name: 'Hình Sự' },
  { slug: 'vo-thuat', name: 'Võ Thuật' },
  { slug: 'hai-huoc', name: 'Hài Hước' },
  { slug: 'phieu-luu', name: 'Phiêu Lưu' },
  { slug: 'khoa-hoc', name: 'Khoa Học' },
  { slug: 'am-nhac', name: 'Âm Nhạc' },
  { slug: 'than-thoai', name: 'Thần Thoại' },
  { slug: 'gia-dinh', name: 'Gia Đình' },
  { slug: 'chinh-kich', name: 'Chính Kịch' },
  { slug: 'hoc-duong', name: 'Học Đường' },
  { slug: 'the-thao', name: 'Thể Thao' },
  { slug: 'bi-an', name: 'Bí Ẩn' },
  { slug: 'kinh-dien', name: 'Kinh Điển' }
];

export const COUNTRIES = [
  { slug: 'trung-quoc', name: 'Trung Quốc' },
  { slug: 'han-quoc', name: 'Hàn Quốc' },
  { slug: 'nhat-ban', name: 'Nhật Bản' },
  { slug: 'my', name: 'Mỹ' },
  { slug: 'viet-nam', name: 'Việt Nam' },
  { slug: 'thai-lan', name: 'Thái Lan' },
  { slug: 'hong-kong', name: 'Hồng Kông' },
  { slug: 'dai-loan', name: 'Đài Loan' },
  { slug: 'an-do', name: 'Ấn Độ' },
  { slug: 'anh', name: 'Anh' },
  { slug: 'phap', name: 'Pháp' },
  { slug: 'canada', name: 'Canada' },
  { slug: 'duc', name: 'Đức' },
  { slug: 'tay-ban-nha', name: 'Tây Ban Nha' },
  { slug: 'tho-nhi-ky', name: 'Thổ Nhĩ Kỳ' },
  { slug: 'ha-lan', name: 'Hà Lan' },
  { slug: 'indonesia', name: 'Indonesia' },
  { slug: 'nga', name: 'Nga' },
  { slug: 'mexico', name: 'Mexico' },
  { slug: 'ba-lan', name: 'Ba Lan' },
  { slug: 'uc', name: 'Úc' },
  { slug: 'thuy-dien', name: 'Thụy Điển' },
  { slug: 'thuy-si', name: 'Thụy Sĩ' },
  { slug: 'brazil', name: 'Brazil' },
  { slug: 'philippines', name: 'Philippines' }
];
