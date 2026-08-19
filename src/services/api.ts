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

export interface EpisodeServer {
  server_group?: string; // "Server 1" | "Server 2"
  server_name: string;   // "Vietsub" | "Thuyết minh" | "Lồng tiếng"
  server_data: {
    name: string;
    slug: string;
    filename: string;
    link_embed: string;
    link_m3u8: string;
  }[];
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
  episodes: EpisodeServer[];
}

export const formatEpisodeDisplay = (name?: string | number) => {
  if (!name) return '';
  const str = String(name).trim();
  if (str.toLowerCase().startsWith('tập')) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  if (/^\d+$/.test(str)) {
    return `Tập ${str}`;
  }
  return str;
};

export const cleanEpisodeName = (name?: string | number) => {
  if (!name) return '';
  return String(name).replace(/^tập\s*/i, '').trim();
};

export const getImageUrl = (url: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400&auto=format&fit=crop';
  
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
  
  // If it's a relative path, ensure uploads/movies prefix if missing and prepend official PhimApi CDN domain (img.phimapi.com)
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  if (!cleanPath.startsWith('uploads/')) {
    return `https://img.phimapi.com/uploads/movies/${cleanPath}`;
  }
  return `https://img.phimapi.com/${cleanPath}`;
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  // If img.phimapi.com failed, attempt to fall back to the raw phimimg.com domain
  if (target.src.includes('img.phimapi.com')) {
    target.src = target.src.replace('img.phimapi.com', 'phimimg.com');
  } 
  // If the raw domain also failed or we are on other domain, fall back to a high-quality dark cinematic placeholder
  else {
    target.src = 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400&auto=format&fit=crop';
  }
};

export const fetchMovies = async (page = 1) => {
  const res = await fetch(`${API_BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`);
  return res.json();
};

export const fetchMoviesV1 = async (page = 1) => {
  const res = await fetch(`${API_BASE_URL}/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}`);
  return res.json();
};

export const fetchMovieDetail = async (slug: string) => {
  try {
    const [kkRes, nguoncRes] = await Promise.all([
      fetch(`${API_BASE_URL}/phim/${slug}`).then(r => r.json()).catch(() => null),
      fetch(`https://phim.nguonc.com/api/film/${slug}`).then(r => r.json()).catch(() => null)
    ]);

    const hasKkphim = (kkRes?.status === true || kkRes?.status === 'success') && kkRes?.movie;
    const hasNguonc = (nguoncRes?.status === 'success') && nguoncRes?.movie;

    // Helper to clean audio/sub format label (e.g. "Vietsub #1" -> "Vietsub", "Thuyết minh #1" -> "Thuyết minh")
    const cleanAudioLabel = (name: string) => {
      if (!name) return 'Bản chuẩn';
      let clean = name
        .replace(/Server\s*\d+/gi, '')
        .replace(/KKPhim|NguonC/gi, '')
        .replace(/[\(\)\-]/g, '')
        .replace(/#\d+/g, '')
        .trim();
      if (!clean || clean.length < 2) return 'Bản chuẩn';
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    };

    // Helper to extract NguonC categories and countries
    const parseNguoncMeta = (m: any) => {
      const categories: { name: string; slug: string }[] = [];
      const countries: { name: string; slug: string }[] = [];
      if (m.category) {
        Object.values(m.category).forEach((catGroup: any) => {
          if (catGroup.group?.name === 'Thể loại' && Array.isArray(catGroup.list)) {
            catGroup.list.forEach((item: any) => categories.push({ name: item.name, slug: item.slug }));
          }
          if (catGroup.group?.name === 'Quốc gia' && Array.isArray(catGroup.list)) {
            catGroup.list.forEach((item: any) => countries.push({ name: item.name, slug: item.slug }));
          }
        });
      }
      return { categories, countries };
    };

    // Helper to format NguonC episodes into uniform EpisodeServer format
    const parseNguoncEpisodes = (episodesList: any[], groupName = 'Server 2') => {
      return (episodesList || []).map((srv: any) => ({
        server_group: groupName,
        server_name: cleanAudioLabel(srv.server_name),
        server_data: (srv.items || []).map((ep: any) => ({
          name: ep.name,
          slug: ep.slug,
          filename: ep.name,
          link_embed: ep.embed || '',
          link_m3u8: ep.m3u8 || ep.embed || ''
        }))
      }));
    };

    // Case 1: Both KKPhim and NguonC have the movie -> merge episode servers into Server 1 and Server 2
    if (hasKkphim && hasNguonc) {
      const kkEpisodes = (kkRes.episodes || []).map((srv: any) => ({
        server_group: 'Server 1',
        server_name: cleanAudioLabel(srv.server_name),
        server_data: srv.server_data || []
      }));

      const nguoncEpisodes = parseNguoncEpisodes(nguoncRes.movie.episodes, 'Server 2');

      return {
        status: true,
        movie: kkRes.movie,
        episodes: [...kkEpisodes, ...nguoncEpisodes]
      };
    }

    // Case 2: Only KKPhim has the movie
    if (hasKkphim) {
      const kkEpisodes = (kkRes.episodes || []).map((srv: any) => ({
        server_group: 'Server 1',
        server_name: cleanAudioLabel(srv.server_name),
        server_data: srv.server_data || []
      }));

      return {
        status: true,
        movie: kkRes.movie,
        episodes: kkEpisodes
      };
    }

    // Case 3: Only NguonC has the movie
    if (hasNguonc) {
      const m = nguoncRes.movie;
      const { categories, countries } = parseNguoncMeta(m);
      const nguoncEpisodes = parseNguoncEpisodes(m.episodes, 'Server 1');

      return {
        status: true,
        movie: {
          _id: m.id,
          name: m.name,
          slug: m.slug,
          origin_name: m.original_name || m.name,
          content: m.description || '',
          thumb_url: m.thumb_url,
          poster_url: m.poster_url,
          year: m.created ? new Date(m.created).getFullYear() : 2024,
          type: 'single',
          status: m.current_episode || 'completed',
          time: m.time || '',
          episode_current: m.current_episode || '',
          episode_total: m.total_episodes ? `${m.total_episodes}` : '',
          quality: m.quality || 'HD',
          lang: m.language || 'Vietsub',
          actor: m.casts ? m.casts.split(',').map((a: string) => a.trim()) : [],
          director: m.director ? m.director.split(',').map((d: string) => d.trim()) : [],
          category: categories,
          country: countries
        },
        episodes: nguoncEpisodes
      };
    }
  } catch (e) {
    console.error('Fetch movie detail error:', e);
  }

  return { status: false, msg: 'Không tìm thấy phim' };
};

export const searchMovies = async (keyword: string, page = 1, limit = 24) => {
  const cleanKeyword = keyword.trim();
  if (!cleanKeyword) {
    return { status: 'success', data: { items: [], params: { pagination: { totalItems: 0, totalPages: 1 } } } };
  }

  const encKey = encodeURIComponent(cleanKeyword);

  try {
    // 1. Prioritize KKPhim (phimapi.com) search first
    const phimApiRes = await fetch(`${API_BASE_URL}/v1/api/tim-kiem?keyword=${encKey}&page=${page}&limit=${limit}`).then(r => r.json()).catch(() => null);
    const phimApiList: Movie[] = phimApiRes?.data?.items || phimApiRes?.items || [];

    // If KKPhim already has results, return them immediately (no duplicate movies from NguonC)
    if (phimApiList.length > 0) {
      return phimApiRes;
    }

    // 2. Only if KKPhim returns no results or fails, fall back to NguonC search
    const nguoncRes = await fetch(`https://phim.nguonc.com/api/films/search?keyword=${encKey}&page=${page}`).then(r => r.json()).catch(() => null);

    if (nguoncRes?.items && Array.isArray(nguoncRes.items) && nguoncRes.items.length > 0) {
      const nguoncItems: Movie[] = nguoncRes.items.map((item: any) => ({
        _id: item.id,
        name: item.name,
        slug: item.slug,
        origin_name: item.original_name || item.name,
        thumb_url: item.thumb_url,
        poster_url: item.poster_url,
        year: item.created ? new Date(item.created).getFullYear() : 2024,
        modified: {
          time: item.modified || item.created || ''
        }
      }));

      const totalItems = nguoncRes.paginate?.total_items || nguoncItems.length;
      const totalPages = nguoncRes.paginate?.total_page || 1;

      return {
        status: 'success',
        data: {
          items: nguoncItems,
          params: {
            pagination: {
              totalItems,
              totalItemsPerPage: limit,
              currentPage: page,
              totalPages
            }
          }
        }
      };
    }

    // Return empty results if neither has matching movies
    return phimApiRes || {
      status: 'success',
      data: {
        items: [],
        params: {
          pagination: {
            totalItems: 0,
            totalItemsPerPage: limit,
            currentPage: page,
            totalPages: 1
          }
        }
      }
    };
  } catch (error) {
    console.error('Search API error:', error);
    return { status: 'error', data: { items: [] } };
  }
};

export const fetchCategoryMovies = async (category: string, page = 1) => {
  // Handles phim-bo, phim-le, hoat-hinh, tv-shows, phim-vietsub, phim-thuyet-minh, phim-long-tieng, phim-bo-dang-chieu, phim-bo-hoan-thanh, phim-sap-chieu, subteam, etc.
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

export const fetchGenresList = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/v1/api/the-loai`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch genres list:', err);
    return null;
  }
};

export const fetchCountriesList = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/v1/api/quoc-gia`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch countries list:', err);
    return null;
  }
};

export const CATEGORIES = [
  { slug: 'phim-moi-cap-nhat', name: 'Phim Mới Cập Nhật', icon: '🍿' },
  { slug: 'phim-bo', name: 'Phim Bộ', icon: '📺' },
  { slug: 'phim-le', name: 'Phim Lẻ', icon: '🎬' },
  { slug: 'phim-vietsub', name: 'Phim Vietsub', icon: '💬' },
  { slug: 'phim-thuyet-minh', name: 'Phim Thuyết Minh', icon: '🎙️' },
  { slug: 'phim-long-tieng', name: 'Phim Lồng Tiếng', icon: '🔊' },
  { slug: 'phim-bo-dang-chieu', name: 'Phim Bộ Đang Chiếu', icon: '⚡' },
  { slug: 'phim-bo-hoan-thanh', name: 'Phim Trọn Bộ', icon: '✅' },
  { slug: 'phim-sap-chieu', name: 'Phim Sắp Chiếu', icon: '⏰' },
  { slug: 'hoat-hinh', name: 'Hoạt Hình', icon: '🦄' },
  { slug: 'tv-shows', name: 'TV Shows', icon: '🎭' },
  { slug: 'subteam', name: 'Subteam', icon: '⭐' }
];

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
