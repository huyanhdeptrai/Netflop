import React, { useState, useEffect, useRef } from 'react';
import { Search, Home, Film, Tv, Heart, LogOut, Play, Star, Calendar, Clock, Globe, ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchMovies, fetchCategoryMovies, fetchMovieDetail, getImageUrl, Movie, MovieDetail } from '../services/api';

interface TVAppProps {
  setTvMode: (mode: boolean) => void;
}

type Section = 'sidebar' | 'shelves' | 'detail_modal' | 'player' | 'search';

export default function TVApp({ setTvMode }: TVAppProps) {
  // Navigation State
  const [currentSection, setCurrentSection] = useState<Section>('shelves');
  const [sidebarIndex, setSidebarIndex] = useState(1); // 0: Search, 1: Home, 2: Series, 3: Movies, 4: Anime, 5: Favorites, 6: Exit
  const [activeShelf, setActiveShelf] = useState(0);
  const [activeMovieIdx, setActiveMovieIdx] = useState(0);
  
  // Movie Lists
  const [shelvesData, setShelvesData] = useState<{ title: string; movies: Movie[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);

  // Favorites
  const [favorites, setFavorites] = useState<Movie[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocusedIdx, setSearchFocusedIdx] = useState(0);

  // Detail Modal State
  const [selectedMovie, setSelectedMovie] = useState<MovieDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedServerIdx, setSelectedServerIdx] = useState(0);
  const [modalFocus, setModalFocus] = useState<'play' | 'favorite' | 'episodes'>('play');
  const [focusedEpisodeIdx, setFocusedEpisodeIdx] = useState(0);

  // Player State
  const [activePlayerUrl, setActivePlayerUrl] = useState<string | null>(null);
  const [activeEpisodeName, setActiveEpisodeName] = useState<string>('');

  // Refs for auto-scrolling shelves
  const shelfRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Category filters
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState<string>('home'); // 'home', 'phim-bo', 'phim-le', 'hoat-hinh', 'favorites'

  // Load Initial Data
  useEffect(() => {
    const loadTVData = async () => {
      setLoading(true);
      try {
        const [phimMoi, phimBo, phimLe, hoatHinh] = await Promise.all([
          fetchMovies(1),
          fetchCategoryMovies('phim-bo', 1),
          fetchCategoryMovies('phim-le', 1),
          fetchCategoryMovies('hoat-hinh', 1),
        ]);

        const shelves = [
          { title: 'Phim Mới Cập Nhật 🍿', movies: phimMoi.items?.slice(0, 15) || [] },
          { title: 'Phim Bộ Hot 🔥', movies: phimBo.data?.items?.slice(0, 15) || [] },
          { title: 'Phim Lẻ Chọn Lọc 🎬', movies: phimLe.data?.items?.slice(0, 15) || [] },
          { title: 'Hoạt Hình Đặc Sắc 🦄', movies: hoatHinh.data?.items?.slice(0, 15) || [] },
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

  // Update Hero Movie when active movie changes on the shelves
  useEffect(() => {
    if (currentSection === 'shelves' && shelvesData[activeShelf]?.movies[activeMovieIdx]) {
      setHeroMovie(shelvesData[activeShelf].movies[activeMovieIdx]);
    }
  }, [activeShelf, activeMovieIdx, currentSection, shelvesData]);

  // Handle Search Input changes
  useEffect(() => {
    if (currentSection !== 'search' || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(searchQuery)}&limit=12`);
        const data = await res.json();
        setSearchResults(data.data?.items || []);
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
            if (sidebarIndex < 6) setSidebarIndex(prev => prev + 1);
            break;
          case 'ArrowRight':
            // Switch back to shelves or search depending on sidebar position
            if (sidebarIndex === 0) {
              setCurrentSection('search');
            } else if (sidebarIndex === 5 && favorites.length === 0) {
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
        const currentShelfMovies = shelvesData[activeShelf]?.movies || [];
        switch (e.key) {
          case 'ArrowLeft':
            if (activeMovieIdx > 0) {
              setActiveMovieIdx(prev => prev - 1);
            } else {
              // Move focus to sidebar
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
              // Safe-guard index
              const nextShelfMovies = shelvesData[activeShelf - 1]?.movies || [];
              if (activeMovieIdx >= nextShelfMovies.length) {
                setActiveMovieIdx(Math.max(0, nextShelfMovies.length - 1));
              }
            }
            break;
          case 'ArrowDown':
            if (activeShelf < shelvesData.length - 1) {
              setActiveShelf(prev => prev + 1);
              const nextShelfMovies = shelvesData[activeShelf + 1]?.movies || [];
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
        const inputEl = document.getElementById('tv-search-input');
        switch (e.key) {
          case 'ArrowLeft':
            if (document.activeElement === inputEl) {
              setCurrentSection('sidebar');
              setSidebarIndex(0);
            } else {
              if (searchFocusedIdx % 4 === 0) {
                // Focus back to input
                inputEl?.focus();
              } else {
                setSearchFocusedIdx(prev => Math.max(0, prev - 1));
              }
            }
            break;
          case 'ArrowRight':
            if (document.activeElement === inputEl) {
              if (searchResults.length > 0) {
                inputEl.blur();
                setSearchFocusedIdx(0);
              }
            } else {
              if (searchFocusedIdx < searchResults.length - 1) {
                setSearchFocusedIdx(prev => prev + 1);
              }
            }
            break;
          case 'ArrowDown':
            if (document.activeElement === inputEl) {
              if (searchResults.length > 0) {
                inputEl.blur();
                setSearchFocusedIdx(0);
              }
            } else {
              if (searchFocusedIdx + 4 < searchResults.length) {
                setSearchFocusedIdx(prev => prev + 4);
              }
            }
            break;
          case 'ArrowUp':
            if (document.activeElement !== inputEl) {
              if (searchFocusedIdx - 4 >= 0) {
                setSearchFocusedIdx(prev => prev - 4);
              } else {
                inputEl?.focus();
              }
            }
            break;
          case 'Enter':
            if (document.activeElement !== inputEl && searchResults[searchFocusedIdx]) {
              openMovieDetails(searchResults[searchFocusedIdx].slug);
            }
            break;
          case 'Backspace':
          case 'Escape':
            if (document.activeElement === inputEl) {
              inputEl.blur();
            } else {
              setCurrentSection('shelves');
            }
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
              // Play first episode
              if (episodes.length > 0) {
                playEpisode(episodes[0].link_embed, episodes[0].name);
              } else {
                alert('Phim chưa có tập phát sóng bro ơi!');
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
    shelvesData,
    favorites,
    searchQuery,
    searchResults,
    searchFocusedIdx,
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
      } else if (idx === 5) { // Favorites
        setCurrentCategoryFilter('favorites');
        setShelvesData([
          { title: 'Phim Bạn Đã Lưu Yêu Thích ❤️', movies: favorites },
        ]);
        if (favorites.length > 0) {
          setCurrentSection('shelves');
        } else {
          setCurrentSection('sidebar');
        }
      } else if (idx === 6) { // Exit
        setTvMode(false);
      } else if (idx === 0) { // Search
        setCurrentSection('search');
        setTimeout(() => {
          document.getElementById('tv-search-input')?.focus();
        }, 100);
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
  };

  // Helper to highlight sidebar item selection
  const sidebarItems = [
    { icon: Search, label: 'Tìm Kiếm' },
    { icon: Home, label: 'Trang Chủ' },
    { icon: Film, label: 'Phim Bộ' },
    { icon: Film, label: 'Phim Lẻ' },
    { icon: Tv, label: 'Hoạt Hình' },
    { icon: Heart, label: 'Yêu Thích' },
    { icon: LogOut, label: 'Thoát TV Mode' },
  ];

  return (
    <div className="bg-[#121212] min-h-screen text-white font-sans overflow-hidden select-none relative">
      {/* Background Poster Trailer Blur Background */}
      <div className="absolute top-0 right-0 w-[80vw] h-[75vh] opacity-25 pointer-events-none transition-all duration-1000">
        {heroMovie && (
          <>
            <img
              src={getImageUrl(heroMovie.poster_url)}
              alt=""
              className="w-full h-full object-cover blur-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#121212] to-transparent" />
          </>
        )}
      </div>

      {/* Main Container */}
      <div className="flex h-screen w-screen overflow-hidden">
        
        {/* Left Sidebar Menu (Netflix TV style) */}
        <aside 
          className={`flex flex-col bg-[#0b0b0b] border-r border-white/5 h-full z-30 transition-all duration-300 shrink-0 ${
            currentSection === 'sidebar' ? 'w-[260px] shadow-2xl shadow-primary/10' : 'w-[80px]'
          }`}
        >
          {/* Netflop Logo */}
          <div className="p-6 flex items-center justify-center border-b border-white/5 h-20 shrink-0 overflow-hidden">
            <span className={`font-black text-primary tracking-tighter transition-all duration-300 ${
              currentSection === 'sidebar' ? 'text-3xl' : 'text-xl'
            }`}>
              {currentSection === 'sidebar' ? 'NETFLOP' : 'NF'}
            </span>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 flex flex-col justify-center gap-2 p-3 overflow-y-auto">
            {sidebarItems.map((item, idx) => {
              const isSelected = sidebarIndex === idx;
              const isFocused = currentSection === 'sidebar' && isSelected;
              const Icon = item.icon;

              return (
                <button
                  key={idx}
                  onClick={() => handleSidebarSelect(idx)}
                  className={`flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all duration-300 text-left outline-none ${
                    isFocused 
                      ? 'bg-primary text-white scale-105 shadow-[0_0_20px_rgba(229,9,127,0.5)]' 
                      : isSelected
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-text-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={22} className={isFocused ? 'animate-pulse' : ''} />
                  <span className={`text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                    currentSection === 'sidebar' ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-75 -translate-x-10 w-0'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Indicator Tip for TV Remote */}
          <div className="p-4 border-t border-white/5 text-center text-[10px] text-text-muted select-none shrink-0 overflow-hidden">
            {currentSection === 'sidebar' ? (
              <p className="animate-pulse">Dùng Arrow ➡️ để chọn phim</p>
            ) : (
              <p>⬅️ Menu</p>
            )}
          </div>
        </aside>

        {/* Content Showcase Panel */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* SEARCH PAGE VIEW */}
          {currentSection === 'search' && (
            <div className="flex-1 flex flex-col p-8 bg-[#121212]/90 z-20 overflow-y-auto">
              <div className="max-w-4xl mx-auto w-full">
                <h1 className="text-3xl font-black mb-6 flex items-center gap-3">
                  <Search size={28} className="text-primary animate-bounce" />
                  TÌM KIẾM PHIM TRÊN SMART TV
                </h1>
                
                {/* Search Bar */}
                <div className="relative mb-8">
                  <input
                    id="tv-search-input"
                    type="text"
                    placeholder="Nhập tên phim cần tìm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1c1c1c] border-2 border-white/10 rounded-2xl py-4 px-6 pl-14 text-xl font-bold text-white focus:outline-none focus:border-primary transition-all"
                  />
                  <Search size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" />
                </div>

                {/* Search Results Grid */}
                {searchLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-4 gap-6">
                    {searchResults.map((movie, idx) => {
                      const isFocused = searchFocusedIdx === idx && document.activeElement !== document.getElementById('tv-search-input');
                      return (
                        <div
                          key={movie._id}
                          onClick={() => openMovieDetails(movie.slug)}
                          className={`bg-surface rounded-xl overflow-hidden cursor-pointer transition-all duration-300 relative aspect-[2/3] border-2 group ${
                            isFocused 
                              ? 'scale-105 border-primary shadow-[0_0_20px_rgba(229,9,127,0.8)]' 
                              : 'border-white/5'
                          }`}
                        >
                          <img
                            src={getImageUrl(movie.poster_url)}
                            alt={movie.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-end">
                            <h3 className="font-bold text-sm line-clamp-2">{movie.name}</h3>
                            <p className="text-xs text-text-muted">{movie.year}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-lg text-text-muted">Không tìm thấy phim phù hợp rồi bro ơi!</p>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-lg text-text-muted">Nhập từ khóa hoặc dùng bàn phím TV để gõ tìm phim.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HOME / SHELVES VIEW */}
          {currentSection !== 'search' && (
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
                  shelvesData.map((shelf, sIdx) => {
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
                                />
                                
                                {/* Poster Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent p-3 flex flex-col justify-end">
                                  <h3 className="font-bold text-xs line-clamp-2 text-white">{movie.name}</h3>
                                  <p className="text-[10px] text-text-muted mt-1">{movie.year}</p>
                                </div>
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

                      <div className="grid grid-cols-6 gap-3 max-h-[25vh] overflow-y-auto pr-2">
                        {selectedMovie.episodes[selectedServerIdx]?.server_data.map((ep, idx) => {
                          const isFocused = modalFocus === 'episodes' && focusedEpisodeIdx === idx;
                          return (
                            <button
                              key={idx}
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

      {/* TV Mode floating notice / tip */}
      <div className="fixed bottom-6 right-6 bg-primary/20 border border-primary/30 py-2 px-4 rounded-full text-xs font-bold text-primary flex items-center gap-2 pointer-events-none z-30 shadow-lg backdrop-blur-md">
        <Sparkles size={14} className="animate-spin" />
        CHẾ ĐỘ SMART TV: Sử dụng bàn phím / remote để di chuyển
      </div>
    </div>
  );
}
