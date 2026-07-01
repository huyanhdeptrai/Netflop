import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCategoryMovies, Movie } from '../services/api';
import MovieCard from '../components/MovieCard';

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const categoryNames: Record<string, string> = {
    'phim-bo': 'Phim Bộ',
    'phim-le': 'Phim Lẻ',
    'hoat-hinh': 'Hoạt Hình',
    'tv-shows': 'TV Shows',
    'moi-nhat': 'Phim Mới Nhất'
  };

  useEffect(() => {
    const loadData = async () => {
      if (!category) return;
      setLoading(true);
      try {
        const data = await fetchCategoryMovies(category, page);
        setMovies(data.data.items);
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
          {categoryNames[category || ''] || 'Danh mục'}
        </h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/3] skeleton rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
