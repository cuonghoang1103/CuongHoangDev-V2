'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Category } from '@/types';

interface CategorySidebarProps {
  categories: Category[];
  activeCategory?: string;
}

export default function CategorySidebar({ categories, activeCategory }: CategorySidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-24">
      {/* Categories */}
      <div className="bg-darkcard rounded-2xl border border-darkborder/50 p-5">
        <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-neon-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Categories
        </h3>
        
        <nav className="space-y-1">
          <Link
            href="/blog"
            className={`
              flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-300
              ${!activeCategory
                ? 'bg-neon-violet/20 text-neon-violet'
                : 'text-text-secondary hover:bg-darkbg hover:text-text-primary'
              }
            `}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-current" />
              All posts
            </span>
            <span className="text-xs opacity-60">All</span>
          </Link>

          {categories.map((category) => {
            const isActive = activeCategory === category.slug;
            return (
              <Link
                key={category.id}
                href={`/blog?category=${category.slug}`}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-300
                  ${isActive
                    ? 'bg-neon-violet/20 text-neon-violet'
                    : 'text-text-secondary hover:bg-darkbg hover:text-text-primary'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                  {category.name}
                </span>
                {category.postCount !== undefined && (
                  <span className="text-xs opacity-60">{category.postCount}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Popular Tags */}
      <div className="bg-darkcard rounded-2xl border border-darkborder/50 p-5 mt-6">
        <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-neon-fuchsia" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Popular Topics
        </h3>
        
        <div className="flex flex-wrap gap-2">
          {['JavaScript', 'React', 'TypeScript', 'Next.js', 'Spring Boot', 'AI', 'Node.js', 'CSS'].map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${tag.toLowerCase().replace('.', '')}`}
              className="px-3 py-1 text-xs bg-neon-fuchsia/10 text-neon-fuchsia rounded-full hover:bg-neon-fuchsia/20 transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-gradient-to-br from-neon-indigo/20 to-neon-violet/20 rounded-2xl border border-neon-violet/30 p-5 mt-6">
        <h3 className="font-heading font-semibold text-text-primary mb-2">
          Subscribe for updates
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Get the latest posts via email
        </p>
        <input
          type="email"
          placeholder="email@example.com"
          className="w-full px-4 py-2 rounded-xl bg-darkbg border border-darkborder text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
        />
        <button className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-neon-indigo to-neon-violet text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity">
          Subscribe
        </button>
      </div>
    </aside>
  );
}
