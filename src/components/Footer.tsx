import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
          {/* Left Section: Brand & Author */}
          <div className="md:w-[40%] space-y-6">
            <Link to="/" className="text-[#E5097F] text-4xl font-black tracking-tighter block">
              NETFLOP
            </Link>
            <p className="text-[#B3B3B3] text-sm leading-relaxed">
              Nền tảng xem phim trực tuyến miễn phí đầu hàng Việt Nam cùng với lời khẳng định "netflix đ có tuổi". 
              Tôi cam kết sẽ mang đến chất lượng tệ nhất cho người dùng.
            </p>
            <div className="text-sm text-[#B3B3B3]">
              Tác giả: <span className="text-[#E5097F] font-bold">iem HAnh</span>
            </div>
          </div>

          {/* Right Section: Links & Social */}
          <div className="flex flex-col sm:flex-row gap-12 md:gap-24">
            {/* Column 1: Hỗ trợ */}
            <div className="space-y-6">
              <h4 className="text-white font-bold text-base">Hỗ trợ</h4>
              <ul className="space-y-4">
                <li>
                  <a 
                    href="https://www.facebook.com/huyanhneee/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-[#B3B3B3] hover:text-[#E5097F] transition-all group"
                  >
                    <Facebook size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Facebook</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:depmedi126@gmail.com"
                    className="flex items-center gap-3 text-[#B3B3B3] hover:text-[#E5097F] transition-all group"
                  >
                    <Mail size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Gửi Email</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Khám phá */}
            <div className="space-y-6">
              <h4 className="text-white font-bold text-base">Khám phá</h4>
              <ul className="space-y-4">
                <li>
                  <Link to="/category/phim-bo" className="text-[#B3B3B3] hover:text-[#E5097F] text-sm font-medium transition-colors">
                    Phim bộ
                  </Link>
                </li>
                <li>
                  <Link to="/category/phim-le" className="text-[#B3B3B3] hover:text-[#E5097F] text-sm font-medium transition-colors">
                    Phim lẻ
                  </Link>
                </li>
                <li>
                  <Link to="/category/hoat-hinh" className="text-[#B3B3B3] hover:text-[#E5097F] text-sm font-medium transition-colors">
                    Hoạt hình
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 border-t border-white/5 text-center">
          <p className="text-[#808080] text-[13px]">
            © 2026 NETFLOP. All rights reserved. Sybau 💔.
          </p>
        </div>
      </div>
    </footer>
  );
}
