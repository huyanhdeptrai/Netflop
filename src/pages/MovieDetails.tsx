import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchMovieDetail, MovieDetail, getImageUrl, cn, fetchGenreMovies, fetchCategoryMovies, fetchMovies, Movie } from '../services/api';
import { Play, Heart, Share2, Star, Calendar, Clock, Globe, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useFavorites } from '../services/FavoritesContext';
import { useHistory } from '../services/HistoryContext';

export default function MovieDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { history } = useHistory();

  const [selectedServerIndex, setSelectedServerIndex] = useState(0);

  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const loadDetail = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await fetchMovieDetail(slug);
        setMovie(data.movie);
        // The API structure for details usually has movie and episodes
        if (data.episodes) {
          setMovie({ ...data.movie, episodes: data.episodes });
          setSelectedServerIndex(0);
        }

        // Fetch related movies
        const fetchRelated = async () => {
          try {
            let items: Movie[] = [];
            const movieData = data.movie;
            
            if (movieData.category && movieData.category.length > 0) {
              const genreData = await fetchGenreMovies(movieData.category[0].slug, 1);
              if (genreData.data?.items?.length > 0) items = genreData.data.items;
            }

            if (items.length === 0) {
              const typeMap: Record<string, string> = {
                'series': 'phim-bo', 'single': 'phim-le', 'hoathinh': 'hoat-hinh', 'tvshows': 'tv-shows'
              };
              const typeData = await fetchCategoryMovies(typeMap[movieData.type] || 'phim-moi', 1);
              if (typeData.data?.items?.length > 0) items = typeData.data.items;
            }

            if (items.length === 0) {
              const latestData = await fetchMovies(1);
              if (latestData.items?.length > 0) items = latestData.items;
            }

            setRelatedMovies(items.filter((m: Movie) => m.slug !== slug).slice(0, 12));
          } catch (err) {
            console.error('Failed to fetch related movies:', err);
            fetchMovies(1).then(d => setRelatedMovies(d.items?.slice(0, 12) || []));
          }
        };
        fetchRelated();
      } catch (error) {
        console.error('Failed to fetch movie detail:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-24 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 aspect-[2/3] skeleton rounded-2xl" />
          <div className="flex-1 space-y-4">
            <div className="h-12 w-2/3 skeleton rounded-lg" />
            <div className="h-6 w-1/2 skeleton rounded-lg" />
            <div className="h-32 w-full skeleton rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) return <div className="pt-24 text-center">Không tìm thấy phim.</div>;

  const favorited = isFavorite(movie._id);
  const currentServer = movie.episodes?.[selectedServerIndex];
  const historyItem = history.find(item => item.slug === slug);

  let watchButtonText = "XEM PHIM";
  let watchLink = `/watch/${movie.slug}${currentServer ? `?ep=${currentServer.server_data[0].slug}&sv=${selectedServerIndex}` : ''}`;

  if (historyItem) {
    if (historyItem.progress >= 95) {
      watchButtonText = "XEM LẠI TỪ ĐẦU";
    } else {
      const epName = historyItem.episodeName || '1';
      const displayEp = epName.toLowerCase().startsWith('tập') ? epName : `Tập ${epName}`;
      watchButtonText = `TIẾP TỤC XEM: ${displayEp}`;
      watchLink = `/watch/${movie.slug}?ep=${historyItem.episodeSlug || ''}&sv=${selectedServerIndex}&t=${Math.floor(historyItem.currentTime || 0)}`;
    }
  }

  return (
    <div className="pb-20">
      {/* Backdrop */}
      <div className="relative h-[40vh] sm:h-[50vh] w-full overflow-hidden">
        <img
          src={movie.thumb_url}
          alt={movie.name}
          className="w-full h-full object-cover opacity-30 blur-sm"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-32 sm:-mt-64 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-48 sm:w-64 mx-auto md:mx-0 md:w-1/3 lg:w-1/4 shrink-0"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/5 aspect-[2/3]">
              <img
                src={getImageUrl(movie.poster_url)}
                alt={movie.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>

          {/* Info */}
          <div className="flex-1 pt-4 md:pt-20 text-center md:text-left">
            <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
              <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded uppercase">
                {movie.lang}
              </span>
              <span className="bg-surface text-text-muted text-xs font-bold px-2 py-1 rounded uppercase border border-white/10">
                {movie.quality}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-2">{movie.name}</h1>
            <h2 className="text-xl text-text-muted mb-6">{movie.origin_name} ({movie.year})</h2>

            <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-text-muted">
              <div className="flex items-center gap-1.5">
                <Star className="text-yellow-500 fill-yellow-500" size={18} />
                <span className="text-white font-bold">8.5</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={18} />
                <span>{movie.time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={18} />
                <span>{movie.year}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe size={18} />
                {movie.country?.[0] ? (
                  <Link 
                    to={`/category/${movie.country[0].slug}`} 
                    className="hover:text-primary transition-colors hover:underline"
                  >
                    {movie.country[0].name}
                  </Link>
                ) : (
                  <span>Đang cập nhật</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4 mb-10 justify-center md:justify-start">
              <Link 
                to={watchLink}
                className="btn-primary flex items-center gap-2 text-sm sm:text-lg px-8 sm:px-10 py-3 sm:py-4 w-full sm:w-auto justify-center"
              >
                <Play size={20} fill="currentColor" className="sm:w-6 sm:h-6" />
                {watchButtonText}
              </Link>
              
              <div className="flex gap-3 w-full sm:w-auto justify-center">
                <motion.button 
                  whileTap={{ scale: 1.2 }}
                  onClick={() => toggleFavorite(movie)}
                  className={cn(
                    "p-3 sm:p-4 rounded-xl transition-all duration-300 group bg-[#2B2B2B] border border-white/5 flex-1 sm:flex-none flex justify-center",
                    favorited ? "text-primary" : "text-white hover:text-primary"
                  )}
                >
                  <Heart 
                    size={20} 
                    className={cn(
                      "transition-all duration-300 sm:w-6 sm:h-6",
                      favorited && "fill-primary"
                    )} 
                  />
                </motion.button>

                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="bg-[#2B2B2B] border border-white/5 p-3 sm:p-4 rounded-xl text-white hover:text-primary transition-all flex-1 sm:flex-none flex justify-center relative group"
                >
                  <Share2 size={20} className="sm:w-6 sm:h-6" />
                  {isCopied && (
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                      Đã sao chép!
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary rounded-full" />
                  Nội dung phim
                </h3>
                <div 
                  className="text-text-muted leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: movie.content }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">Đạo diễn: </span>
                  <span className="text-white">{movie.director?.join(', ') || 'Đang cập nhật'}</span>
                </div>
                <div>
                  <span className="text-text-muted">Diễn viên: </span>
                  <span className="text-white">{movie.actor?.join(', ') || 'Đang cập nhật'}</span>
                </div>
                <div>
                  <span className="text-text-muted">Thể loại: </span>
                  <span className="text-white flex flex-wrap gap-x-2 gap-y-1 inline-flex items-center">
                    {movie.category && movie.category.length > 0 ? (
                      movie.category.map((c, i) => (
                        <React.Fragment key={c.id || c.slug || i}>
                          <Link to={`/category/${c.slug}`} className="hover:text-primary transition-colors hover:underline text-white font-medium">
                            {c.name}
                          </Link>
                          {i < (movie.category?.length || 0) - 1 && <span className="text-text-muted/60">,</span>}
                        </React.Fragment>
                      ))
                    ) : (
                      <span>Đang cập nhật</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Quốc gia: </span>
                  <span className="text-white flex flex-wrap gap-x-2 gap-y-1 inline-flex items-center">
                    {movie.country && movie.country.length > 0 ? (
                      movie.country.map((c, i) => (
                        <React.Fragment key={c.id || c.slug || i}>
                          <Link to={`/category/${c.slug}`} className="hover:text-primary transition-colors hover:underline text-white font-medium">
                            {c.name}
                          </Link>
                          {i < (movie.country?.length || 0) - 1 && <span className="text-text-muted/60">,</span>}
                        </React.Fragment>
                      ))
                    ) : (
                      <span>Đang cập nhật</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Episodes Section */}
        {movie.episodes && movie.episodes.length > 0 && (
          <section className="mt-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                Danh sách tập phim
              </h3>
              
              {/* Version Selection Tabs */}
              <div className="flex flex-wrap gap-2">
                {movie.episodes.map((server, idx) => (
                  <button
                    key={server.server_name}
                    onClick={() => setSelectedServerIndex(idx)}
                    className={cn(
                      "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 border",
                      selectedServerIndex === idx 
                        ? "bg-primary border-primary text-white shadow-[0_0_15px_rgba(229,9,127,0.4)]" 
                        : "bg-[#2B2B2B] border-white/5 text-text-muted hover:text-white hover:border-primary/50"
                    )}
                  >
                    {server.server_name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-3">
              {currentServer?.server_data.map((ep) => {
                const isCurrent = historyItem?.episodeSlug === ep.slug;
                const isWatched = historyItem?.watchedEpisodes?.includes(ep.slug);
                
                return (
                  <Link
                    key={ep.slug}
                    to={`/watch/${movie.slug}?ep=${ep.slug}&sv=${selectedServerIndex}`}
                    className={cn(
                      "text-center py-3 rounded-lg font-bold transition-all border relative overflow-hidden",
                      isCurrent 
                        ? "bg-gradient-to-br from-primary/30 to-primary/10 border-primary text-white shadow-[0_0_15px_rgba(229,9,127,0.3)]" 
                        : isWatched
                          ? "bg-surface/40 border-white/5 text-text-muted/50 hover:text-white hover:border-primary/50"
                          : "bg-surface hover:bg-primary/20 border border-white/5 hover:border-primary text-white"
                    )}
                  >
                    {isCurrent && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full m-1 animate-pulse" />
                    )}
                    {ep.name}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Related Movies Section */}
        <section className="mt-20">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Sparkles size={24} className="text-primary" />
            Phim Đề Xuất
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {relatedMovies.length > 0 ? (
              relatedMovies.map((m) => (
                <Link key={m._id} to={`/movie/${m.slug}`} className="group">
                  <div className="aspect-[2/3] relative rounded-xl overflow-hidden mb-3 border border-white/5 shadow-lg">
                    <img 
                      src={getImageUrl(m.poster_url)} 
                      alt={m.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(229,9,127,0.5)]">
                        <Play className="text-white fill-white ml-1" size={24} />
                      </div>
                    </div>
                  </div>
                  <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{m.name}</h4>
                  <p className="text-xs text-text-muted mt-1">{m.year} • {m.origin_name}</p>
                </Link>
              ))
            ) : (
              [...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] skeleton rounded-xl" />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
