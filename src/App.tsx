import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import Watch from './pages/Watch';
import SearchPage from './pages/SearchPage';
import CategoryPage from './pages/CategoryPage';
import FavoritesPage from './pages/FavoritesPage';
import HistoryPage from './pages/HistoryPage';
import SplashScreen from './components/SplashScreen';
import TVApp from './pages/TVApp';

export default function App() {
  const [tvMode, setTvMode] = useState(() => {
    // 1. Force TV Mode via URL query string or hash (extremely useful for smart TVs or testing)
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    if (params.get('tv') === 'true' || params.get('tv') === '1' || params.get('mode') === 'tv' || hash.includes('tv')) {
      localStorage.setItem('tvMode', 'true');
      return true;
    }

    // 2. Check local storage
    const stored = localStorage.getItem('tvMode');
    if (stored) return stored === 'true';

    // 3. Ultra-comprehensive Auto-detect TV via User Agent
    const ua = navigator.userAgent.toLowerCase();
    const tvKeywords = [
      'smarttv', 'smart-tv', 'smart_tv', 'googletv', 'androidtv', 'android-tv',
      'tizen', 'webos', 'web0s', 'opera tv', 'appletv', 'apple-tv', 'hbbtv',
      'viera', 'aquos', 'sony dtv', 'bravia', 'chromecast', 'crkey', 'roku',
      'firetv', 'fire-tv', 'aftb', 'afts', 'playstation', 'playstation 4', 'playstation 5',
      'xbox', 'xbox one', 'xbox series', 'nintendo switch', 'nintendo', 'netcast', 'lgtv',
      'lg-tv', 'vizio', 'coocaa', 'hisense', 'skyworth', 'haier', 'toshiba', 'mitv',
      'mi tv', 'xiaomi tv', 'tcl tv', 'television', 'tvapp', 'tv/'
    ];

    const isTv = tvKeywords.some(keyword => ua.includes(keyword)) ||
                 // Secondary checks for TV context
                 (ua.includes('tv') && (ua.includes('linux') || ua.includes('safari') || ua.includes('chrome'))) && 
                 !ua.includes('mobile') && !ua.includes('tablet') && !ua.includes('iphone') && !ua.includes('ipad') && !ua.includes('android');

    return isTv;
  });

  const handleSetTvMode = (mode: boolean) => {
    setTvMode(mode);
    localStorage.setItem('tvMode', String(mode));
  };

  if (tvMode) {
    return <TVApp setTvMode={handleSetTvMode} />;
  }

  return (
    <Router>
      <SplashScreen />
      <div className="min-h-screen flex flex-col">
        <Header onEnterTvMode={() => handleSetTvMode(true)} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:slug" element={<MovieDetails />} />
            <Route path="/watch/:slug" element={<Watch />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/resume" element={<HistoryPage />} />
            <Route path="/account" element={<div className="pt-24 px-4 text-center text-2xl font-bold">Tính năng đang phát triển</div>} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}
