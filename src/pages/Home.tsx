import React, { useEffect, useState } from 'react';
import { fetchMovies, fetchCategoryMovies, Movie } from '../services/api';
import MovieCard from '../components/MovieCard';
import { ChevronRight, ChevronLeft, Play, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useHistory } from '../services/HistoryContext';

export default function Home() {
  const [newMovies, setNewMovies] = useState<Movie[]>([]);
  const [seriesMovies, setSeriesMovies] = useState<Movie[]>([]);
  const [singleMovies, setSingleMovies] = useState<Movie[]>([]);
  const [animeMovies, setAnimeMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const { history, removeFromHistory } = useHistory();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [newData, seriesData, singleData, animeData] = await Promise.all([
          fetchMovies(1),
          fetchCategoryMovies('phim-bo', 1),
          fetchCategoryMovies('phim-le', 1),
          fetchCategoryMovies('hoat-hinh', 1)
        ]);

        setNewMovies(newData.items);
        setSeriesMovies(seriesData.data.items.slice(0, 6));
        setSingleMovies(singleData.data.items.slice(0, 6));
        setAnimeMovies(animeData.data.items.slice(0, 6));

        if (newData.items.length > 0) {
          setHeroMovie(newData.items[Math.floor(Math.random() * 5)]);
        }
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <div className="h-[60vh] skeleton rounded-2xl mb-12" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/3] skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Hero Banner */}
      {heroMovie && (
        <section className="relative h-[60vh] sm:h-[80vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroMovie.thumb_url}
              alt={heroMovie.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 pb-12 sm:pb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-3 sm:mb-4 leading-tight">
                {heroMovie.name}
              </h1>
              <p className="text-text-muted text-sm sm:text-base md:text-lg mb-6 sm:mb-8 line-clamp-2 sm:line-clamp-3">
                {heroMovie.origin_name} ({heroMovie.year}) - Khám phá bộ phim hấp dẫn nhất hiện nay trên Netflop. Trải nghiệm chất lượng hình ảnh sắc nét và âm thanh sống động.
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <Link to={`/movie/${heroMovie.slug}`} className="btn-primary flex items-center gap-2 text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3">
                  <Play size={18} fill="currentColor" className="sm:w-5 sm:h-5" />
                  XEM NGAY
                </Link>
                <Link to={`/movie/${heroMovie.slug}`} className="btn-secondary flex items-center gap-2 text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3">
                  <Info size={18} className="sm:w-5 sm:h-5" />
                  CHI TIẾT
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Movie Sections */}
      <div className="max-w-7xl mx-auto px-4 mt-12 space-y-12">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Phim Mới Cập Nhật
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {newMovies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </section>

        {/* Continue Watching Section */}
        {history.length > 0 && (
          <section className="relative group/section">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="w-1 h-8 bg-primary rounded-full" />
                Tiếp Tục Xem
              </h2>
              <Link to="/resume" className="text-primary text-sm font-bold hover:underline">
                Xem tất cả
              </Link>
            </div>
            
            <div className="relative">
              {/* Navigation Arrows */}
              <button 
                onClick={() => {
                  const el = document.getElementById('history-scroll');
                  if (el) el.scrollBy({ left: -400, behavior: 'smooth' });
                }}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 border border-white/10 hidden sm:flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-opacity hover:bg-primary text-white"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button 
                onClick={() => {
                  const el = document.getElementById('history-scroll');
                  if (el) el.scrollBy({ left: 400, behavior: 'smooth' });
                }}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 border border-white/10 hidden sm:flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-opacity hover:bg-primary text-white"
              >
                <ChevronRight size={24} />
              </button>

              <div 
                id="history-scroll"
                className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
              >
                {history.slice(0, 10).map((movie) => (
                  <div key={movie._id} className="min-w-[220px] sm:min-w-[280px] group cursor-pointer relative">
                    <div className="relative">
                      <Link 
                        to={`/watch/${movie.slug}?ep=${movie.episodeSlug || ''}&t=${Math.floor(movie.currentTime || 0)}`}
                        className="block aspect-video relative rounded-xl overflow-hidden mb-3 border border-white/5"
                      >
                        <img 
                          src={movie.thumb_url} 
                          alt={movie.name} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(229,9,127,0.5)]">
                            <Play className="text-white fill-white ml-1" size={24} />
                          </div>
                          <span className="text-xs font-bold text-white uppercase tracking-wider">Tiếp tục</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#333333]">
                          <div 
                            className="h-full bg-primary shadow-[0_0_10px_rgba(229,9,127,0.8)]" 
                            style={{ width: `${movie.progress}%` }} 
                          />
                        </div>
                      </Link>
                      
                      <Link to={`/movie/${movie.slug}`}>
                        <h3 className="font-bold text-sm line-clamp-1 hover:text-primary transition-colors mt-3">{movie.name}</h3>
                      </Link>
                      
                      <div className="flex flex-col gap-0.5 mt-1">
                        <p className="text-[11px] text-text-muted line-clamp-1">
                          {movie.year} • {movie.origin_name}
                        </p>
                        <p className="text-[11px] text-primary font-medium">
                          {movie.isSeries ? (
                            <>Đang xem: <span className="text-white">Tập {movie.episodeName}</span> {movie.serverName && <span className="text-[10px] opacity-50">({movie.serverName})</span>}</>
                          ) : (
                            <>{`Còn lại ${Math.max(0, Math.round((movie.duration - movie.currentTime) / 60))} phút`} {movie.serverName && <span className="text-[10px] opacity-50">({movie.serverName})</span>}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Phim Bộ Mới
            </h2>
            <Link to="/category/phim-bo" className="text-primary text-sm font-bold hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {seriesMovies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Phim Lẻ Mới
            </h2>
            <Link to="/category/phim-le" className="text-primary text-sm font-bold hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {singleMovies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Hoạt Hình Đặc Sắc
            </h2>
            <Link to="/category/hoat-hinh" className="text-primary text-sm font-bold hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {animeMovies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
