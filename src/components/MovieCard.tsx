import React from 'react';
import { Play, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Movie, getImageUrl, handleImageError, cn } from '../services/api';

interface MovieCardProps {
  movie: Movie;
  onRemove?: (e: React.MouseEvent) => void;
  progress?: number;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onRemove, progress }) => {
  return (
    <Link to={`/movie/${movie.slug}`} className={cn(
      "relative overflow-hidden rounded-xl transition-transform duration-300 hover:scale-105 cursor-pointer group block"
    )}>
      <div className="aspect-[2/3] relative">
        <img
          src={getImageUrl(movie.poster_url)}
          alt={movie.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center bg-primary/20 shadow-[0_0_15px_rgba(229,9,127,0.5)]">
            <Play className="text-primary fill-primary ml-1" size={24} />
          </div>
        </div>

        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-md rounded-lg flex items-center justify-center text-white hover:bg-primary transition-colors opacity-0 group-hover:opacity-100 z-10"
          >
            <X size={18} />
          </button>
        )}

        {/* Audio Label Mockup */}
        <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
          Vietsub
        </div>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60 backdrop-blur-sm">
            <div 
              className="h-full bg-primary shadow-[0_0_10px_rgba(229,9,127,0.8)]" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
          {movie.name}
        </h3>
        <p className="text-xs text-text-muted mt-1 line-clamp-1">
          {movie.year} • {movie.origin_name}
        </p>
      </div>
    </Link>
  );
};

export default MovieCard;
