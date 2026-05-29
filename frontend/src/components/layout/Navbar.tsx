'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  Menu, X, User, LogOut, Settings, ChevronDown,
  BookOpen, Music, Globe, Phone, Mail, Facebook,
} from 'lucide-react';

const CONTACT_LINKS = {
  phone: 'tel:+84399360938',
  zalo: 'https://zalo.me/0399360938',
  email: 'mailto:cuongthaihnhe176322@gmail.com',
  facebook: 'https://www.facebook.com/CuongThaiswit/',
};

const ZaloIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 2.5.92 4.79 2.45 6.55L2 22l3.55-2.45A9.96 9.96 0 0012 20c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.27 14.14c-.24.67-1.41 1.24-1.96 1.32-.53.08-1.03.11-1.47-.13-.43-.24-.67-.53-.93-.86-.23-.3-.48-.64-.68-.9-.12-.15-.14-.26-.11-.42.05-.28.24-.55.65-.72.78-.33 1.38-.27 1.88.16.58.5 1.15 1.01 1.73 1.51.37.32.74.43 1.2.31.44-.12.82-.37 1.19-.68.25-.21.44-.37.62-.5.14-.1.25-.18.35-.23.13-.08.27-.13.43-.13h.23c.21-.01.29-.09.34-.2l.01-.03c.06-.18.05-.45-.03-.67-.04-.11-.09-.22-.15-.32l-.09-.15c-.1-.17-.21-.34-.33-.5-.12-.16-.25-.31-.39-.46-.15-.15-.3-.29-.46-.42-.16-.13-.34-.25-.52-.35-.17-.1-.34-.19-.52-.26-.16-.06-.32-.11-.49-.15l-.48-.1-.48-.07c-.16-.02-.32-.04-.48-.04l-.48-.01-.48.02c-.16.01-.32.03-.48.06l-.48.09c-.16.03-.32.08-.47.13l-.47.15c-.15.05-.3.11-.45.18-.15.07-.29.14-.43.22-.14.08-.27.17-.4.26-.13.09-.25.19-.37.29-.12.1-.23.21-.34.32l-.15.18-.13.2-.24.4c-.07.13-.13.27-.18.41-.05.14-.1.28-.14.43-.04.14-.07.29-.09.44-.02.15-.04.3-.05.45v.48c.01.16.03.32.06.48.03.16.07.32.12.48l.09.47.15.47c.05.15.12.3.18.45.07.15.14.29.22.43.08.14.17.28.27.41.09.13.19.25.3.37l.33.33.18.15.2.14c.14.09.29.17.44.24.15.07.31.13.47.19l.47.12.48.09.48.06.48.03h.48c.16 0 .32-.02.48-.04l.48-.07.48-.1.48-.15c.16-.05.32-.11.47-.18l.47-.21c.15-.08.3-.16.44-.25.14-.09.28-.19.41-.3.13-.11.25-.22.37-.34.12-.12.23-.24.33-.37.11-.13.21-.26.3-.4.09-.14.17-.28.25-.42.08-.14.14-.29.2-.44.06-.15.11-.3.15-.45.04-.15.08-.3.1-.45.02-.15.04-.3.05-.45v-.48c0-.16-.01-.32-.03-.48l-.06-.48c-.03-.16-.07-.32-.12-.48l-.09-.47-.15-.47c-.05-.15-.12-.3-.18-.44-.07-.14-.14-.29-.22-.42-.08-.14-.17-.27-.26-.4-.1-.13-.2-.25-.31-.37-.11-.11-.23-.22-.35-.32-.12-.1-.25-.2-.38-.29-.13-.09-.26-.17-.4-.25-.14-.08-.28-.15-.42-.21-.14-.06-.29-.12-.44-.17l-.45-.12-.47-.09-.47-.06-.48-.03h-.48c-.16 0-.32.02-.48.04l-.48.07-.48.1-.48.15c-.16.05-.32.11-.47.18l-.47.21c-.15.08-.3.16-.44.25-.14.09-.28.19-.41.3-.13.11-.25.22-.37.34-.12.12-.23.24-.33.37-.11.13-.21.26-.3.4-.09.14-.17.28-.25.42-.08.14-.14.29-.2.44-.06.15-.11.3-.15.45-.04.15-.08.3-.1.45-.02.15-.04.3-.05.45v.48c0 .16.01.32.02.48.02.16.04.32.07.48l.09.48.12.48c.05.16.11.32.17.48.07.16.14.31.22.47l.26.46c.09.15.19.3.29.44.1.14.21.28.32.41.11.13.23.26.35.38.12.12.25.24.38.35.13.11.27.22.41.32.14.1.29.19.44.28l.46.23.48.18.48.15.48.11.48.07.48.03h.48c.16 0 .32-.01.48-.03l.48-.07.48-.11.48-.15.48-.18.48-.23.48-.28.48-.32c.16-.11.32-.23.47-.35.15-.13.3-.26.44-.4.14-.14.28-.28.41-.43.13-.15.26-.3.38-.46.12-.16.23-.32.34-.48.1-.16.2-.33.29-.5l.24-.51c.07-.17.13-.35.18-.52.05-.18.09-.35.13-.53.03-.18.06-.36.08-.53.02-.18.03-.36.03-.53v-.53c0-.18-.01-.36-.03-.53l-.06-.53c-.03-.18-.07-.35-.12-.53-.05-.17-.11-.35-.17-.52-.07-.17-.14-.34-.22-.51-.08-.16-.17-.33-.26-.49-.09-.16-.19-.32-.29-.48-.1-.15-.21-.3-.32-.45-.11-.14-.23-.29-.35-.42-.12-.13-.25-.26-.38-.39-.13-.12-.27-.24-.41-.35-.14-.11-.29-.21-.44-.31-.15-.09-.31-.18-.47-.26-.16-.08-.33-.15-.5-.21-.17-.06-.34-.12-.52-.16-.18-.05-.36-.08-.53-.11-.18-.03-.36-.05-.53-.06-.18-.01-.36-.02-.53-.02-.18 0-.36.01-.53.03l-.53.06c-.18.03-.35.07-.53.12-.17.05-.35.11-.52.17-.17.06-.34.13-.5.21-.17.08-.33.16-.5.25-.16.09-.32.19-.47.29-.15.1-.3.21-.44.33-.14.11-.28.23-.41.36-.13.13-.26.26-.38.39-.12.13-.23.27-.34.41-.11.14-.21.29-.31.44-.09.15-.18.3-.26.45-.08.15-.15.31-.22.46-.07.16-.13.31-.18.47-.05.16-.1.32-.13.48-.04.16-.06.32-.08.48Z"/>
  </svg>
);

const LABELS = {
  home: { vi: 'Trang chủ', en: 'Home' },
  academy: { vi: 'Học viện', en: 'Academy' },
  blog: { vi: 'Blog', en: 'Blog' },
  projects: { vi: 'Dự án', en: 'Projects' },
  music: { vi: 'Nhạc', en: 'Music' },
  aiChat: { vi: 'AI Chat', en: 'AI Chat' },
  login: { vi: 'Đăng nhập', en: 'Login' },
  signUp: { vi: 'Đăng ký', en: 'Sign Up' },
  admin: { vi: 'Quản trị', en: 'Admin' },
  myCourses: { vi: 'Khóa học', en: 'My Courses' },
  logout: { vi: 'Đăng xuất', en: 'Logout' },
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [locale, setLocale] = useState('vi');

  useEffect(() => {
    const match = document.cookie.match(/NEXT_LOCALE=(\w+)/);
    setLocale(match ? match[1] : 'vi');
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) return null;

  const isAdmin = user?.roles?.some((r: string) => r.replace('ROLE_', '').toUpperCase() === 'ADMIN');

  const t = (key: string) => LABELS[key as keyof typeof LABELS]?.[locale as 'vi' | 'en'] ?? key;

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/academy', label: t('academy') },
    { href: '/blog', label: t('blog') },
    { href: '/projects', label: t('projects') },
    { href: '/music', label: t('music') },
    { href: '/chat', label: t('aiChat') },
  ];

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    setLocale(newLocale);
    router.refresh();
    setLangMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const contactItems = [
    { href: CONTACT_LINKS.phone, icon: Phone, label: 'Phone' },
    { href: CONTACT_LINKS.zalo, icon: ZaloIcon, label: 'Zalo' },
    { href: CONTACT_LINKS.email, icon: Mail, label: 'Email' },
    { href: CONTACT_LINKS.facebook, icon: Facebook, label: 'Facebook' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-darkbg/90 backdrop-blur-md border-b border-darkborder shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 group">
              <img
                src="/images/avatar.png"
                alt="CuongHoang"
                className="w-9 h-9 rounded-xl object-cover"
              />
              <span className="font-heading font-bold text-lg text-text-primary hidden sm:block group-hover:text-neon-violet transition-colors">
                CuongHoang
              </span>
            </a>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-neon-violet bg-neon-violet/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Contact Icons */}
              <div className="hidden lg:flex items-center gap-1 mr-2">
                {contactItems.map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
                    title={label}
                  >
                    <Icon />
                  </a>
                ))}
              </div>

              {/* Lang Switcher */}
              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                  title="Change language"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">{locale === 'vi' ? 'VN' : 'EN'}</span>
                </button>
                {langMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 w-36 bg-darkcard border border-darkborder rounded-xl shadow-xl z-50 overflow-hidden">
                      {['vi', 'en'].map((loc) => (
                        <button
                          key={loc}
                          onClick={() => switchLocale(loc)}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                            locale === loc
                              ? 'text-neon-violet bg-neon-violet/10'
                              : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                          }`}
                        >
                          <span className="text-xs font-medium uppercase w-6">{loc === 'vi' ? 'VN' : 'EN'}</span>
                          <span className="text-xs">{loc === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* User area */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-darkcard border border-darkborder hover:border-neon-violet/30 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-indigo to-neon-violet flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden sm:block text-sm text-text-primary font-medium">
                      {user?.username}
                    </span>
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-darkcard border border-darkborder rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-darkborder">
                          <p className="text-sm font-medium text-text-primary">{user?.username}</p>
                          <p className="text-xs text-text-muted truncate">{user?.email}</p>
                        </div>
                        {isAdmin && (
                          <a href="/admin" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
                            <Settings className="w-4 h-4" />{t('admin')}
                          </a>
                        )}
                        <a href="/my-courses" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
                          <BookOpen className="w-4 h-4" />{t('myCourses')}
                        </a>
                        <a href="/music" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
                          <Music className="w-4 h-4" />{t('music')}
                        </a>
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                          <LogOut className="w-4 h-4" />{t('logout')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <a href="/login" className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {t('login')}
                  </a>
                  <a href="/register" className="px-4 py-2 text-sm bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-lg hover:opacity-90 transition-opacity">
                    {t('signUp')}
                  </a>
                </div>
              )}

              {/* Mobile toggle */}
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors">
                {mobileOpen ? <X className="w-5 h-5 text-text-primary" />
                  : <Menu className="w-5 h-5 text-text-primary" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-darkcard border-t border-darkborder">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-neon-violet bg-neon-violet/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}>
                  {link.label}
                </a>
              ))}

              {/* Mobile contact */}
              <div className="pt-3 pb-1 border-t border-darkborder">
                <div className="flex items-center gap-2 px-4 mb-2">
                  <Globe className="w-4 h-4 text-text-muted" />
                  <span className="text-xs text-text-muted">Language</span>
                </div>
                <div className="flex gap-2 px-4 mb-3">
                  {['vi', 'en'].map((loc) => (
                    <button key={loc}
                      onClick={() => { switchLocale(loc); setMobileOpen(false); }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        locale === loc
                          ? 'bg-neon-violet text-white'
                          : 'bg-darkborder text-text-muted hover:text-text-primary'
                      }`}>
                      {loc === 'vi' ? 'VN' : 'EN'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-4 mb-2">
                  <span className="text-xs text-text-muted">Contact</span>
                </div>
                <div className="flex gap-2 px-4">
                  {contactItems.map(({ href, icon: Icon, label }) => (
                    <a key={label} href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-darkborder text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">
                      <Icon />
                      <span className="text-xs">{label}</span>
                    </a>
                  ))}
                </div>
              </div>

              {!isAuthenticated && (
                <div className="pt-3 border-t border-darkborder space-y-2">
                  <a href="/login" onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {t('login')}
                  </a>
                  <a href="/register" onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-lg text-center">
                    {t('signUp')}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
