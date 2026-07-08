import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  fetchCategoryMovies, 
  fetchGenreMovies, 
  fetchCountryMovies, 
  fetchMovies, 
  Movie,
  GENRES,
  COUNTRIES
} from '../services/api';
import MovieCard from '../components/MovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getCategoryTitle = () => {
    if (!category) return 'Danh mục';
    
    const mainCategories: Record<string, string> = {
      'phim-bo': 'Phim Bộ',
      'phim-le': 'Phim Lẻ',
      'hoat-hinh': 'Hoạt Hình',
      'tv-shows': 'TV Shows',
      'moi-nhat': 'Phim Mới Nhất'
    };
    
    if (mainCategories[category]) return mainCategories[category];
    
    const genre = GENRES.find(g => g.slug === category);
    if (genre) return `Phim ${genre.name}`;
    
    const country = COUNTRIES.find(c => c.slug === category);
    if (country) return `Phim ${country.name}`;
    
    return 'Danh mục';
  };

  useEffect(() => {
    setPage(1);
  }, [category]);

  useEffect(() => {
    const loadData = async () => {
      if (!category) return;
      setLoading(true);
      try {
        let resData;
        if (category === 'moi-nhat') {
          resData = await fetchMovies(page);
          setMovies(resData.items || []);
          const pagination = resData.pagination;
          if (pagination) {
            const total = pagination.totalItems;
            const perPage = pagination.totalItemsPerPage;
            setTotalPages(Math.ceil(total / perPage) || 1);
          }
        } else if (GENRES.some(g => g.slug === category)) {
          resData = await fetchGenreMovies(category, page);
          setMovies(resData.data?.items || []);
          const pagination = resData.data?.params?.pagination;
          if (pagination) {
            const total = pagination.totalItems;
            const perPage = pagination.totalItemsPerPage;
            setTotalPages(Math.ceil(total / perPage) || 1);
          }
        } else if (COUNTRIES.some(c => c.slug === category)) {
          resData = await fetchCountryMovies(category, page);
          setMovies(resData.data?.items || []);
          const pagination = resData.data?.params?.pagination;
          if (pagination) {
            const total = pagination.totalItems;
            const perPage = pagination.totalItemsPerPage;
            setTotalPages(Math.ceil(total / perPage) || 1);
          }
        } else {
          resData = await fetchCategoryMovies(category, page);
          setMovies(resData.data?.items || []);
          const pagination = resData.data?.params?.pagination;
          if (pagination) {
            const total = pagination.totalItems;
            const perPage = pagination.totalItemsPerPage;
            setTotalPages(Math.ceil(total / perPage) || 1);
          }
        }
      } catch (error) {
        console.error('Failed to fetch category movies:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    window.scrollTo(0, 0);
  }, [category, page]);

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <span className="w-1.5 h-10 bg-primary rounded-full" />
          {getCategoryTitle()}
        </h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/3] skeleton rounded-xl animate-pulse bg-white/5" />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface/50 rounded-2xl border border-white/5">
          <p className="text-text-muted">Không có bộ phim nào trong danh mục này.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-surface border border-white/5 disabled:opacity-40 hover:border-primary disabled:hover:border-white/5 transition-all text-white"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-1">
            {page > 2 && (
              <>
                <button
                  onClick={() => setPage(1)}
                  className="px-3.5 py-1.5 rounded-lg text-sm bg-surface border border-white/5 hover:border-primary transition-all font-bold text-white"
                >
                  1
                </button>
                {page > 3 && <span className="px-1 text-text-muted">...</span>}
              </>
            )}
            
            {page > 1 && (
              <button
                onClick={() => setPage(page - 1)}
                className="px-3.5 py-1.5 rounded-lg text-sm bg-surface border border-white/5 hover:border-primary transition-all font-bold text-white"
              >
                {page - 1}
              </button>
            )}
            
            <span className="px-3.5 py-1.5 rounded-lg text-sm bg-primary text-white border border-primary font-bold shadow-[0_0_10px_rgba(229,9,127,0.3)]">
              {page}
            </span>
            
            {page < totalPages && (
              <button
                onClick={() => setPage(page + 1)}
                className="px-3.5 py-1.5 rounded-lg text-sm bg-surface border border-white/5 hover:border-primary transition-all font-bold text-white"
              >
                {page + 1}
              </button>
            )}
            
            {page < totalPages - 1 && (
              <>
                {page < totalPages - 2 && <span className="px-1 text-text-muted">...</span>}
                <button
                  onClick={() => setPage(totalPages)}
                  className="px-3.5 py-1.5 rounded-lg text-sm bg-surface border border-white/5 hover:border-primary transition-all font-bold text-white"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-surface border border-white/5 disabled:opacity-40 hover:border-primary disabled:hover:border-white/5 transition-all text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

