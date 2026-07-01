import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the intro in this session
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    
    if (!hasSeenIntro) {
      setIsVisible(true);
      // Lock scroll
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const handleEnter = () => {
    // Set flag in session storage
    sessionStorage.setItem('hasSeenIntro', 'true');
    
    // Trigger exit animation
    setIsVisible(false);
    
    // Unlock scroll after animation completes (0.8s)
    setTimeout(() => {
      document.body.style.overflow = 'auto';
    }, 800);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#141414]"
        >
          {/* Background Collage with Blur and Overlay */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url('/image_7.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="absolute inset-0 z-10 bg-[#141414]/60" />

          {/* Center Content */}
          <div className="relative z-20 flex flex-col items-center px-4 text-center">
            {/* Logo */}
            <motion.h1 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-6xl md:text-8xl font-black tracking-tighter mb-4"
              style={{
                color: '#E5097F',
                textShadow: '0 0 10px rgba(229, 9, 127, 0.7), 0 0 20px rgba(229, 9, 127, 0.5), 0 0 40px rgba(229, 9, 127, 0.3)',
                fontFamily: '"Arial Black", Impact, sans-serif'
              }}
            >
              NETFLOP
            </motion.h1>

            {/* Slogan */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-lg md:text-xl font-medium mb-12 max-w-md"
              style={{ color: '#B3B3B3' }}
            >
              Bạn đã sẵn sàng trải nghiệm nền tảng xem phim số 36 Việt Nam chưa?
            </motion.p>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              onClick={handleEnter}
              className="px-8 py-4 rounded-lg font-bold text-white text-lg md:text-xl tracking-wide transition-colors hover:bg-[#ff1a92] animate-[pulse-scale_1.5s_ease-in-out_infinite]"
              style={{ 
                backgroundColor: '#E5097F',
                boxShadow: '0 4px 14px 0 rgba(229, 9, 127, 0.39)',
                animationDelay: '1.1s'
              }}
            >
              XEM <span style={{ opacity: 0.35 }}>N</span>GAY
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
