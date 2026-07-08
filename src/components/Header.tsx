import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, User, Menu, X, History, Trash2, Loader2, Sparkles, ChevronRight, Tv } from 'lucide-react';
import { cn, searchMovies, Movie, getImageUrl, GENRES, COUNTRIES } from '../services/api';
import { useHistory } from '../services/HistoryContext';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onEnterTvMode?: () => void;
}

export default function Header({ onEnterTvMode }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveResults, setLiveResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileGenresOpen, setIsMobileGenresOpen] = useState(false);
  const [isMobileCountriesOpen, setIsMobileCountriesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { history, removeFromHistory } = useHistory();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setShowDropdown(false);
  }, [location]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setLiveResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchMovies(searchQuery.trim());
        if (data.data?.items) {
          setLiveResults(data.data.items.slice(0, 5));
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Live search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
      setShowDropdown(false);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={i} className="text-primary font-black">{part}</span> 
        : part
    );
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "glass h-16" : "bg-transparent h-20"
    )}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-primary text-3xl font-black tracking-tighter">
            NETFLOP
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <Link to="/category/phim-bo" className="hover:text-primary transition-colors">Phim bộ</Link>
            <Link to="/category/phim-le" className="hover:text-primary transition-colors">Phim lẻ</Link>
            <Link to="/category/hoat-hinh" className="hover:text-primary transition-colors">Hoạt hình</Link>
            <Link to="/category/tv-shows" className="hover:text-primary transition-colors">TV Shows</Link>
            
            {/* Thể loại Dropdown */}
            <div className="relative group py-5 cursor-pointer">
              <span className="hover:text-primary transition-colors flex items-center gap-1">
                Thể loại
                <svg className="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 shadow-2xl hidden group-hover:block w-[450px] z-50">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {GENRES.map(genre => (
                    <Link
                      key={genre.slug}
                      to={`/category/${genre.slug}`}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors hover:text-primary"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Quốc gia Dropdown */}
            <div className="relative group py-5 cursor-pointer">
              <span className="hover:text-primary transition-colors flex items-center gap-1">
                Quốc gia
                <svg className="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 shadow-2xl hidden group-hover:block w-[320px] z-50">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {COUNTRIES.map(country => (
                    <Link
                      key={country.slug}
                      to={`/category/${country.slug}`}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors hover:text-primary"
                    >
                      {country.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm phim..."
                className="bg-[#1F1F1F] border border-white/10 rounded-full py-1.5 pl-4 pr-10 text-sm focus:outline-none focus:border-primary transition-all w-48 lg:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowDropdown(true)}
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary">
                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </form>

            {/* Live Search Dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-[-1]" 
                    onClick={() => setShowDropdown(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[320px]"
                  >
                    <div className="p-2">
                      {liveResults.length > 0 ? (
                        <>
                          <div className="space-y-1">
                            {liveResults.map((movie) => (
                              <Link
                                key={movie._id}
                                to={`/movie/${movie.slug}`}
                                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors group"
                                onClick={() => setShowDropdown(false)}
                              >
                                <div className="w-12 aspect-[2/3] rounded-lg overflow-hidden shrink-0 border border-white/5">
                                  <img 
                                    src={getImageUrl(movie.poster_url)} 
                                    alt={movie.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                                    {highlightText(movie.name, searchQuery)}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-text-muted">{movie.year}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-text-muted">Phim</span>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                          <button
                            onClick={handleSearch}
                            className="w-full mt-2 p-2 text-xs font-black text-primary hover:bg-primary/10 rounded-xl transition-all flex items-center justify-center gap-2 border-t border-white/5"
                          >
                            XEM TẤT CẢ KẾT QUẢ CHO "{searchQuery}"
                            <Sparkles size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="p-8 text-center">
                          <Search size={32} className="mx-auto text-text-muted opacity-20 mb-2" />
                          <p className="text-xs text-text-muted">Không có phim rồi bro ơi</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <Link to="/favorites" title="Yêu thích" className="p-2 hover:text-primary transition-colors">
            <Heart size={20} />
          </Link>

          <div 
            className="relative"
            onMouseEnter={() => setIsHistoryOpen(true)}
            onMouseLeave={() => setIsHistoryOpen(false)}
          >
            <Link 
              to="/resume"
              title="Xem tiếp"
              className="p-2 hover:text-primary transition-colors block"
            >
              <History size={20} className={cn("transition-all", isHistoryOpen && "text-primary drop-shadow-[0_0_8px_rgba(229,9,127,0.5)]")} />
            </Link>

            <AnimatePresence>
              {isHistoryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full pt-2 w-80 z-50 pointer-events-auto"
                >
                  <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <h3 className="font-bold text-sm">Xem gần đây</h3>
                      <Link to="/resume" className="text-xs text-primary hover:underline">Xem tất cả</Link>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {history.length > 0 ? (
                        <div className="divide-y divide-white/5">
                          {history.slice(0, 4).map((item) => (
                            <div key={item._id} className="p-3 hover:bg-white/5 transition-colors group relative">
                              <Link to={`/movie/${item.slug}`} className="flex gap-3">
                                <div className="w-20 aspect-video rounded-lg overflow-hidden shrink-0 relative">
                                  <img src={item.thumb_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                                    <div className="h-full bg-primary" style={{ width: `${item.progress}%` }} />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-bold truncate group-hover:text-primary transition-colors">{item.name}</h4>
                                  <p className="text-[10px] text-text-muted mt-1">
                                    {item.isSeries ? (
                                      <>Tập {item.episodeName} {item.serverName && <span className="opacity-60">({item.serverName})</span>}</>
                                    ) : (
                                      <>{`Còn ${Math.max(0, Math.round((item.duration - item.currentTime) / 60))} phút`} {item.serverName && <span className="opacity-60">({item.serverName})</span>}</>
                                    )}
                                  </p>
                                </div>
                              </Link>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeFromHistory(item._id);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 hover:bg-primary transition-all text-white"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <History size={32} className="mx-auto text-text-muted opacity-20 mb-2" />
                          <p className="text-xs text-text-muted">Chưa có lịch sử xem</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <Link 
            to="/account"
            title="Tài khoản"
            className="p-2 hover:text-primary transition-colors"
          >
            <User size={20} />
          </Link>



          <button 
            className="md:hidden p-2 hover:text-primary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 h-[100dvh] w-[280px] bg-[#1F1F1F] z-50 md:hidden flex flex-col shadow-2xl border-l border-white/5"
            >
              <div className="p-4 flex items-center justify-between border-b border-white/5 bg-[#1F1F1F]">
                <span className="text-xl font-black text-primary tracking-tighter">NETFLOP</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#1F1F1F]">
                {/* Mobile Search */}
                <div className="relative">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                      type="text"
                      placeholder="Tìm phim..."
                      className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={18} className="animate-spin text-primary" />
                      </div>
                    )}
                  </form>

                  {/* Mobile Live Search Dropdown */}
                  <AnimatePresence>
                    {showDropdown && liveResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#141414] border border-white/10 rounded-xl shadow-2xl z-50 max-h-[50vh] overflow-y-auto"
                      >
                        <div className="p-2 space-y-1">
                          {liveResults.map((movie) => (
                            <Link
                              key={movie._id}
                              to={`/movie/${movie.slug}`}
                              onClick={() => {
                                setShowDropdown(false);
                                setIsMenuOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group"
                            >
                              <div className="w-12 h-16 rounded overflow-hidden shrink-0">
                                <img
                                  src={getImageUrl(movie.poster_url)}
                                  alt={movie.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex-1 min-w-0 py-1 text-left">
                                <h4 className="text-sm font-bold truncate text-white group-hover:text-primary transition-colors">
                                  {highlightText(movie.name, searchQuery)}
                                </h4>
                                <p className="text-xs text-text-muted mt-1">
                                  {movie.year} • {movie.category?.[0]?.name || 'Phim'}
                                </p>
                              </div>
                            </Link>
                          ))}
                          <button
                            onClick={handleSearch}
                            className="w-full mt-1 p-3 text-xs font-black text-primary hover:bg-primary/10 rounded-lg transition-all border-t border-white/5"
                          >
                            XEM TẤT CẢ KẾT QUẢ...
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <nav className="flex flex-col gap-2 text-left">
                  <Link 
                    to="/" 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl font-bold transition-all",
                      location.pathname === '/' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-white/5 hover:text-white"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Trang chủ
                    <ChevronRight size={16} className="opacity-50" />
                  </Link>
                  <Link 
                    to="/category/phim-bo" 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl font-bold transition-all",
                      location.pathname === '/category/phim-bo' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-white/5 hover:text-white"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Phim bộ
                    <ChevronRight size={16} className="opacity-50" />
                  </Link>
                  <Link 
                    to="/category/phim-le" 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl font-bold transition-all",
                      location.pathname === '/category/phim-le' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-white/5 hover:text-white"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Phim lẻ
                    <ChevronRight size={16} className="opacity-50" />
                  </Link>
                  <Link 
                    to="/category/hoat-hinh" 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl font-bold transition-all",
                      location.pathname === '/category/hoat-hinh' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-white/5 hover:text-white"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Hoạt hình
                    <ChevronRight size={16} className="opacity-50" />
                  </Link>
                  <Link 
                    to="/category/tv-shows" 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl font-bold transition-all",
                      location.pathname === '/category/tv-shows' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-white/5 hover:text-white"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    TV Shows
                    <ChevronRight size={16} className="opacity-50" />
                  </Link>

                  {/* Mobile Thể loại Accordion */}
                  <div className="space-y-1">
                    <button
                      onClick={() => setIsMobileGenresOpen(!isMobileGenresOpen)}
                      className="w-full flex items-center justify-between p-3 rounded-xl font-bold transition-all text-text-muted hover:bg-white/5 hover:text-white"
                    >
                      <span>Thể loại</span>
                      <ChevronRight size={16} className={cn("transition-transform duration-300 opacity-50", isMobileGenresOpen && "rotate-90")} />
                    </button>
                    <AnimatePresence>
                      {isMobileGenresOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-black/20 rounded-xl pl-3"
                        >
                          <div className="grid grid-cols-2 gap-1 p-2 text-xs">
                            {GENRES.map(genre => (
                              <Link
                                key={genre.slug}
                                to={`/category/${genre.slug}`}
                                className="p-2 text-text-muted hover:text-primary transition-colors text-left"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {genre.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Mobile Quốc gia Accordion */}
                  <div className="space-y-1">
                    <button
                      onClick={() => setIsMobileCountriesOpen(!isMobileCountriesOpen)}
                      className="w-full flex items-center justify-between p-3 rounded-xl font-bold transition-all text-text-muted hover:bg-white/5 hover:text-white"
                    >
                      <span>Quốc gia</span>
                      <ChevronRight size={16} className={cn("transition-transform duration-300 opacity-50", isMobileCountriesOpen && "rotate-90")} />
                    </button>
                    <AnimatePresence>
                      {isMobileCountriesOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-black/20 rounded-xl pl-3"
                        >
                          <div className="grid grid-cols-2 gap-1 p-2 text-xs">
                            {COUNTRIES.map(country => (
                              <Link
                                key={country.slug}
                                to={`/category/${country.slug}`}
                                className="p-2 text-text-muted hover:text-primary transition-colors text-left"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {country.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </nav>
              </div>

              <div className="p-4 border-t border-white/5 bg-[#1F1F1F] space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Link 
                    to="/favorites" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <Heart size={20} />
                    </div>
                    <span className="text-[10px] font-bold">Yêu thích</span>
                  </Link>
                  <Link 
                    to="/resume" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <History size={20} />
                    </div>
                    <span className="text-[10px] font-bold">Lịch sử</span>
                  </Link>
                  <Link 
                    to="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <span className="text-[10px] font-bold">Cá nhân</span>
                  </Link>
                </div>


              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
