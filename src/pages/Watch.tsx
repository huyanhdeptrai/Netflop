import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { fetchMovieDetail, MovieDetail, cn, fetchCategoryMovies, Movie, getImageUrl, fetchGenreMovies, fetchMovies } from '../services/api';
import { List, ChevronRight, Info, Sparkles, ChevronsRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useHistory } from '../services/HistoryContext';
import CommentSection from '../components/CommentSection';

export default function Watch() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const currentEpSlug = searchParams.get('ep');
  const currentSvIndex = parseInt(searchParams.get('sv') || '0');
  const timeParam = searchParams.get('t');
  
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentEpisode, setCurrentEpisode] = useState<any>(null);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [showControls, setShowControls] = useState(true);
  const { updateHistory, history } = useHistory();
  const progressRef = useRef<number>(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentServer = movie?.episodes?.[currentSvIndex];
  const episodes = currentServer?.server_data || [];
  const currentIndex = episodes.findIndex((ep: any) => ep.slug === currentEpisode?.slug);
  const nextEpisode = episodes[currentIndex + 1];
  const isSeries = movie?.type === 'series' || (movie?.episodes?.[0]?.server_data?.length || 0) > 1;
  const showNextButton = isSeries && nextEpisode;

  // Handle idle state for controls
  useEffect(() => {
    const resetTimer = () => {
      setShowControls(true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const loadDetail = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await fetchMovieDetail(slug);
        const movieData = { ...data.movie, episodes: data.episodes };
        setMovie(movieData);
        
        // Select episode and server
        if (movieData.episodes && movieData.episodes.length > 0) {
          const server = movieData.episodes[currentSvIndex] || movieData.episodes[0];
          const ep = currentEpSlug 
            ? server.server_data.find((e: any) => e.slug === currentEpSlug)
            : server.server_data[0];
          setCurrentEpisode(ep || server.server_data[0]);

          // Restore progress from history or URL
          const existing = history.find(h => h._id === movieData._id);
          if (timeParam) {
            progressRef.current = parseInt(timeParam);
          } else if (existing && existing.episodeSlug === ep.slug) {
            progressRef.current = existing.currentTime;
          } else {
            progressRef.current = 0;
          }

          // Robust fetching for related movies
          const fetchRelated = async () => {
            try {
              let items: Movie[] = [];
              
              // 1. Try by genre first
              if (movieData.category && movieData.category.length > 0) {
                const genreSlug = movieData.category[0].slug;
                const genreData = await fetchGenreMovies(genreSlug, 1);
                if (genreData.data?.items?.length > 0) {
                  items = genreData.data.items;
                }
              }

              // 2. If no genre items, try by type
              if (items.length === 0) {
                const typeMap: Record<string, string> = {
                  'series': 'phim-bo',
                  'single': 'phim-le',
                  'hoathinh': 'hoat-hinh',
                  'tvshows': 'tv-shows'
                };
                const typeSlug = typeMap[movieData.type] || 'phim-moi';
                const typeData = await fetchCategoryMovies(typeSlug, 1);
                if (typeData.data?.items?.length > 0) {
                  items = typeData.data.items;
                }
              }

              // 3. Final fallback: Latest movies
              if (items.length === 0) {
                const latestData = await fetchMovies(1);
                if (latestData.items?.length > 0) {
                  items = latestData.items;
                }
              }

              const filtered = items
                .filter((m: Movie) => m.slug !== slug)
                .slice(0, 8);
              setRelatedMovies(filtered);
            } catch (err) {
              console.error('Failed to fetch related movies:', err);
              // Fallback to latest on error
              fetchMovies(1).then(d => setRelatedMovies(d.items?.slice(0, 8) || []));
            }
          };

          fetchRelated();
        }
      } catch (error) {
        console.error('Failed to fetch movie detail:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
    window.scrollTo(0, 0);
  }, [slug, currentEpSlug, currentSvIndex]);

  // Helper to parse duration string (e.g., "45 phút", "120 phút", "2 giờ")
  const parseDuration = (timeStr: string): number => {
    if (!timeStr) return 2700; // Default 45 mins
    const minutesMatch = timeStr.match(/(\d+)\s*phút/i);
    if (minutesMatch) return parseInt(minutesMatch[1]) * 60;
    const hoursMatch = timeStr.match(/(\d+)\s*giờ/i);
    if (hoursMatch) return parseInt(hoursMatch[1]) * 3600;
    const fallbackMatch = timeStr.match(/(\d+)/);
    if (fallbackMatch) return parseInt(fallbackMatch[1]) * 60;
    return 2700;
  };

  // Mock progress tracking
  useEffect(() => {
    if (!movie || !currentEpisode) return;

    const saveProgress = () => {
      const duration = parseDuration(movie.time);
      const progress = Math.min(100, (progressRef.current / duration) * 100);
      const server = movie.episodes?.[currentSvIndex];

      updateHistory({
        ...movie,
        currentTime: progressRef.current,
        duration: duration,
        progress: progress,
        lastUpdated: Date.now(),
        episodeSlug: currentEpisode.slug,
        episodeName: currentEpisode.name,
        serverName: server?.server_name,
        isSeries: movie.type === 'series' || (movie.episodes?.[0]?.server_data?.length || 0) > 1,
        episodes: movie.episodes
      });
    };

    const interval = setInterval(() => {
      progressRef.current += 5; // Increment by 5s every 5s
      saveProgress();
    }, 5000);

    // Capture beforeunload to save last timestamp
    const handleBeforeUnload = () => {
      saveProgress();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveProgress(); // Also save on component unmount
    };
  }, [movie, currentEpisode, currentSvIndex]);

  if (loading) {
    return (
      <div className="pt-24 px-4 max-w-7xl mx-auto">
        <div className="aspect-video skeleton rounded-2xl mb-8" />
        <div className="h-10 w-1/3 skeleton rounded-lg mb-4" />
        <div className="h-20 w-full skeleton rounded-lg" />
      </div>
    );
  }

  if (!movie || !currentEpisode) return <div className="pt-24 text-center">Không tìm thấy tập phim.</div>;

  const embedUrl = currentEpisode.link_embed;
  const finalUrl = timeParam 
    ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}t=${timeParam}` 
    : embedUrl;

  return (
    <div className="pb-20">
      <div className="max-w-7xl mx-auto px-0 sm:px-4 pt-16 sm:pt-24">
        {/* Breadcrumb - Hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted mb-6 px-4 sm:px-0">
          <Link to="/" className="hover:text-primary">Trang chủ</Link>
          <ChevronRight size={12} />
          <Link to={`/movie/${movie.slug}`} className="hover:text-primary">{movie.name}</Link>
          <ChevronRight size={12} />
          <span className="text-primary font-bold">Tập {currentEpisode.name}</span>
          {currentServer && (
            <>
              <ChevronRight size={12} />
              <span className="text-text-muted">({currentServer.server_name})</span>
            </>
          )}
        </div>

        {/* Player Container */}
        <div className="bg-black sm:rounded-2xl overflow-hidden shadow-2xl border-y sm:border border-white/5 mb-4 sm:mb-8">
          <div className="aspect-video relative group">
            <iframe
              src={finalUrl}
              className="w-full h-full"
              allowFullScreen
              frameBorder="0"
            />

            {/* Next Episode Overlay Button */}
            <AnimatePresence>
              {showNextButton && showControls && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-[10px] sm:top-[20px] right-[10px] sm:right-[20px] z-50"
                >
                  <Link
                    to={`/watch/${movie.slug}?ep=${nextEpisode.slug}&sv=${currentSvIndex}`}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-white font-bold text-xs sm:text-sm transition-all hover:bg-[#E5097F] hover:shadow-[0_0_20px_rgba(229,9,127,0.6)] group/btn"
                  >
                    <span className="tracking-wide">Tập tiếp theo</span>
                    <ChevronsRight size={16} className="sm:w-[18px] sm:h-[18px] transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="px-4 sm:px-0">
          {/* Server/Version Selection below player */}
          <div className="bg-surface p-3 sm:p-4 rounded-2xl border border-white/5 mb-6 sm:mb-8 flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <span className="text-text-muted">Đang phát:</span>
              <span className="text-primary">Tập {currentEpisode.name}</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="flex flex-wrap gap-2">
              {movie.episodes?.map((server, idx) => (
                <Link
                  key={server.server_name}
                  to={`/watch/${movie.slug}?ep=${currentEpisode.slug}&sv=${idx}`}
                  className={cn(
                    "px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all border",
                    currentSvIndex === idx 
                      ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(229,9,127,0.3)]" 
                      : "bg-background border-white/5 text-text-muted hover:text-white hover:border-primary/50"
                  )}
                >
                  {server.server_name}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black mb-1 sm:mb-2">{movie.name}</h1>
                <p className="text-primary font-bold text-sm sm:text-base">Tập {currentEpisode.name} - {currentServer?.server_name}</p>
              </div>

              {/* Episode Selection */}
              <section className="bg-surface p-4 sm:p-6 rounded-2xl border border-white/5">
                <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2">
                  <List size={18} className="text-primary sm:w-5 sm:h-5" />
                  Danh sách tập
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {currentServer?.server_data.map((ep: any) => (
                    <Link
                      key={ep.slug}
                      to={`/watch/${movie.slug}?ep=${ep.slug}&sv=${currentSvIndex}`}
                      className={cn(
                        "text-center py-2 rounded-lg text-xs sm:text-sm font-bold transition-all border",
                        currentEpisode.slug === ep.slug 
                          ? "bg-primary/20 border-primary text-primary" 
                          : "bg-background border-white/5 hover:border-primary/50"
                      )}
                    >
                      {ep.name}
                    </Link>
                  ))}
                </div>
              </section>

            {/* Comments Section */}
            <CommentSection movieId={movie._id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <section className="bg-surface p-6 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Info size={20} className="text-primary" />
                Thông tin phim
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Năm:</span>
                  <span>{movie.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Quốc gia:</span>
                  <span>{movie.country?.[0]?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Chất lượng:</span>
                  <span className="text-primary">{movie.quality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Ngôn ngữ:</span>
                  <span>{movie.lang}</span>
                </div>
              </div>
            </section>

            {/* Related Movies Section */}
            <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-primary" />
                Phim Đề Xuất
              </h3>
              <div className="space-y-4">
                {relatedMovies.length > 0 ? (
                  relatedMovies.map((m) => (
                    <Link 
                      key={m._id} 
                      to={`/movie/${m.slug}`}
                      className="flex gap-3 group cursor-pointer"
                    >
                      <div className="w-24 aspect-[2/3] rounded-lg overflow-hidden shrink-0 border border-white/5">
                        <img 
                          src={getImageUrl(m.poster_url)} 
                          alt={m.name} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 py-1">
                        <h4 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors">
                          {m.name}
                        </h4>
                        <p className="text-xs text-text-muted mt-1">
                          {m.year} • {movie.category?.[0]?.name || 'Phim'}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-24 aspect-[2/3] bg-surface rounded-lg shrink-0" />
                      <div className="flex-1 py-1 space-y-2">
                        <div className="h-4 bg-surface rounded w-full" />
                        <div className="h-3 bg-surface rounded w-1/2" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
