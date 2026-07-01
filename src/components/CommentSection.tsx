import React, { useState, useEffect } from 'react';
import { Play, Send } from 'lucide-react';

interface Comment {
  id: string;
  userName: string;
  content: string;
  timestamp: number;
  avatar?: string;
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'mock-1',
    userName: 'Anti phim trấn thành',
    content: 'đụ má phim hay quá, đỡ mắc ỉa hơn phim trấn thành.',
    timestamp: Date.now() - 1000,
  },
  {
    id: 'mock-2',
    userName: 'Trấn Thành',
    content: 'ôi vl',
    timestamp: Date.now() - 2000,
  },
  {
    id: 'mock-3',
    userName: 'Quý bửu UET',
    content: 'web lỏ mà mượt ác ad ơi, mãi yêu netflop',
    timestamp: Date.now() - 3000,
  },
];

export default function CommentSection({ movieId }: { movieId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const savedComments = localStorage.getItem(`comments_${movieId}`);
    if (savedComments) {
      setComments([...MOCK_COMMENTS, ...JSON.parse(savedComments)]);
    } else {
      setComments(MOCK_COMMENTS);
    }
  }, [movieId]);

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Vừa xong';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const handleSend = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userName: 'Fan bê tông cốt thép', // Forced Naming
      content: newComment,
      timestamp: Date.now(),
    };

    const updatedLocal = [...(JSON.parse(localStorage.getItem(`comments_${movieId}`) || '[]')), comment];
    localStorage.setItem(`comments_${movieId}`, JSON.stringify(updatedLocal));
    
    setComments([...MOCK_COMMENTS, ...updatedLocal]);
    setNewComment('');
  };

  return (
    <section className="bg-surface p-6 rounded-2xl border border-white/5">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <Play size={20} className="text-primary fill-primary" />
        Bình luận
      </h3>

      <div className="space-y-8">
        {/* Input Area */}
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Play size={16} className="text-primary fill-primary" />
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận của bạn..."
              className="w-full bg-background border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-primary transition-all resize-none h-24 text-white"
            />
            <div className="flex justify-end mt-2">
              <button 
                onClick={handleSend}
                className="btn-primary py-1.5 px-6 text-sm flex items-center gap-2"
              >
                <Send size={14} />
                Gửi
              </button>
            </div>
          </div>
        </div>

        {/* Comment List */}
        <div className="space-y-6">
          {comments.slice().reverse().map((comment) => (
            <div key={comment.id} className="flex gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-[#2B2B2B] flex items-center justify-center shrink-0 overflow-hidden text-xs font-bold text-text-muted border border-white/5">
                {comment.avatar ? (
                  <img 
                    src={comment.avatar} 
                    alt={comment.userName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  comment.userName.charAt(0).toUpperCase()
                )}
              </div>
              
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-white">
                    {comment.userName}
                  </span>
                  <span className="text-[11px] text-[#B3B3B3]">
                    {formatRelativeTime(comment.timestamp)}
                  </span>
                </div>
                
                {/* Content */}
                <p className="text-sm text-[#B3B3B3] leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
