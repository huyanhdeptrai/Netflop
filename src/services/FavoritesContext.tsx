import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Movie } from './api';
import { motion, AnimatePresence } from 'motion/react';

interface FavoritesContextType {
  favorites: Movie[];
  toggleFavorite: (movie: Movie) => void;
  isFavorite: (movieId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

interface Toast {
  id: string;
  message: string;
  type: 'add' | 'remove';
}

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Movie[]>(() => {
    const saved = localStorage.getItem('netflop_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    localStorage.setItem('netflop_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToast = (message: string, type: 'add' | 'remove') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const toggleFavorite = (movie: Movie) => {
    const exists = favorites.find((f) => f._id === movie._id);
    if (exists) {
      setFavorites((prev) => prev.filter((f) => f._id !== movie._id));
      addToast(`Đã xóa ${movie.name} khỏi Danh sách Yêu thích.`, 'remove');
    } else {
      setFavorites((prev) => [...prev, movie]);
      addToast(`💖 Đã thêm ${movie.name} vào Danh sách Yêu thích.`, 'add');
    }
  };

  const isFavorite = (movieId: string) => {
    return favorites.some((f) => f._id === movieId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 items-center pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className="bg-surface border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 pointer-events-auto"
            >
              <span className="text-sm font-medium text-white">
                {toast.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </FavoritesContext.Provider>
  );
};
