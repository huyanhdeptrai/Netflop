import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchMovies, Movie, cn, fetchMovies, getImageUrl } from '../services/api';
import MovieCard from '../components/MovieCard';
import { Search as SearchIcon, SlidersHorizontal, Home, Sparkles, AlertCircle } from 'lucide-react';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [randomMovies, setRandomMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const loadRandom = async () => {
      try {
        const data = await fetchMovies(Math.floor(Math.random() * 5) + 1);
        setRandomMovies(data.items.sort(() => 0.5 - Math.random()).slice(0, 6));
      } catch (err) {
        console.error(err);
      }
    };
    loadRandom();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await searchMovies(query, page);
        setResults(data.data?.items || []);
        setTotalPages(data.data?.params?.pagination?.totalPages || 1);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [query, page]);

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black mb-2 text-white">Kết quả tìm kiếm</h1>
          <p className="text-[#B3B3B3] text-sm md:text-base">
            Tìm thấy <span className="text-primary font-bold">{(results?.length || 0)}</span> kết quả cho từ khóa "<span className="text-primary font-bold">{query}</span>"
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-surface px-4 py-2 rounded-lg border border-white/5 hover:border-primary transition-all text-sm">
            <SlidersHorizontal size={18} />
            Bộ lọc
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/3] skeleton rounded-xl" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {results.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-2xl mx-auto">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative bg-surface p-8 rounded-full border border-white/10 shadow-2xl">
              <AlertCircle size={80} className="text-primary animate-pulse" />
            </div>
          </div>
          
          <h2 className="text-3xl font-black mb-4 text-white tracking-tight">
            Không tìm thấy phim phù hợp
          </h2>
          
          <p className="text-text-muted text-base mb-8 leading-relaxed">
            Rất tiếc, chúng tôi không tìm thấy bộ phim nào trùng khớp với từ khóa "<span className="text-white font-semibold">{query}</span>". Bạn vui lòng kiểm tra lại chính tả hoặc thử tìm với tên tiếng Việt / tiếng Anh ngắn hơn nhé.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
            <Link 
              to="/" 
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-full font-black transition-all shadow-[0_0_20px_rgba(229,9,127,0.4)] hover:scale-105 active:scale-95"
            >
              <Home size={20} />
              QUAY LẠI TRANG CHỦ
            </Link>
          </div>

          {randomMovies.length > 0 && (
            <div className="w-full pt-12 border-t border-white/5">
              <h3 className="text-xl font-bold mb-8 flex items-center justify-center gap-2">
                <span className="w-8 h-1 bg-primary rounded-full" />
                Hoặc là có một vài gợi ý ở đây xem tạm cũng được nhé
                <span className="w-8 h-1 bg-primary rounded-full" />
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {randomMovies.map((movie) => (
                  <Link 
                    key={movie._id} 
                    to={`/movie/${movie.slug}`}
                    className="group relative aspect-[2/3] rounded-lg overflow-hidden border border-white/5"
                  >
                    <img 
                      src={getImageUrl(movie.poster_url)} 
                      alt={movie.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="text-[10px] font-bold text-white line-clamp-2">{movie.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-12 gap-2">
          {[...Array(Math.min(5, totalPages))].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={cn(
                "w-10 h-10 rounded-lg font-bold transition-all",
                page === i + 1 ? "bg-primary text-white" : "bg-surface hover:bg-primary/20"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
