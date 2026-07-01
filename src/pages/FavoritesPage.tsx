import React from 'react';
import { useFavorites } from '../services/FavoritesContext';
import MovieCard from '../components/MovieCard';
import { Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function FavoritesPage() {
  const { favorites, toggleFavorite } = useFavorites();

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto min-h-[70vh]">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <span className="w-1.5 h-10 bg-primary rounded-full" />
          Danh sách Yêu thích
        </h1>
        <span className="text-text-muted font-medium">
          {favorites.length} phim đã lưu
        </span>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {favorites.map((movie) => (
            <motion.div
              key={movie._id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <MovieCard 
                movie={movie} 
                onRemove={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(movie);
                }}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6 border border-white/5">
            <Heart size={48} className="text-text-muted opacity-20" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Danh sách của bạn đang trống</h2>
          <p className="text-text-muted max-w-md mb-8">
            Hãy khám phá và lưu lại những bộ phim yêu thích để xem lại bất cứ lúc nào nhé!
          </p>
          <Link 
            to="/" 
            className="btn-primary flex items-center gap-2 px-8"
          >
            Khám phá ngay
            <ArrowRight size={20} />
          </Link>
        </div>
      )}
    </div>
  );
}
