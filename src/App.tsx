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

export default function App() {
  return (
    <Router>
      <SplashScreen />
      <div className="min-h-screen flex flex-col">
        <Header />
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
