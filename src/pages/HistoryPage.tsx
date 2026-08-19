import React from 'react';
import { useHistory } from '../services/HistoryContext';
import MovieCard from '../components/MovieCard';
import { History, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatEpisodeDisplay } from '../services/api';

export default function HistoryPage() {
  const { history, removeFromHistory, clearHistory } = useHistory();

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto min-h-[70vh]">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <span className="w-1.5 h-10 bg-primary rounded-full" />
          Lịch sử xem phim
        </h1>
        {history.length > 0 && (
          <button 
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem?')) {
                clearHistory();
              }
            }}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors font-bold"
          >
            <Trash2 size={18} />
            Xóa tất cả
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <AnimatePresence mode="popLayout">
            {history.map((item) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group"
              >
                <MovieCard 
                  movie={item} 
                  progress={item.progress}
                  onRemove={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFromHistory(item._id);
                  }}
                />
                <div className="mt-1 mb-2 px-1">
                  <p className="text-[10px] text-primary font-medium">
                    {item.isSeries ? (
                      <>Đang xem: <span className="text-white">{formatEpisodeDisplay(item.episodeName)}</span> {item.serverName && <span className="text-[10px] opacity-50">({item.serverName})</span>}</>
                    ) : (
                      <>{`Còn lại ${Math.max(0, Math.round((item.duration - item.currentTime) / 60))} phút`} {item.serverName && <span className="text-[10px] opacity-50">({item.serverName})</span>}</>
                    )}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6 border border-white/5">
            <History size={48} className="text-text-muted opacity-20" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Bạn chưa xem bộ phim nào gần đây</h2>
          <p className="text-text-muted max-w-md mb-8">
            Hãy chọn một bộ phim để bắt đầu trải nghiệm những giây phút tuyệt vời nhé!
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
