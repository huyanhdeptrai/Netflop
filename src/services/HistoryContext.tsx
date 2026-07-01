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
  episodes?: any[];
  watchedEpisodes?: string[];
}

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
    const saved = localStorage.getItem('netflop_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('netflop_history', JSON.stringify(history));
  }, [history]);

  const updateHistory = (item: HistoryItem) => {
    // Instant Watch Threshold: 5s
    if (item.currentTime < 5 && item.progress < 1) {
      return;
    }

    setHistory((prev) => {
      const existingItem = prev.find((h) => h._id === item._id);
      const watched = existingItem?.watchedEpisodes || [];
      
      const filtered = prev.filter((h) => h._id !== item._id);
      
      // Completion threshold: 95%
      if (item.progress >= 95) {
        if (item.episodeSlug && !watched.includes(item.episodeSlug)) {
          watched.push(item.episodeSlug);
        }

        if (item.isSeries && item.episodes && item.episodes.length > 0) {
          // Find next episode
          const serverData = item.episodes[0].server_data;
          const currentIndex = serverData.findIndex(ep => ep.slug === item.episodeSlug);
          
          if (currentIndex !== -1 && currentIndex < serverData.length - 1) {
            const nextEp = serverData[currentIndex + 1];
            // Update history to point to next episode at 0%
            return [{ 
              ...item, 
              episodeSlug: nextEp.slug, 
              episodeName: nextEp.name, 
              progress: 0, 
              currentTime: 0, 
              lastUpdated: Date.now(),
              watchedEpisodes: watched
            }, ...filtered];
          }
          
          // If it was the last episode, reset to 0
          return [{ ...item, progress: 0, currentTime: 0, lastUpdated: Date.now(), watchedEpisodes: watched }, ...filtered];
        } else {
          // For movies: show as 100% completed
          return [{ ...item, progress: 100, lastUpdated: Date.now(), watchedEpisodes: watched }, ...filtered];
        }
      }

      return [{ ...item, watchedEpisodes: watched }, ...filtered];
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
