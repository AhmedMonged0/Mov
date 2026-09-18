import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import '../../styles/Navbar.css';

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenu(false);
    }
  };

  const navLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'الأفلام الشائعة', path: '/?type=popular' },
    { name: 'التصنيفات', path: '/categories' },
  ];

  return (
    <header className="navbar" dir="rtl">
      <div className="nav-brand-group">
        <Link to="/" className="brand" title="Movora - منصة الأفلام (movora.me)">
          MOVORA<span>.</span>
        </Link>
        <span className="brand-domain">movora.me</span>
      </div>

      <nav className={`nav-links ${mobileMenu ? "open" : ""}`}>
        {navLinks.map((link) => (
          <Link 
            key={link.name} 
            to={link.path}
            className={location.pathname === link.path && !location.search ? 'active' : ''}
            onClick={() => setMobileMenu(false)}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="nav-actions">
        <form onSubmit={handleSearch} className="search">
          <button type="submit" className="search-btn-icon" aria-label="بحث">
            <Search size={17} />
          </button>
          <input 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="ابحث عن فيلم..." 
            dir="rtl"
          />
          {searchQuery && (
            <button 
              type="button" 
              className="clear-nav-search" 
              onClick={() => setSearchQuery("")}
              title="مسح"
            >
              <X size={14} />
            </button>
          )}
        </form>

        <button 
          className="menu" 
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="القائمة"
        >
          {mobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
