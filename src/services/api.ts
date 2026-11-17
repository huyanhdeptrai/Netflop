import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ------------------------------------------------------------------ */
/*  Nguồn dữ liệu                                                      */
/*  - Server 1 (chính): KKPhim  https://phimapi.com                    */
/*  - Server 2 (phụ):   NguonC  https://phim.nguonc.com/api            */
/* ------------------------------------------------------------------ */

export const API_BASE_URL = 'https://phimapi.com';
export const NGUONC_BASE_URL = 'https://phim.nguonc.com/api';
// CDN ảnh chính thức của KKPhim (img.phimapi.com đã chết, trả 404)
const KK_IMAGE_CDN = 'https://phimimg.com';

export type MovieSource = 'kkphim' | 'nguonc';

export interface TmdbInfo {
  id?: string | number | null;
  type?: string | null;
  season?: number | null;
}

export interface Movie {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  /** Ảnh dọc (2:3) */
  poster_url: string;
  /** Ảnh ngang (16:9) */
  thumb_url: string;
  year: number;
  modified: {
    time: string;
  };
  type?: string;
  lang?: string;
  quality?: string;
  episode_current?: string;
  tmdb?: TmdbInfo;
  source?: MovieSource;
}

export interface EpisodeItem {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

export interface EpisodeServer {
  server_group?: string; // "Server 1" | "Server 2"
  server_name: string;   // "Vietsub" | "Thuyết minh" | "Lồng tiếng"
  source?: MovieSource;
  server_data: EpisodeItem[];
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

/* ------------------------------------------------------------------ */
/*  Hiển thị tập                                                       */
/* ------------------------------------------------------------------ */

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
  return String(name).replace(/^tập\s*/i, '').replace(/^0+(?=\d)/, '').trim();
};

/* ------------------------------------------------------------------ */
/*  Ảnh                                                                */
/* ------------------------------------------------------------------ */

export const IMAGE_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="#1f1f1f"/><text x="100" y="155" font-family="Arial,sans-serif" font-size="20" font-weight="900" fill="#E5097F" text-anchor="middle" opacity=".6">NETFLOP</text></svg>'
  );

export const getImageUrl = (url?: string) => {
  if (!url) return IMAGE_PLACEHOLDER;

  if (/^https?:\/\//i.test(url)) {
    // Các domain cũ / chết của KKPhim -> CDN hiện tại
    return url.replace(/\/\/(img\.phimapi\.com|images\.kkphim\.com)\//i, '//phimimg.com/');
  }

  // Đường dẫn tương đối của KKPhim (v1 API): "uploads/movies/..." hoặc "upload/vod/..."
  const cleanPath = url.replace(/^\/+/, '');
  if (/^uploads?\//i.test(cleanPath)) {
    return `${KK_IMAGE_CDN}/${cleanPath}`;
  }
  return `${KK_IMAGE_CDN}/uploads/movies/${cleanPath}`;
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  // Chỉ fallback 1 lần để không bị loop vô hạn khi placeholder cũng lỗi
  if (target.dataset.fallback === '1') return;
  target.dataset.fallback = '1';
  target.src = IMAGE_PLACEHOLDER;
};

/* ------------------------------------------------------------------ */
/*  Fetch helper: timeout + cache trong bộ nhớ + gộp request trùng      */
/* ------------------------------------------------------------------ */

const responseCache = new Map<string, { expires: number; promise: Promise<any> }>();
const DEFAULT_TTL = 5 * 60 * 1000;

async function getJSON<T = any>(url: string, { ttl = DEFAULT_TTL, timeout = 10000 } = {}): Promise<T | null> {
  const now = Date.now();
  const cached = responseCache.get(url);
  if (cached && cached.expires > now) return cached.promise;

  const promise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  })();

  responseCache.set(url, { expires: now + ttl, promise });
  // Không cache kết quả lỗi để lần sau còn thử lại
  promise.then((data) => {
    if (data === null) responseCache.delete(url);
  });

  // Dọn bớt cache khi quá lớn
  if (responseCache.size > 300) {
    for (const [key, value] of responseCache) {
      if (value.expires <= now) responseCache.delete(key);
    }
  }
  return promise;
}

/* ------------------------------------------------------------------ */
/*  Chuẩn hoá dữ liệu                                                  */
/* ------------------------------------------------------------------ */

const removeDiacritics = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

export const slugify = (s: string) =>
  removeDiacritics(String(s || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeTitle = (s?: string) =>
  removeDiacritics(String(s || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const toYear = (v: unknown): number => {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) && n > 1900 ? n : 0;
};

const splitList = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

type FilmRef = Pick<Movie, 'name' | 'origin_name' | 'year'> & { tmdb?: TmdbInfo };

/**
 * Hai bản ghi (từ 2 nguồn khác nhau) có phải cùng 1 phim không.
 * Ưu tiên so TMDB id (+ season), nếu thiếu thì so tên gốc/tên + năm.
 */
export function isSameFilm(a: FilmRef, b: FilmRef): boolean {
  const aId = a.tmdb?.id ? String(a.tmdb.id) : '';
  const bId = b.tmdb?.id ? String(b.tmdb.id) : '';
  if (aId && bId) {
    if (aId !== bId) return false;
    const aType = a.tmdb?.type || '';
    const bType = b.tmdb?.type || '';
    if (aType && bType && aType !== bType) return false;
    const aSeason = a.tmdb?.season ?? null;
    const bSeason = b.tmdb?.season ?? null;
    if (aSeason !== null && bSeason !== null && Number(aSeason) !== Number(bSeason)) return false;
    return true;
  }

  const yearOk = !a.year || !b.year || Math.abs(a.year - b.year) <= 1;
  if (!yearOk) return false;

  const aOrigin = normalizeTitle(a.origin_name);
  const bOrigin = normalizeTitle(b.origin_name);
  const aName = normalizeTitle(a.name);
  const bName = normalizeTitle(b.name);
  return (!!aOrigin && aOrigin === bOrigin) || (!!aName && aName === bName);
}

/** Map 1 item danh sách/tìm kiếm của NguonC sang cấu trúc Movie chung */
const mapNguoncItem = (item: any): Movie => ({
  _id: `nc-${item.slug}`,
  name: item.name,
  slug: item.slug,
  origin_name: item.original_name || item.name,
  // NguonC ngược với KKPhim: thumb_url là ảnh dọc, poster_url là ảnh ngang
  poster_url: item.thumb_url || item.poster_url || '',
  thumb_url: item.poster_url || item.thumb_url || '',
  year: toYear(item.year) || toYear(item.created?.slice?.(0, 4)),
  modified: { time: item.modified || item.created || '' },
  lang: item.language || undefined,
  quality: item.quality || undefined,
  episode_current: item.current_episode || undefined,
  tmdb: item.tmdb ? { id: item.tmdb.id, type: item.tmdb.type, season: item.tmdb.season } : undefined,
  source: 'nguonc',
});

const withKkSource = (items: any[]): Movie[] =>
  (items || []).map((m) => ({ ...m, source: 'kkphim' as const }));

interface ListResult {
  status: boolean | string;
  items: Movie[];
  pagination: { totalItems: number; totalItemsPerPage: number; currentPage: number; totalPages: number };
  data: {
    items: Movie[];
    params: { pagination: { totalItems: number; totalItemsPerPage: number; currentPage: number; totalPages: number } };
  };
}

/** Trả về 1 object đọc được theo cả 2 kiểu cũ (`res.items` và `res.data.items`) */
const makeListResult = (
  items: Movie[],
  p: { totalItems?: number; totalItemsPerPage?: number; currentPage?: number; totalPages?: number } = {}
): ListResult => {
  const perPage = p.totalItemsPerPage || items.length || 1;
  const totalItems = p.totalItems ?? items.length;
  const pagination = {
    totalItems,
    totalItemsPerPage: perPage,
    currentPage: p.currentPage || 1,
    totalPages: p.totalPages || Math.max(1, Math.ceil(totalItems / perPage)),
  };
  return {
    status: 'success',
    items,
    pagination,
    data: { items, params: { pagination } },
  };
};

const emptyList = (page = 1) => makeListResult([], { totalItems: 0, currentPage: page, totalPages: 1 });

const nguoncListToResult = (res: any, page: number): ListResult | null => {
  if (!res || res.status !== 'success' || !Array.isArray(res.items) || res.items.length === 0) return null;
  const items = res.items.map(mapNguoncItem);
  return makeListResult(items, {
    totalItems: res.paginate?.total_items,
    totalItemsPerPage: res.paginate?.items_per_page,
    currentPage: res.paginate?.current_page || page,
    totalPages: res.paginate?.total_page,
  });
};

const kkListToResult = (res: any, page: number): ListResult | null => {
  if (!res) return null;
  const raw = res.data?.items || res.items;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const p = res.data?.params?.pagination || res.pagination || {};
  return makeListResult(withKkSource(raw), {
    totalItems: p.totalItems,
    totalItemsPerPage: p.totalItemsPerPage,
    currentPage: p.currentPage || page,
    totalPages: p.totalPages,
  });
};

/* ------------------------------------------------------------------ */
/*  Danh sách (KKPhim là chính, lỗi thì fallback NguonC)               */
/* ------------------------------------------------------------------ */

// Slug danh mục KKPhim -> NguonC (chỉ những danh mục NguonC có)
const NGUONC_CATEGORY_MAP: Record<string, string> = {
  'phim-bo': 'phim-bo',
  'phim-le': 'phim-le',
  'tv-shows': 'tv-shows',
  'hoat-hinh': 'hoat-hinh',
  'phim-bo-dang-chieu': 'phim-dang-chieu',
};

async function listWithFallback(kkUrl: string, ncUrl: string | null, page: number) {
  const kk = kkListToResult(await getJSON(kkUrl), page);
  if (kk) return kk;
  if (ncUrl) {
    const nc = nguoncListToResult(await getJSON(ncUrl), page);
    if (nc) return nc;
  }
  return emptyList(page);
}

export const fetchMovies = (page = 1) =>
  listWithFallback(
    `${API_BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`,
    `${NGUONC_BASE_URL}/films/phim-moi-cap-nhat?page=${page}`,
    page
  );

export const fetchMoviesV1 = (page = 1) =>
  listWithFallback(
    `${API_BASE_URL}/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}`,
    `${NGUONC_BASE_URL}/films/phim-moi-cap-nhat?page=${page}`,
    page
  );

export const fetchCategoryMovies = (category: string, page = 1) => {
  if (category === 'phim-moi-cap-nhat' || category === 'phim-moi') return fetchMovies(page);
  const nc = NGUONC_CATEGORY_MAP[category];
  return listWithFallback(
    `${API_BASE_URL}/v1/api/danh-sach/${category}?page=${page}`,
    nc ? `${NGUONC_BASE_URL}/films/danh-sach/${nc}?page=${page}` : null,
    page
  );
};

export const fetchGenreMovies = (genre: string, page = 1) =>
  listWithFallback(
    `${API_BASE_URL}/v1/api/the-loai/${genre}?page=${page}`,
    `${NGUONC_BASE_URL}/films/the-loai/${genre}?page=${page}`,
    page
  );

export const fetchCountryMovies = (country: string, page = 1) =>
  listWithFallback(
    `${API_BASE_URL}/v1/api/quoc-gia/${country}?page=${page}`,
    `${NGUONC_BASE_URL}/films/quoc-gia/${country}?page=${page}`,
    page
  );

export const fetchGenresList = () => getJSON(`${API_BASE_URL}/v1/api/the-loai`, { ttl: 60 * 60 * 1000 });

export const fetchCountriesList = () => getJSON(`${API_BASE_URL}/v1/api/quoc-gia`, { ttl: 60 * 60 * 1000 });

/* ------------------------------------------------------------------ */
/*  Tìm kiếm: gộp 2 nguồn, KKPhim đứng trước, bỏ phim trùng             */
/* ------------------------------------------------------------------ */

const searchKk = async (keyword: string, page: number, limit: number) => {
  const res = await getJSON(
    `${API_BASE_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}`
  );
  const items: Movie[] = withKkSource(res?.data?.items || []);
  const p = res?.data?.params?.pagination || {};
  return { items, totalItems: Number(p.totalItems) || items.length, totalPages: Number(p.totalPages) || 1 };
};

const searchNguonc = async (keyword: string, page: number) => {
  const res = await getJSON(
    `${NGUONC_BASE_URL}/films/search?keyword=${encodeURIComponent(keyword)}&page=${page}`
  );
  const items: Movie[] = res?.status === 'success' && Array.isArray(res.items) ? res.items.map(mapNguoncItem) : [];
  return {
    items,
    totalItems: Number(res?.paginate?.total_items) || items.length,
    totalPages: Number(res?.paginate?.total_page) || 1,
  };
};

export const searchMovies = async (keyword: string, page = 1, limit = 24) => {
  const cleanKeyword = keyword.trim();
  if (!cleanKeyword) return emptyList(page);

  const [kk, nc] = await Promise.all([searchKk(cleanKeyword, page, limit), searchNguonc(cleanKeyword, page)]);

  const ncOnly = nc.items.filter((n) => !kk.items.some((k) => k.slug === n.slug || isSameFilm(k, n)));
  const duplicates = nc.items.length - ncOnly.length;
  const items = [...kk.items, ...ncOnly];

  return makeListResult(items, {
    // Số tổng là ước lượng: tổng 2 nguồn trừ số phim trùng thấy được ở trang hiện tại
    totalItems: Math.max(items.length, kk.totalItems + nc.totalItems - duplicates),
    totalItemsPerPage: limit,
    currentPage: page,
    totalPages: Math.max(kk.totalPages, nc.totalPages, 1),
  });
};

/* ------------------------------------------------------------------ */
/*  Chi tiết phim: gộp KKPhim (Server 1) + NguonC (Server 2)           */
/* ------------------------------------------------------------------ */

const DETAIL_TTL = 10 * 60 * 1000;

/** "Vietsub #1" -> "Vietsub", "#Hà Nội (Vietsub)" -> "Vietsub" */
const cleanAudioLabel = (name: string) => {
  if (!name) return 'Bản chuẩn';
  const inParens = name.match(/\(([^)]+)\)/);
  let clean = (inParens ? inParens[1] : name)
    .replace(/Server\s*\d+/gi, '')
    .replace(/KKPhim|NguonC/gi, '')
    .replace(/#\s*\d+/g, '')
    .replace(/[#\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean || clean.length < 2) return 'Bản chuẩn';
  // Thống nhất kiểu chữ giữa 2 nguồn: "Thuyết Minh" / "thuyết minh" -> "Thuyết minh"
  clean = clean.toLocaleLowerCase('vi');
  return clean.charAt(0).toLocaleUpperCase('vi') + clean.slice(1);
};

const parseKkEpisodes = (episodes: any[]): Omit<EpisodeServer, 'server_group'>[] =>
  (episodes || [])
    .map((srv: any) => ({
      server_name: cleanAudioLabel(srv.server_name),
      source: 'kkphim' as const,
      server_data: (srv.server_data || [])
        .filter((ep: any) => ep && (ep.link_embed || ep.link_m3u8))
        .map((ep: any) => ({
          name: String(ep.name ?? ''),
          slug: ep.slug || slugify(`tap-${ep.name}`),
          filename: ep.filename || '',
          link_embed: ep.link_embed || '',
          link_m3u8: ep.link_m3u8 || '',
        })),
    }))
    .filter((srv) => srv.server_data.length > 0);

const parseNguoncEpisodes = (episodes: any[]): Omit<EpisodeServer, 'server_group'>[] =>
  (episodes || [])
    .map((srv: any) => ({
      server_name: cleanAudioLabel(srv.server_name),
      source: 'nguonc' as const,
      server_data: (srv.items || [])
        .filter((ep: any) => ep && (ep.embed || ep.m3u8))
        .map((ep: any) => ({
          name: String(ep.name ?? ''),
          slug: ep.slug || slugify(`tap-${ep.name}`),
          filename: ep.name || '',
          link_embed: ep.embed || '',
          link_m3u8: ep.m3u8 || '',
        })),
    }))
    .filter((srv) => srv.server_data.length > 0);

/** Đánh tên định dạng trùng trong cùng 1 server: Vietsub, Vietsub 2... */
const dedupeLabels = (servers: Omit<EpisodeServer, 'server_group'>[]) => {
  const seen = new Map<string, number>();
  return servers.map((srv) => {
    const count = (seen.get(srv.server_name) || 0) + 1;
    seen.set(srv.server_name, count);
    return count > 1 ? { ...srv, server_name: `${srv.server_name} ${count}` } : srv;
  });
};

const parseNguoncMeta = (m: any) => {
  const categories: { id: string; name: string; slug: string }[] = [];
  const countries: { id: string; name: string; slug: string }[] = [];
  let format = '';
  Object.values(m?.category || {}).forEach((group: any) => {
    const groupName = group?.group?.name;
    const list = Array.isArray(group?.list) ? group.list : [];
    if (groupName === 'Thể loại') {
      list.forEach((it: any) => categories.push({ id: it.id, name: it.name, slug: slugify(it.name) }));
    } else if (groupName === 'Quốc gia') {
      list.forEach((it: any) => countries.push({ id: it.id, name: it.name, slug: slugify(it.name) }));
    } else if (groupName === 'Định dạng' && list[0]) {
      format = list[0].name || '';
    }
  });
  return { categories, countries, format };
};

const mapNguoncDetail = (m: any): Omit<MovieDetail, 'episodes'> => {
  const { categories, countries, format } = parseNguoncMeta(m);
  const f = slugify(format);
  const isAnimation = categories.some((c) => c.slug === 'hoat-hinh');
  const type =
    f === 'tv-shows' ? 'tvshows'
    : isAnimation ? 'hoathinh'
    : f === 'phim-bo' || Number(m.total_episodes) > 1 ? 'series'
    : 'single';

  return {
    ...mapNguoncItem(m),
    content: m.description || '',
    type,
    status: m.current_episode || '',
    time: m.time || '',
    episode_current: m.current_episode || '',
    episode_total: m.total_episodes ? String(m.total_episodes) : '',
    quality: m.quality || 'HD',
    lang: m.language || 'Vietsub',
    notify: '',
    showtimes: '',
    actor: splitList(m.casts),
    director: splitList(m.director),
    category: categories,
    country: countries,
  };
};

const fetchKkDetailRaw = async (slug: string) => {
  const res = await getJSON(`${API_BASE_URL}/phim/${encodeURIComponent(slug)}`, { ttl: DETAIL_TTL });
  return (res?.status === true || res?.status === 'success') && res?.movie ? res : null;
};

const fetchNguoncDetailRaw = async (slug: string) => {
  const res = await getJSON(`${NGUONC_BASE_URL}/film/${encodeURIComponent(slug)}`, { ttl: DETAIL_TTL });
  return res?.status === 'success' && res?.movie ? res.movie : null;
};

const kkRef = (kk: any): FilmRef => ({
  name: kk.movie.name,
  origin_name: kk.movie.origin_name,
  year: toYear(kk.movie.year),
  tmdb: kk.movie.tmdb,
});

const ncRef = (nc: any): FilmRef => ({
  name: nc.name,
  origin_name: nc.original_name,
  year: toYear(nc.year),
  tmdb: nc.tmdb,
});

/** Tìm phim tương ứng bên NguonC khi slug 2 bên khác nhau */
async function findOnNguonc(ref: FilmRef) {
  const keywords = Array.from(new Set([ref.name, ref.origin_name].filter(Boolean)));
  for (const kw of keywords) {
    const { items } = await searchNguonc(kw, 1);
    const match = items.find((it) => isSameFilm(ref, it));
    if (match) return fetchNguoncDetailRaw(match.slug);
  }
  return null;
}

/** Tìm phim tương ứng bên KKPhim khi slug 2 bên khác nhau */
async function findOnKk(ref: FilmRef) {
  const keywords = Array.from(new Set([ref.name, ref.origin_name].filter(Boolean)));
  for (const kw of keywords) {
    const { items } = await searchKk(kw, 1, 20);
    const match = items.find((it) => isSameFilm(ref, it));
    if (match) return fetchKkDetailRaw(match.slug);
  }
  return null;
}

/** Lấp các trường còn trống của `base` bằng dữ liệu từ `extra` */
const fillMissing = <T extends Record<string, any>>(base: T, extra: Partial<T>): T => {
  const out: Record<string, any> = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const cur = out[key];
    const isEmpty = cur === undefined || cur === null || cur === '' || (Array.isArray(cur) && cur.length === 0);
    if (isEmpty && value !== undefined && value !== null && value !== '') out[key] = value;
  }
  return out as T;
};

type DetailResult =
  | { status: true; movie: MovieDetail; episodes: EpisodeServer[]; sources: MovieSource[] }
  | { status: false; msg: string };

const detailCache = new Map<string, { expires: number; promise: Promise<DetailResult> }>();

async function loadMovieDetail(slug: string): Promise<DetailResult> {
  let [kk, nc] = await Promise.all([fetchKkDetailRaw(slug), fetchNguoncDetailRaw(slug)]);

  // Trùng slug nhưng khác phim -> bỏ bản NguonC, đi tìm lại theo tên
  if (kk && nc && !isSameFilm(kkRef(kk), ncRef(nc))) nc = null;

  if (kk && !nc) nc = await findOnNguonc(kkRef(kk));
  else if (!kk && nc) kk = await findOnKk(ncRef(nc));

  if (!kk && !nc) return { status: false, msg: 'Không tìm thấy phim' };

  const ncMovie = nc ? mapNguoncDetail(nc) : null;
  let movie: Omit<MovieDetail, 'episodes'>;
  if (kk) {
    movie = { ...kk.movie, year: toYear(kk.movie.year), source: 'kkphim' as const };
    if (ncMovie) {
      const { _id, slug: _s, source: _src, poster_url, thumb_url, ...rest } = ncMovie;
      movie = fillMissing(movie, rest);
      if (!movie.poster_url) movie.poster_url = poster_url;
      if (!movie.thumb_url) movie.thumb_url = thumb_url;
    }
  } else {
    movie = ncMovie!;
  }
  // Giữ đúng slug người dùng truy cập để URL / lịch sử / yêu thích ổn định
  movie = { ...movie, slug };

  // KKPhim luôn đứng trước -> chỉ số `sv` trên URL ổn định
  const groups = [
    kk ? dedupeLabels(parseKkEpisodes(kk.episodes)) : [],
    nc ? dedupeLabels(parseNguoncEpisodes(nc.episodes)) : [],
  ].filter((g) => g.length > 0);

  const episodes: EpisodeServer[] = groups.flatMap((group, i) =>
    group.map((srv) => ({ ...srv, server_group: `Server ${i + 1}` }))
  );
  const sources = Array.from(new Set(episodes.map((e) => e.source!))) as MovieSource[];

  return { status: true, movie: { ...movie, episodes } as MovieDetail, episodes, sources };
}

export const fetchMovieDetail = async (slug: string): Promise<any> => {
  const now = Date.now();
  const cached = detailCache.get(slug);
  if (cached && cached.expires > now) return cached.promise;

  const promise = loadMovieDetail(slug).catch((e) => {
    console.error('Fetch movie detail error:', e);
    return { status: false as const, msg: 'Không tìm thấy phim' };
  });
  detailCache.set(slug, { expires: now + DETAIL_TTL, promise });
  promise.then((r) => {
    if (!r.status) detailCache.delete(slug);
  });
  return promise;
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
