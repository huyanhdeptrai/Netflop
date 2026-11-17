import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Movie } from './api';

export interface HistoryItem extends Movie {
  currentTime: number;
  duration: number;
  progress: number; // percentage 0-100
  lastUpdated: number;
  episodeSlug?: string;
  episodeName?: string;
  serverName?: string;
  isSeries: boolean;
  /** Chỉ số server (?sv=) đang xem, để "xem tiếp" quay lại đúng server */
  serverIndex?: number;
  /** Tập kế tiếp (thay cho việc lưu cả mảng episodes vào localStorage) */
  nextEpisode?: { slug: string; name: string } | null;
  /** @deprecated chỉ còn trong dữ liệu cũ, không lưu nữa */
  episodes?: any[];
  watchedEpisodes?: string[];
}

/** Chỉ giữ các trường cần thiết, tránh làm đầy localStorage (giới hạn ~5MB) */
const sanitize = (item: HistoryItem): HistoryItem => ({
  _id: item._id,
  name: item.name,
  slug: item.slug,
  origin_name: item.origin_name,
  poster_url: item.poster_url,
  thumb_url: item.thumb_url,
  year: item.year,
  modified: item.modified,
  currentTime: item.currentTime,
  duration: item.duration,
  progress: item.progress,
  lastUpdated: item.lastUpdated,
  episodeSlug: item.episodeSlug,
  episodeName: item.episodeName,
  serverName: item.serverName,
  serverIndex: item.serverIndex,
  isSeries: item.isSeries,
  nextEpisode: item.nextEpisode,
  watchedEpisodes: item.watchedEpisodes,
});

interface HistoryContextType {
  history: HistoryItem[];
  updateHistory: (item: HistoryItem) => void;
  removeFromHistory: (movieId: string) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('netflop_history');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.map(sanitize) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('netflop_history', JSON.stringify(history.slice(0, 100)));
    } catch (err) {
      console.warn('Không lưu được lịch sử xem:', err);
    }
  }, [history]);

  const updateHistory = (item: HistoryItem) => {
    // Instant Watch Threshold: 5s
    if (item.currentTime < 5 && item.progress < 1) {
      return;
    }

    setHistory((prev) => {
      const existingItem = prev.find((h) => h._id === item._id);
      const watched = [...(existingItem?.watchedEpisodes || [])];
      
      const filtered = prev.filter((h) => h._id !== item._id);
      
      // Completion threshold: 95%
      if (item.progress >= 95) {
        if (item.episodeSlug && !watched.includes(item.episodeSlug)) {
          watched.push(item.episodeSlug);
        }

        if (item.isSeries) {
          const nextEp = item.nextEpisode;
          if (nextEp) {
            // Update history to point to next episode at 0%
            return [{
              ...sanitize(item),
              nextEpisode: null,
              episodeSlug: nextEp.slug, 
              episodeName: nextEp.name, 
              progress: 0, 
              currentTime: 0, 
              lastUpdated: Date.now(),
              watchedEpisodes: watched
            }, ...filtered];
          }
          
          // If it was the last episode, reset to 0
          return [{ ...sanitize(item), progress: 0, currentTime: 0, lastUpdated: Date.now(), watchedEpisodes: watched }, ...filtered];
        } else {
          // For movies: show as 100% completed
          return [{ ...sanitize(item), progress: 100, lastUpdated: Date.now(), watchedEpisodes: watched }, ...filtered];
        }
      }

      return [{ ...sanitize(item), watchedEpisodes: watched }, ...filtered];
    });
  };

  const removeFromHistory = (movieId: string) => {
    setHistory((prev) => prev.filter((h) => h._id !== movieId));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <HistoryContext.Provider value={{ history, updateHistory, removeFromHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};
