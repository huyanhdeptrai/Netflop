import React, { useState, useEffect, useRef } from 'react';
import { Search, Home, Film, Tv, Heart, LogOut, Play, Star, Calendar, Clock, Globe, ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchMovies, fetchCategoryMovies, fetchMovieDetail, getImageUrl, handleImageError, Movie, MovieDetail, fetchGenreMovies, fetchCountryMovies, GENRES, COUNTRIES, searchMovies } from '../services/api';
import { useHistory } from '../services/HistoryContext';

interface TVAppProps {
  setTvMode: (mode: boolean) => void;
}

interface TVShelf {
  title: string;
  movies: any[];
  isHistory?: boolean;
}

type Section = 'sidebar' | 'shelves' | 'detail_modal' | 'player' | 'search' | 'genres_grid' | 'countries_grid';

const VIRTUAL_KEYBOARD = [
  'A', 'B', 'C', 'D', 'E', 'F',
  'G', 'H', 'I', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R',
  'S', 'T', 'U', 'V', 'W', 'X',
  'Y', 'Z', '1', '2', '3', '4',
  '5', '6', '7', '8', '9', '0',
  'SPACE', 'BACK', 'CLEAR'
];

export default function TVApp({ setTvMode }: TVAppProps) {
  // Navigation State
  const [currentSection, setCurrentSection] = useState<Section>('shelves');
  const [sidebarIndex, setSidebarIndex] = useState(1); // 0: Search, 1: Home, 2: Series, 3: Movies, 4: Anime, 5: Genres, 6: Countries, 7: Favorites, 8: Exit
  const [activeShelf, setActiveShelf] = useState(0);
  const [activeMovieIdx, setActiveMovieIdx] = useState(0);
  
  // Movie Lists
  const [shelvesData, setShelvesData] = useState<TVShelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);

  // Favorites
  const [favorites, setFavorites] = useState<Movie[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocusedArea, setSearchFocusedArea] = useState<'keyboard' | 'results'>('keyboard');
  const [keyboardFocusedIdx, setKeyboardFocusedIdx] = useState(0);
  const [searchFocusedIdx, setSearchFocusedIdx] = useState(0);

  // Genres & Countries grid states
  const [genresFocusedIdx, setGenresFocusedIdx] = useState(0);
  const [countriesFocusedIdx, setCountriesFocusedIdx] = useState(0);

  // Detail Modal State
  const [selectedMovie, setSelectedMovie] = useState<MovieDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedServerIdx, setSelectedServerIdx] = useState(0);
  const [modalFocus, setModalFocus] = useState<'play' | 'favorite' | 'episodes'>('play');
  const [focusedEpisodeIdx, setFocusedEpisodeIdx] = useState(0);

  // Player State
  const [activePlayerUrl, setActivePlayerUrl] = useState<string | null>(null);
  const [activeEpisodeName, setActiveEpisodeName] = useState<string>('');

  // History Context
  const { history, updateHistory } = useHistory();

  // Refs for auto-scrolling shelves
  const shelfRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Category filters
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState<string>('home'); // 'home', 'phim-bo', 'phim-le', 'hoat-hinh', 'favorites', etc.

  // Load Initial Data
  useEffect(() => {
    const loadTVData = async () => {
      setLoading(true);
      try {
        const [
          phimMoi,
          phimDangChieu,
          phimVietsub,
          phimThuyetMinh,
          phimBo,
          phimLe,
          phimSapChieu,
          hoatHinh,
          tvShows
        ] = await Promise.all([
          fetchMovies(1),
          fetchCategoryMovies('phim-bo-dang-chieu', 1),
          fetchCategoryMovies('phim-vietsub', 1),
          fetchCategoryMovies('phim-thuyet-minh', 1),
          fetchCategoryMovies('phim-bo', 1),
          fetchCategoryMovies('phim-le', 1),
          fetchCategoryMovies('phim-sap-chieu', 1),
          fetchCategoryMovies('hoat-hinh', 1),
          fetchCategoryMovies('tv-shows', 1)
        ]);

        const shelves = [
          { title: 'Phim Mới Cập Nhật 🍿', movies: phimMoi.items?.slice(0, 15) || [] },
          { title: 'Phim Bộ Đang Chiếu ⚡', movies: phimDangChieu.data?.items?.slice(0, 15) || [] },
          { title: 'Phim Vietsub Hot 💬', movies: phimVietsub.data?.items?.slice(0, 15) || [] },
          { title: 'Phim Thuyết Minh 🎙️', movies: phimThuyetMinh.data?.items?.slice(0, 15) || [] },
          { title: 'Phim Bộ Nổi Bật 🔥', movies: phimBo.data?.items?.slice(0, 15) || [] },
          { title: 'Phim Lẻ Chọn Lọc 🎬', movies: phimLe.data?.items?.slice(0, 15) || [] },
          { title: 'Phim Sắp Chiếu ⏰', movies: phimSapChieu.data?.items?.slice(0, 15) || [] },
          { title: 'Hoạt Hình Đặc Sắc 🦄', movies: hoatHinh.data?.items?.slice(0, 15) || [] },
          { title: 'TV Shows Giải Trí 🎭', movies: tvShows.data?.items?.slice(0, 15) || [] },
        ];

        setShelvesData(shelves);
        if (phimMoi.items && phimMoi.items.length > 0) {
          setHeroMovie(phimMoi.items[0]);
        }
      } catch (err) {
        console.error('Failed to load TV data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTVData();

    // Load Favorites from localStorage
    const savedFavorites = localStorage.getItem('netflop_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Compute visible shelves, including watch history if on home page
  const visibleShelves = React.useMemo(() => {
    if (currentCategoryFilter === 'home' && history && history.length > 0) {
      return [
        { title: 'Tiếp Tục Xem 🕒', movies: history, isHistory: true },
        ...shelvesData
      ];
    }
    return shelvesData;
  }, [currentCategoryFilter, shelvesData, history]);

  // Update Hero Movie when active movie changes on the shelves
  useEffect(() => {
    if (currentSection === 'shelves' && visibleShelves[activeShelf]?.movies[activeMovieIdx]) {
      setHeroMovie(visibleShelves[activeShelf].movies[activeMovieIdx]);
    }
  }, [activeShelf, activeMovieIdx, currentSection, visibleShelves]);

  // Handle Search Input changes
  useEffect(() => {
    if (currentSection !== 'search' || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await searchMovies(searchQuery, 1);
        setSearchResults(res.data?.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, currentSection]);

  // Scroll Focused Movie into view
  useEffect(() => {
    if (currentSection === 'shelves' && shelfRefs.current[activeShelf]) {
      const container = shelfRefs.current[activeShelf];
      const activeEl = container?.children[activeMovieIdx] as HTMLElement;
      if (activeEl && container) {
        const containerWidth = container.offsetWidth;
        const activeLeft = activeEl.offsetLeft;
        const activeWidth = activeEl.offsetWidth;
        
        container.scrollTo({
          left: activeLeft - (containerWidth / 2) + (activeWidth / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [activeMovieIdx, activeShelf, currentSection]);

  // Scroll focused elements in grids & modal
  useEffect(() => {
    if (currentSection === 'genres_grid') {
      const activeEl = document.getElementById(`tv-genre-${genresFocusedIdx}`);
      activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [genresFocusedIdx, currentSection]);

  useEffect(() => {
    if (currentSection === 'countries_grid') {
      const activeEl = document.getElementById(`tv-country-${countriesFocusedIdx}`);
      activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [countriesFocusedIdx, currentSection]);

  useEffect(() => {
    if (currentSection === 'search' && searchFocusedArea === 'results') {
      const activeEl = document.getElementById(`tv-search-result-${searchFocusedIdx}`);
      activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [searchFocusedIdx, searchFocusedArea, currentSection]);

  useEffect(() => {
    if (currentSection === 'detail_modal' && modalFocus === 'episodes') {
      const activeEl = document.getElementById(`tv-episode-${focusedEpisodeIdx}`);
      activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedEpisodeIdx, modalFocus, currentSection]);

  // Toggle Favorite
  const toggleFavorite = (movie: Movie) => {
    let updated: Movie[] = [];
    if (favorites.some(f => f._id === movie._id)) {
      updated = favorites.filter(f => f._id !== movie._id);
    } else {
      updated = [movie, ...favorites];
    }
    setFavorites(updated);
    localStorage.setItem('netflop_favorites', JSON.stringify(updated));
  };

  // Open Movie Details
  const openMovieDetails = async (slug: string) => {
    setModalLoading(true);
    setCurrentSection('detail_modal');
    setModalFocus('play');
    setFocusedEpisodeIdx(0);
    setSelectedServerIdx(0);
    try {
      const data = await fetchMovieDetail(slug);
      if (data.movie) {
        let movieObj = data.movie;
        if (data.episodes) {
          movieObj = { ...movieObj, episodes: data.episodes };
        }
        setSelectedMovie(movieObj);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleVirtualKeyPress = (key: string) => {
    if (key === 'SPACE') {
      setSearchQuery(prev => prev + ' ');
    } else if (key === 'BACK') {
      setSearchQuery(prev => prev.slice(0, -1));
    } else if (key === 'CLEAR') {
      setSearchQuery('');
    } else {
      setSearchQuery(prev => prev + key);
    }
    setSearchFocusedIdx(0);
  };

  // Keyboard / Remote D-Pad Navigation Engine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for Arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.key)) {
        e.preventDefault();
      }

      if (currentSection === 'sidebar') {
        switch (e.key) {
          case 'ArrowUp':
            if (sidebarIndex > 0) setSidebarIndex(prev => prev - 1);
            break;
          case 'ArrowDown':
            if (sidebarIndex < 7) setSidebarIndex(prev => prev + 1);
            break;
          case 'ArrowRight':
            if (sidebarIndex === 0) {
              setCurrentSection('search');
              setSearchFocusedArea('keyboard');
            } else if (sidebarIndex === 5) {
              setCurrentSection('genres_grid');
            } else if (sidebarIndex === 6) {
              setCurrentSection('countries_grid');
            } else if (sidebarIndex === 7 && favorites.length === 0) {
              // Stay in sidebar if no favorites
            } else {
              setCurrentSection('shelves');
            }
            break;
          case 'Enter':
            handleSidebarSelect(sidebarIndex);
            break;
          case 'Backspace':
          case 'Escape':
            setCurrentSection('shelves');
            break;
        }
      }

      else if (currentSection === 'shelves') {
        const currentShelfMovies = visibleShelves[activeShelf]?.movies || [];
        switch (e.key) {
          case 'ArrowLeft':
            if (activeMovieIdx > 0) {
              setActiveMovieIdx(prev => prev - 1);
            } else {
              setCurrentSection('sidebar');
            }
            break;
          case 'ArrowRight':
            if (activeMovieIdx < currentShelfMovies.length - 1) {
              setActiveMovieIdx(prev => prev + 1);
            }
            break;
          case 'ArrowUp':
            if (activeShelf > 0) {
              setActiveShelf(prev => prev - 1);
              const nextShelfMovies = visibleShelves[activeShelf - 1]?.movies || [];
              if (activeMovieIdx >= nextShelfMovies.length) {
                setActiveMovieIdx(Math.max(0, nextShelfMovies.length - 1));
              }
            }
            break;
          case 'ArrowDown':
            if (activeShelf < visibleShelves.length - 1) {
              setActiveShelf(prev => prev + 1);
              const nextShelfMovies = visibleShelves[activeShelf + 1]?.movies || [];
              if (activeMovieIdx >= nextShelfMovies.length) {
                setActiveMovieIdx(Math.max(0, nextShelfMovies.length - 1));
              }
            }
            break;
          case 'Enter':
            const focusedMovie = currentShelfMovies[activeMovieIdx];
            if (focusedMovie) {
              openMovieDetails(focusedMovie.slug);
            }
            break;
        }
      }

      else if (currentSection === 'search') {
        if (searchFocusedArea === 'keyboard') {
          switch (e.key) {
            case 'ArrowLeft':
              if (keyboardFocusedIdx % 6 === 0) {
                setCurrentSection('sidebar');
                setSidebarIndex(0);
              } else {
                setKeyboardFocusedIdx(prev => Math.max(0, prev - 1));
              }
              break;
            case 'ArrowRight':
              if (keyboardFocusedIdx % 6 === 5) {
                if (searchResults.length > 0) {
                  setSearchFocusedArea('results');
                  setSearchFocusedIdx(0);
                }
              } else {
                if (keyboardFocusedIdx < VIRTUAL_KEYBOARD.length - 1) {
                  setKeyboardFocusedIdx(prev => prev + 1);
                }
              }
              break;
            case 'ArrowDown':
              if (keyboardFocusedIdx + 6 < VIRTUAL_KEYBOARD.length) {
                setKeyboardFocusedIdx(prev => prev + 6);
              }
              break;
            case 'ArrowUp':
              if (keyboardFocusedIdx - 6 >= 0) {
                setKeyboardFocusedIdx(prev => prev - 6);
              }
              break;
            case 'Enter':
              const key = VIRTUAL_KEYBOARD[keyboardFocusedIdx];
              if (key) {
                handleVirtualKeyPress(key);
              }
              break;
            case 'Backspace':
            case 'Escape':
              setCurrentSection('shelves');
              break;
          }
        } else if (searchFocusedArea === 'results') {
          const numCols = 3;
          switch (e.key) {
            case 'ArrowLeft':
              if (searchFocusedIdx % numCols === 0) {
                setSearchFocusedArea('keyboard');
                setKeyboardFocusedIdx(11); // Focus near 'L' key
              } else {
                setSearchFocusedIdx(prev => Math.max(0, prev - 1));
              }
              break;
            case 'ArrowRight':
              if (searchFocusedIdx < searchResults.length - 1) {
                setSearchFocusedIdx(prev => prev + 1);
              }
              break;
            case 'ArrowDown':
              if (searchFocusedIdx + numCols < searchResults.length) {
                setSearchFocusedIdx(prev => prev + numCols);
              }
              break;
            case 'ArrowUp':
              if (searchFocusedIdx - numCols >= 0) {
                setSearchFocusedIdx(prev => prev - numCols);
              }
              break;
            case 'Enter':
              const focusedMovie = searchResults[searchFocusedIdx];
              if (focusedMovie) {
                openMovieDetails(focusedMovie.slug);
              }
              break;
            case 'Backspace':
            case 'Escape':
              setSearchFocusedArea('keyboard');
              break;
          }
        }
      }

      else if (currentSection === 'genres_grid') {
        switch (e.key) {
          case 'ArrowLeft':
            if (genresFocusedIdx % 4 === 0) {
              setCurrentSection('sidebar');
              setSidebarIndex(5);
            } else {
              setGenresFocusedIdx(prev => Math.max(0, prev - 1));
            }
            break;
          case 'ArrowRight':
            if ((genresFocusedIdx + 1) % 4 !== 0 && genresFocusedIdx < GENRES.length - 1) {
              setGenresFocusedIdx(prev => prev + 1);
            }
            break;
          case 'ArrowUp':
            if (genresFocusedIdx >= 4) {
              setGenresFocusedIdx(prev => prev - 4);
            }
            break;
          case 'ArrowDown':
            if (genresFocusedIdx + 4 < GENRES.length) {
              setGenresFocusedIdx(prev => prev + 4);
            }
            break;
          case 'Enter':
            const g = GENRES[genresFocusedIdx];
            if (g) {
              handleGenreSelect(g.slug, g.name);
            }
            break;
          case 'Backspace':
          case 'Escape':
            setCurrentSection('sidebar');
            setSidebarIndex(5);
            break;
        }
      }

      else if (currentSection === 'countries_grid') {
        switch (e.key) {
          case 'ArrowLeft':
            if (countriesFocusedIdx % 4 === 0) {
              setCurrentSection('sidebar');
              setSidebarIndex(6);
            } else {
              setCountriesFocusedIdx(prev => Math.max(0, prev - 1));
            }
            break;
          case 'ArrowRight':
            if ((countriesFocusedIdx + 1) % 4 !== 0 && countriesFocusedIdx < COUNTRIES.length - 1) {
              setCountriesFocusedIdx(prev => prev + 1);
            }
            break;
          case 'ArrowUp':
            if (countriesFocusedIdx >= 4) {
              setCountriesFocusedIdx(prev => prev - 4);
            }
            break;
          case 'ArrowDown':
            if (countriesFocusedIdx + 4 < COUNTRIES.length) {
              setCountriesFocusedIdx(prev => prev + 4);
            }
            break;
          case 'Enter':
            const c = COUNTRIES[countriesFocusedIdx];
            if (c) {
              handleCountrySelect(c.slug, c.name);
            }
            break;
          case 'Backspace':
          case 'Escape':
            setCurrentSection('sidebar');
            setSidebarIndex(6);
            break;
        }
      }

      else if (currentSection === 'detail_modal') {
        if (!selectedMovie) return;
        const episodes = selectedMovie.episodes?.[selectedServerIdx]?.server_data || [];
        
        switch (e.key) {
          case 'ArrowLeft':
            if (modalFocus === 'favorite') {
              setModalFocus('play');
            } else if (modalFocus === 'episodes') {
              if (focusedEpisodeIdx > 0) {
                setFocusedEpisodeIdx(prev => prev - 1);
              } else {
                setModalFocus('play');
              }
            }
            break;
          case 'ArrowRight':
            if (modalFocus === 'play') {
              setModalFocus('favorite');
            } else if (modalFocus === 'episodes') {
              if (focusedEpisodeIdx < episodes.length - 1) {
                setFocusedEpisodeIdx(prev => prev + 1);
              }
            }
            break;
          case 'ArrowDown':
            if (modalFocus === 'play' || modalFocus === 'favorite') {
              if (episodes.length > 0) {
                setModalFocus('episodes');
                setFocusedEpisodeIdx(0);
              }
            } else if (modalFocus === 'episodes') {
              if (focusedEpisodeIdx + 6 < episodes.length) {
                setFocusedEpisodeIdx(prev => prev + 6);
              }
            }
            break;
          case 'ArrowUp':
            if (modalFocus === 'episodes') {
              if (focusedEpisodeIdx - 6 >= 0) {
                setFocusedEpisodeIdx(prev => prev - 6);
              } else {
                setModalFocus('play');
              }
            }
            break;
          case 'Enter':
            if (modalFocus === 'play') {
              if (episodes.length > 0) {
                playEpisode(episodes[0].link_embed, episodes[0].name);
              } else {
                alert('Phim chưa có tập phát sóng!');
              }
            } else if (modalFocus === 'favorite') {
              toggleFavorite(selectedMovie);
            } else if (modalFocus === 'episodes') {
              const ep = episodes[focusedEpisodeIdx];
              if (ep) {
                playEpisode(ep.link_embed, ep.name);
              }
            }
            break;
          case 'Backspace':
          case 'Escape':
            setSelectedMovie(null);
            setCurrentSection(searchQuery ? 'search' : 'shelves');
            break;
        }
      }

      else if (currentSection === 'player') {
        switch (e.key) {
          case 'Backspace':
          case 'Escape':
            setActivePlayerUrl(null);
            setCurrentSection('detail_modal');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentSection,
    sidebarIndex,
    activeShelf,
    activeMovieIdx,
    visibleShelves,
    favorites,
    searchQuery,
    searchResults,
    searchFocusedIdx,
    searchFocusedArea,
    keyboardFocusedIdx,
    genresFocusedIdx,
    countriesFocusedIdx,
    selectedMovie,
    selectedServerIdx,
    modalFocus,
    focusedEpisodeIdx
  ]);

  // Sidebar item triggers
  const handleSidebarSelect = async (idx: number) => {
    setLoading(true);
    setSidebarIndex(idx);
    setActiveShelf(0);
    setActiveMovieIdx(0);

    try {
      if (idx === 1) { // Home
        setCurrentCategoryFilter('home');
        const [phimMoi, phimBo, phimLe, hoatHinh] = await Promise.all([
          fetchMovies(1),
          fetchCategoryMovies('phim-bo', 1),
          fetchCategoryMovies('phim-le', 1),
          fetchCategoryMovies('hoat-hinh', 1),
        ]);
        setShelvesData([
          { title: 'Phim Mới Cập Nhật 🍿', movies: phimMoi.items?.slice(0, 15) || [] },
          { title: 'Phim Bộ Hot 🔥', movies: phimBo.data?.items?.slice(0, 15) || [] },
          { title: 'Phim Lẻ Chọn Lọc 🎬', movies: phimLe.data?.items?.slice(0, 15) || [] },
          { title: 'Hoạt Hình Đặc Sắc 🦄', movies: hoatHinh.data?.items?.slice(0, 15) || [] },
        ]);
        setCurrentSection('shelves');
      } else if (idx === 2) { // Phim Bộ
        setCurrentCategoryFilter('phim-bo');
        const phimBo = await fetchCategoryMovies('phim-bo', 1);
        setShelvesData([
          { title: 'Phim Bộ Mới Nhất 📺', movies: phimBo.data?.items?.slice(0, 15) || [] },
          { title: 'Phim Bộ Cập Nhật ⚡', movies: phimBo.data?.items?.slice(5, 20) || [] },
        ]);
        setCurrentSection('shelves');
      } else if (idx === 3) { // Phim Lẻ
        setCurrentCategoryFilter('phim-le');
        const phimLe = await fetchCategoryMovies('phim-le', 1);
        setShelvesData([
          { title: 'Phim Lẻ Chiếu Rạp 🍿', movies: phimLe.data?.items?.slice(0, 15) || [] },
          { title: 'Phim Lẻ Hay Chọn Lọc ⭐️', movies: phimLe.data?.items?.slice(5, 20) || [] },
        ]);
        setCurrentSection('shelves');
      } else if (idx === 4) { // Hoạt hình
        setCurrentCategoryFilter('hoat-hinh');
        const hoatHinh = await fetchCategoryMovies('hoat-hinh', 1);
        setShelvesData([
          { title: 'Hoạt Hình Nhật Bản (Anime) 🌸', movies: hoatHinh.data?.items?.slice(0, 15) || [] },
          { title: 'Anime Vietsub Mới 🍭', movies: hoatHinh.data?.items?.slice(5, 20) || [] },
        ]);
        setCurrentSection('shelves');
      } else if (idx === 5) { // Thể Loại (Genres grid)
        setCurrentSection('genres_grid');
        setGenresFocusedIdx(0);
        setLoading(false);
      } else if (idx === 6) { // Quốc Gia (Countries grid)
        setCurrentSection('countries_grid');
        setCountriesFocusedIdx(0);
        setLoading(false);
      } else if (idx === 7) { // Favorites
        setCurrentCategoryFilter('favorites');
        setShelvesData([
          { title: 'Phim Bạn Đã Lưu Yêu Thích ❤️', movies: favorites },
        ]);
        if (favorites.length > 0) {
          setCurrentSection('shelves');
        } else {
          setCurrentSection('sidebar');
        }
      } else if (idx === 0) { // Search
        setCurrentSection('search');
        setSearchFocusedArea('keyboard');
        setKeyboardFocusedIdx(0);
        setSearchFocusedIdx(0);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreSelect = async (genreSlug: string, genreName: string) => {
    setLoading(true);
    setCurrentSection('shelves');
    setCurrentCategoryFilter(`genre-${genreSlug}`);
    setActiveShelf(0);
    setActiveMovieIdx(0);
    try {
      const res = await fetchGenreMovies(genreSlug, 1);
      const movies = res.data?.items || [];
      setShelvesData([
        { title: `Phim ${genreName} Mới Nhất 🎬`, movies: movies.slice(0, 15) },
        { title: `Phim ${genreName} Đề Cử ⭐`, movies: movies.slice(5, 20) },
      ]);
      if (movies.length > 0) {
        setHeroMovie(movies[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCountrySelect = async (countrySlug: string, countryName: string) => {
    setLoading(true);
    setCurrentSection('shelves');
    setCurrentCategoryFilter(`country-${countrySlug}`);
    setActiveShelf(0);
    setActiveMovieIdx(0);
    try {
      const res = await fetchCountryMovies(countrySlug, 1);
      const movies = res.data?.items || [];
      setShelvesData([
        { title: `Điện Ảnh ${countryName} Nổi Bật 🌏`, movies: movies.slice(0, 15) },
        { title: `Phim ${countryName} Chọn Lọc 🍿`, movies: movies.slice(5, 20) },
      ]);
      if (movies.length > 0) {
        setHeroMovie(movies[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playEpisode = (embedUrl: string, epName: string) => {
    setActivePlayerUrl(embedUrl);
    setActiveEpisodeName(epName);
    setCurrentSection('player');

    if (selectedMovie) {
      updateHistory({
        _id: selectedMovie._id,
        name: selectedMovie.name,
        slug: selectedMovie.slug,
        origin_name: selectedMovie.origin_name,
        poster_url: selectedMovie.poster_url,
        thumb_url: selectedMovie.thumb_url || '',
        year: selectedMovie.year,
        modified: selectedMovie.modified,
        currentTime: 10,
        duration: 100,
        progress: 35, // default starter progress for history row
        lastUpdated: Date.now(),
        episodeName: epName,
        episodeSlug: epName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        isSeries: selectedMovie.type === 'series',
        episodes: selectedMovie.episodes,
      });
    }
  };

  // Helper to highlight sidebar item selection
  const sidebarItems = [
    { icon: Search, label: 'Tìm Kiếm' },
    { icon: Home, label: 'Trang Chủ' },
    { icon: Film, label: 'Phim Bộ' },
    { icon: Film, label: 'Phim Lẻ' },
    { icon: Tv, label: 'Hoạt Hình' },
    { icon: Film, label: 'Thể Loại' },
    { icon: Globe, label: 'Quốc Gia' },
    { icon: Heart, label: 'Yêu Thích' },
  ];

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-sans overflow-hidden select-none relative">
      {/* Background Poster Trailer Blur Background */}
      <div className="absolute top-0 right-0 w-[80vw] h-[75vh] opacity-25 pointer-events-none transition-all duration-1000">
        {heroMovie && (
          <>
            <img
              src={getImageUrl(heroMovie.poster_url)}
              alt=""
              className="w-full h-full object-cover blur-2xl animate-fade-in"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
          </>
        )}
      </div>

      {/* Main Container */}
      <div className="flex h-screen w-screen overflow-hidden">
        
        {/* Left Sidebar Menu (Netflix TV style) */}
        <aside 
          className={`flex flex-col bg-[#050505] border-r border-white/5 h-full z-30 transition-all duration-300 shrink-0 ${
            currentSection === 'sidebar' ? 'w-[260px] shadow-2xl shadow-primary/10' : 'w-[76px]'
          }`}
        >
          {/* Netflop Logo */}
          <div className="p-6 flex items-center justify-center border-b border-white/5 h-20 shrink-0 overflow-hidden">
            <span className={`font-black text-primary tracking-tighter transition-all duration-300 ${
              currentSection === 'sidebar' ? 'text-3xl' : 'text-lg'
            }`}>
              {currentSection === 'sidebar' ? 'NETFLOP' : 'NF'}
            </span>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 flex flex-col justify-center gap-3 p-2 overflow-y-auto scrollbar-hide">
            {sidebarItems.map((item, idx) => {
              const isSelected = sidebarIndex === idx;
              const isFocused = currentSection === 'sidebar' && isSelected;
              const Icon = item.icon;
              const isSidebarExpanded = currentSection === 'sidebar';

              return (
                <button
                  key={idx}
                  onClick={() => handleSidebarSelect(idx)}
                  className={`flex items-center transition-all duration-300 outline-none rounded-xl ${
                    isSidebarExpanded 
                      ? 'gap-4 py-3 px-4 text-left w-full' 
                      : 'justify-center p-2.5 w-11 h-11 mx-auto'
                  } ${
                    isFocused 
                      ? 'bg-primary text-white scale-110 shadow-[0_0_20px_rgba(229,9,127,0.5)]' 
                      : isSelected
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-text-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} className={`shrink-0 ${isFocused ? 'animate-pulse' : ''}`} />
                  {isSidebarExpanded && (
                    <span className="text-sm font-bold whitespace-nowrap opacity-100 scale-100 translate-x-0 transition-all duration-300">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>


        </aside>

        {/* Content Showcase Panel */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0a0a0a]/40 backdrop-blur-xl">
          
          {/* SEARCH PAGE VIEW WITH VIRTUAL KEYBOARD */}
          {currentSection === 'search' && (
            <div className="flex-1 flex bg-[#0c0c0c] z-20 overflow-hidden h-full">
              {/* Left Side: Virtual Keyboard */}
              <div className="w-[360px] border-r border-white/5 bg-[#080808] p-8 flex flex-col shrink-0 h-full justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Search className="text-primary animate-pulse" size={24} />
                    <span className="text-xs font-black tracking-widest text-primary uppercase">Bàn Phím Smart TV</span>
                  </div>
                  
                  {/* Styled Search Query Box */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex items-center justify-between min-h-[56px] relative group">
                    <span className="text-lg font-bold text-white tracking-wide truncate">
                      {searchQuery || <span className="text-text-muted opacity-40">Nhập tìm kiếm...</span>}
                    </span>
                    {searchFocusedArea === 'keyboard' && (
                      <span className="w-1 h-5 bg-primary animate-ping" />
                    )}
                  </div>

                  {/* Keyboard Grid */}
                  <div className="grid grid-cols-6 gap-2">
                    {VIRTUAL_KEYBOARD.map((key, kIdx) => {
                      const isFocused = searchFocusedArea === 'keyboard' && keyboardFocusedIdx === kIdx;
                      const isSpecial = ['SPACE', 'BACK', 'CLEAR'].includes(key);
                      return (
                        <button
                          key={key}
                          id={`tv-key-${kIdx}`}
                          onClick={() => handleVirtualKeyPress(key)}
                          className={`h-11 rounded-lg font-black text-xs transition-all duration-200 outline-none flex items-center justify-center ${
                            isFocused
                              ? 'bg-primary text-white scale-110 shadow-[0_0_15px_rgba(229,9,127,0.8)] border border-white'
                              : isSpecial
                                ? 'bg-white/10 text-white hover:bg-white/15'
                                : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'
                          } ${
                            key === 'SPACE' ? 'col-span-2' : ''
                          } ${
                            key === 'CLEAR' ? 'col-span-2' : ''
                          }`}
                        >
                          {key === 'SPACE' ? 'CÁCH' : key === 'BACK' ? 'XÓA' : key === 'CLEAR' ? 'RESET' : key}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Keyboard Remote Tip */}
                <div className="text-[11px] text-text-muted/60 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="font-bold mb-1 text-white">⚡ Hướng dẫn Remote:</p>
                  <p>• Nhấn phím mũi tên ➡️ để sang kết quả phim.</p>
                  <p>• Nhấn ⬅️ từ cột đầu bàn phím để mở Menu.</p>
                </div>
              </div>

              {/* Right Side: Search Results */}
              <div className="flex-1 p-8 flex flex-col overflow-y-auto h-full">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>KẾT QUẢ TÌM KIẾM</span>
                    {searchQuery && (
                      <span className="text-text-muted text-sm font-medium">cho "{searchQuery}"</span>
                    )}
                  </h1>
                  {searchResults.length > 0 && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                      {searchResults.length} Kết quả
                    </span>
                  )}
                </div>

                {searchLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
                    <span className="text-xs text-text-muted font-bold">Đang tìm phim...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
                    {searchResults.map((movie, idx) => {
                      const isFocused = searchFocusedArea === 'results' && searchFocusedIdx === idx;
                      return (
                        <div
                          key={movie._id}
                          id={`tv-search-result-${idx}`}
                          onClick={() => openMovieDetails(movie.slug)}
                          className={`bg-surface rounded-xl overflow-hidden cursor-pointer transition-all duration-300 relative aspect-[2/3] border-2 group ${
                            isFocused
                              ? 'scale-105 border-primary shadow-[0_0_20px_rgba(229,9,127,0.8)] z-10'
                              : 'border-white/5 hover:border-white/20'
                          }`}
                        >
                          <img
                            src={getImageUrl(movie.poster_url)}
                            alt={movie.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={handleImageError}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-end">
                            <h3 className="font-bold text-xs line-clamp-2">{movie.name}</h3>
                            <p className="text-[10px] text-text-muted mt-1">{movie.year}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : searchQuery ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/5 text-center p-6">
                    <span className="text-lg text-text-muted font-bold">Không tìm thấy phim phù hợp rồi bro!</span>
                    <span className="text-xs text-text-muted/60 mt-2">Thử tìm kiếm với từ khóa khác hoặc kiểm tra lại tên phim nhé.</span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/5 text-center p-6">
                    <Search size={40} className="text-text-muted opacity-20 mb-3" />
                    <span className="text-lg text-text-muted font-bold">Hãy nhập tên phim bằng bàn phím TV bên trái</span>
                    <span className="text-xs text-text-muted/60 mt-1">Hệ thống sẽ tự động tìm kiếm ngay khi bạn gõ.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GENRES GRID VIEW */}
          {currentSection === 'genres_grid' && (
            <div className="flex-1 flex flex-col p-12 bg-[#0c0c0c] z-20 overflow-y-auto h-full">
              <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
                <Film className="text-primary animate-pulse" size={28} />
                DUYỆT THEO THỂ LOẠI
              </h1>
              
              <div className="grid grid-cols-4 gap-4 max-w-5xl">
                {GENRES.map((genre, idx) => {
                  const isFocused = genresFocusedIdx === idx;
                  return (
                    <button
                      key={genre.slug}
                      id={`tv-genre-${idx}`}
                      onClick={() => handleGenreSelect(genre.slug, genre.name)}
                      className={`py-5 px-6 rounded-2xl text-lg font-black transition-all duration-200 outline-none text-left border-2 ${
                        isFocused
                          ? 'bg-primary border-white text-white scale-105 shadow-[0_0_20px_rgba(229,9,127,0.8)]'
                          : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {genre.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* COUNTRIES GRID VIEW */}
          {currentSection === 'countries_grid' && (
            <div className="flex-1 flex flex-col p-12 bg-[#0c0c0c] z-20 overflow-y-auto h-full">
              <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
                <Globe className="text-primary animate-pulse" size={28} />
                DUYỆT THEO QUỐC GIA
              </h1>
              
              <div className="grid grid-cols-4 gap-4 max-w-5xl">
                {COUNTRIES.map((country, idx) => {
                  const isFocused = countriesFocusedIdx === idx;
                  return (
                    <button
                      key={country.slug}
                      id={`tv-country-${idx}`}
                      onClick={() => handleCountrySelect(country.slug, country.name)}
                      className={`py-5 px-6 rounded-2xl text-lg font-black transition-all duration-200 outline-none text-left border-2 ${
                        isFocused
                          ? 'bg-primary border-white text-white scale-105 shadow-[0_0_20px_rgba(229,9,127,0.8)]'
                          : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {country.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* HOME / SHELVES VIEW */}
          {currentSection !== 'search' && currentSection !== 'genres_grid' && currentSection !== 'countries_grid' && (
            <div className="flex-1 flex flex-col h-full overflow-y-auto">
              
              {/* Giant Netflix Hero Banner */}
              <div className="pt-20 px-12 pb-6 min-h-[45vh] flex flex-col justify-end relative shrink-0">
                {heroMovie && (
                  <div className="max-w-3xl z-10 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest text-white shadow-lg animate-pulse">
                        Đang Chọn
                      </span>
                      <span className="text-sm font-bold text-yellow-500 flex items-center gap-1">
                        <Star size={16} className="fill-yellow-500" />
                        8.5 TV-Score
                      </span>
                      <span className="text-sm text-text-muted">{heroMovie.year}</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl line-clamp-2">
                      {heroMovie.name}
                    </h1>
                    <p className="text-lg text-text-muted drop-shadow-lg line-clamp-1">
                      {heroMovie.origin_name}
                    </p>

                    <div className="flex gap-4 pt-2">
                      <button 
                        onClick={() => openMovieDetails(heroMovie.slug)}
                        className="bg-primary hover:bg-primary-hover text-white text-lg font-black px-8 py-4 rounded-xl flex items-center gap-3 shadow-2xl transition-all"
                      >
                        <Play size={24} fill="currentColor" />
                        XEM NGAY TRÊN TV
                      </button>
                      <button 
                        onClick={() => toggleFavorite(heroMovie)}
                        className="bg-white/10 hover:bg-white/20 text-white text-lg font-black px-6 py-4 rounded-xl flex items-center gap-3 transition-all"
                      >
                        {favorites.some(f => f._id === heroMovie._id) ? (
                          <>
                            <Check size={24} className="text-primary" />
                            ĐÃ LƯU
                          </>
                        ) : (
                          <>
                            <Heart size={24} />
                            LƯU DANH SÁCH
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Shelf Rows */}
              <div className="pb-16 px-12 space-y-10">
                {loading ? (
                  <div className="space-y-8">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-4">
                        <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse" />
                        <div className="flex gap-6 overflow-hidden">
                          {[...Array(6)].map((_, j) => (
                            <div key={j} className="w-[180px] aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : currentCategoryFilter === 'favorites' && favorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/5 rounded-3xl border border-white/10">
                    <Heart size={64} className="text-text-muted opacity-30" />
                    <h2 className="text-2xl font-black">Chưa có phim yêu thích</h2>
                    <p className="text-text-muted max-w-md">Hãy duyệt qua các phim ngoài Trang chủ và bấm "LƯU DANH SÁCH" để thêm phim vào đây bạn nhé!</p>
                  </div>
                ) : (
                  visibleShelves.map((shelf, sIdx) => {
                    const isShelfFocused = currentSection === 'shelves' && activeShelf === sIdx;
                    return (
                      <div key={sIdx} className="space-y-4">
                        <h2 className={`text-2xl font-black tracking-tight transition-colors duration-300 ${
                          isShelfFocused ? 'text-primary font-black' : 'text-white'
                        }`}>
                          {shelf.title}
                        </h2>

                        {/* Shelf Horizontal Row Container */}
                        <div 
                          ref={(el) => { shelfRefs.current[sIdx] = el; }}
                          className="flex gap-6 overflow-x-auto scrollbar-hide py-2"
                        >
                          {shelf.movies.map((movie, mIdx) => {
                            const isFocused = isShelfFocused && activeMovieIdx === mIdx;
                            return (
                              <div
                                key={movie._id}
                                onClick={() => openMovieDetails(movie.slug)}
                                className={`w-[180px] shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-surface relative cursor-pointer border-2 transition-all duration-300 ${
                                  isFocused 
                                    ? 'scale-105 border-primary shadow-[0_0_20px_rgba(229,9,127,0.8)] z-10' 
                                    : 'border-white/5 hover:border-white/20'
                                }`}
                              >
                                <img
                                  src={getImageUrl(movie.poster_url)}
                                  alt={movie.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={handleImageError}
                                />
                                
                                {/* Poster Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent p-3 flex flex-col justify-end">
                                  <h3 className="font-bold text-xs line-clamp-2 text-white">{movie.name}</h3>
                                  <p className="text-[10px] text-text-muted mt-1">{movie.year}</p>
                                </div>

                                {/* Progress Bar for History item */}
                                {shelf.isHistory && movie.progress !== undefined && (
                                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-20">
                                    <div 
                                      className="h-full bg-primary transition-all duration-300"
                                      style={{ width: `${movie.progress}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </main>
      </div>

      {/* DETAILED MOVIE MODAL OVERLAY */}
      <AnimatePresence>
        {selectedMovie && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-40 flex items-center justify-center p-12"
          >
            {modalLoading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
                <p className="text-lg font-bold text-text-muted">Đang tải phim, chờ xíu bro...</p>
              </div>
            ) : (
              <div className="max-w-6xl w-full bg-[#141414] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row h-[85vh]">
                
                {/* Modal Poster Background Side */}
                <div className="md:w-1/3 aspect-[2/3] relative h-full shrink-0">
                  <img
                    src={getImageUrl(selectedMovie.poster_url)}
                    alt={selectedMovie.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/10 to-transparent" />
                </div>

                {/* Modal Info & Episode List Side */}
                <div className="flex-1 p-10 flex flex-col justify-between overflow-y-auto">
                  
                  {/* Movie Info */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          setSelectedMovie(null);
                          setCurrentSection(searchQuery ? 'search' : 'shelves');
                        }}
                        className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white outline-none"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <h2 className="text-4xl font-black tracking-tight">{selectedMovie.name}</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-text-muted">
                      <span className="bg-primary/20 text-primary px-3 py-1 rounded font-black uppercase text-xs">
                        {selectedMovie.quality}
                      </span>
                      <span className="bg-white/5 px-3 py-1 rounded font-bold text-xs text-white">
                        {selectedMovie.lang}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-yellow-500">
                        <Star size={16} className="fill-yellow-500" />
                        8.5 Score
                      </span>
                      <span>{selectedMovie.year}</span>
                      <span>{selectedMovie.time}</span>
                    </div>

                    <div 
                      className="text-text-muted text-base leading-relaxed line-clamp-3 bg-white/5 p-4 rounded-xl border border-white/5"
                      dangerouslySetInnerHTML={{ __html: selectedMovie.content }}
                    />

                    {/* Metadata list */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-text-muted bg-[#1f1f1f]/50 p-4 rounded-xl border border-white/5">
                      {selectedMovie.category && (
                        <div>
                          <span className="font-bold text-white">Thể loại:</span> {selectedMovie.category.map(c => c.name).join(', ')}
                        </div>
                      )}
                      {selectedMovie.country && (
                        <div>
                          <span className="font-bold text-white">Quốc gia:</span> {selectedMovie.country.map(c => c.name).join(', ')}
                        </div>
                      )}
                      {selectedMovie.director && selectedMovie.director.length > 0 && selectedMovie.director[0] !== "" && (
                        <div>
                          <span className="font-bold text-white">Đạo diễn:</span> {Array.isArray(selectedMovie.director) ? selectedMovie.director.join(', ') : selectedMovie.director}
                        </div>
                      )}
                      {selectedMovie.actor && selectedMovie.actor.length > 0 && selectedMovie.actor[0] !== "" && (
                        <div className="col-span-2 line-clamp-1">
                          <span className="font-bold text-white">Diễn viên:</span> {Array.isArray(selectedMovie.actor) ? selectedMovie.actor.join(', ') : selectedMovie.actor}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        className={`px-8 py-4 rounded-xl text-lg font-black flex items-center gap-3 transition-all outline-none ${
                          modalFocus === 'play'
                            ? 'bg-primary text-white scale-105 shadow-[0_0_20px_rgba(229,9,127,0.8)] border-2 border-white'
                            : 'bg-primary/95 text-white'
                        }`}
                      >
                        <Play size={24} fill="currentColor" />
                        XEM NGAY
                      </button>

                      <button
                        className={`px-8 py-4 rounded-xl text-lg font-black flex items-center gap-3 transition-all outline-none ${
                          modalFocus === 'favorite'
                            ? 'bg-white text-black scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)] border-2 border-primary'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        {favorites.some(f => f._id === selectedMovie._id) ? (
                          <>
                            <Check size={24} className="text-primary" />
                            ĐÃ LƯU YÊU THÍCH
                          </>
                        ) : (
                          <>
                            <Heart size={24} />
                            THÊM VÀO YÊU THÍCH
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Episodes List Section */}
                  {selectedMovie.episodes && selectedMovie.episodes.length > 0 && (
                    <div className="space-y-4 pt-8 border-t border-white/5">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles size={20} className="text-primary" />
                        CHỌN TẬP PHIM (Dùng D-Pad TV)
                      </h3>

                      <div className="grid grid-cols-6 gap-3 max-h-[22vh] overflow-y-auto pr-2">
                        {selectedMovie.episodes[selectedServerIdx]?.server_data.map((ep, idx) => {
                          const isFocused = modalFocus === 'episodes' && focusedEpisodeIdx === idx;
                          return (
                            <button
                              key={idx}
                              id={`tv-episode-${idx}`}
                              onClick={() => playEpisode(ep.link_embed, ep.name)}
                              className={`py-3 px-2 rounded-xl font-bold text-sm transition-all outline-none border ${
                                isFocused
                                  ? 'bg-primary border-white text-white scale-105 shadow-[0_0_15px_rgba(229,9,127,0.6)]'
                                  : 'bg-[#1c1c1c] border-white/5 text-white hover:border-primary/50'
                              }`}
                            >
                              Tập {ep.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL-SCREEN TV CINEMA PLAYER */}
      {currentSection === 'player' && activePlayerUrl && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Top control bar overlay */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-6 z-10 flex items-center justify-between">
            <button 
              onClick={() => {
                setActivePlayerUrl(null);
                setCurrentSection('detail_modal');
              }}
              className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-3 transition-all"
            >
              <ArrowLeft size={24} />
              Quay lại (Bấm Back/Escape)
            </button>
            <div className="text-right">
              <span className="text-lg font-black block">{selectedMovie?.name}</span>
              <span className="text-sm text-primary font-bold">Đang Phát: Tập {activeEpisodeName}</span>
            </div>
          </div>

          {/* Embedded Fullscreen Video Player */}
          <div className="flex-1 w-full h-full">
            <iframe
              src={activePlayerUrl}
              className="w-full h-full border-none"
              allowFullScreen
              allow="autoplay; encrypted-media"
              title="Netflop TV Cinema Player"
            />
          </div>
        </div>
      )}

    </div>
  );
}
