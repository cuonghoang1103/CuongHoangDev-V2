'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { blogApi } from '@/lib/api';
import type { Post, Category } from '@/types';
import BlogCard from '@/components/blog/BlogCard';
import { formatNumber } from '@/lib/utils';

export default function HomePage() {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, categoriesRes] = await Promise.all([
          blogApi.getPosts({ size: 6 }),
          blogApi.getCategories(),
        ]);
        setFeaturedPosts(postsRes.data.data?.content || []);
        setCategories(categoriesRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-darkbg">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-indigo/20 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-violet/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-neon-fuchsia/10 rounded-full blur-[100px]" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-violet/10 border border-neon-violet/20 rounded-full mb-8">
            <span className="w-2 h-2 bg-neon-violet rounded-full animate-pulse" />
            <span className="text-sm text-neon-violet font-medium">Portfolio & AI Platform</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-6">
            <span className="text-text-primary">Xin chào, tôi là </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia">
              CuongHoangDev
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto mb-10">
            Full Stack Developer | AI Enthusiast | Building modern web applications
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/blog"
              className="group px-8 py-4 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-neon-violet/30 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                Đọc Blog
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
            <Link
              href="#projects"
              className="px-8 py-4 bg-darkcard border border-darkborder text-text-primary font-semibold rounded-2xl hover:border-neon-violet hover:text-neon-violet transition-all duration-300"
            >
              Xem Dự án
            </Link>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-darkborder">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Năm kinh nghiệm', value: '3+' },
              { label: 'Dự án hoàn thành', value: '20+' },
              { label: 'Công nghệ sử dụng', value: '15+' },
              { label: 'Khách hàng hài lòng', value: '50+' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-indigo to-neon-violet">
                  {stat.value}
                </div>
                <div className="text-text-muted mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-heading font-bold text-text-primary mb-6">
                Về <span className="text-neon-violet">Tôi</span>
              </h2>
              <p className="text-text-secondary text-lg leading-relaxed mb-6">
                Tôi là một Full Stack Developer đam mê công nghệ, luôn tìm kiếm những giải pháp sáng tạo 
                và hiệu quả cho các vấn đề phức tạp. Với kinh nghiệm trong việc xây dựng các ứng dụng web 
                hiện đại, tôi chuyên về React, Next.js, Spring Boot và tích hợp AI.
              </p>
              <p className="text-text-secondary text-lg leading-relaxed mb-8">
                Ngoài công việc, tôi thích chia sẻ kiến thức qua blog và tham gia các dự án mã nguồn mở.
              </p>
              <div className="flex flex-wrap gap-3">
                {['JavaScript', 'TypeScript', 'React', 'Next.js', 'Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Docker'].map((skill) => (
                  <span key={skill} className="px-4 py-2 bg-darkcard border border-darkborder rounded-xl text-sm text-text-secondary">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-neon-indigo/20 to-neon-violet/20 border border-neon-violet/20 p-8">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-neon-indigo via-neon-violet to-neon-fuchsia flex items-center justify-center">
                  <span className="text-8xl font-bold text-white opacity-50">CH</span>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-neon-fuchsia/20 rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-neon-indigo/20 rounded-full blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-24 bg-gradient-to-b from-darkbg to-darkcard">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-text-primary mb-4">
              Bài viết <span className="text-neon-violet">mới nhất</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Khám phá những bài viết mới nhất về công nghệ và kinh nghiệm lập trình
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-darkcard rounded-2xl overflow-hidden border border-darkborder/50">
                    <div className="h-48 bg-darkbg" />
                    <div className="p-5 space-y-3">
                      <div className="h-6 bg-darkbg rounded-lg w-3/4" />
                      <div className="h-4 bg-darkbg rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPosts.slice(0, 6).map((post, index) => (
                  <BlogCard key={post.id} post={post} variant={index === 0 ? 'featured' : 'default'} />
                ))}
              </div>
              <div className="text-center mt-12">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-darkcard border border-darkborder text-text-primary font-semibold rounded-2xl hover:border-neon-violet hover:text-neon-violet transition-all duration-300"
                >
                  Xem tất cả bài viết
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-muted text-lg">Chưa có bài viết nào</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-text-primary mb-4">
              Danh mục <span className="text-neon-fuchsia">Blog</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Tìm kiếm bài viết theo chủ đề bạn quan tâm
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.length > 0 ? categories.map((category, i) => (
              <Link
                key={category.id}
                href={`/blog?category=${category.slug}`}
                className="group p-6 bg-darkcard rounded-2xl border border-darkborder/50 hover:border-neon-violet transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
                  i % 4 === 0 ? 'bg-neon-indigo/20 text-neon-indigo' :
                  i % 4 === 1 ? 'bg-neon-violet/20 text-neon-violet' :
                  i % 4 === 2 ? 'bg-neon-fuchsia/20 text-neon-fuchsia' :
                  'bg-neon-cyan/20 text-neon-cyan'
                }`}>
                  {i % 4 === 0 && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  )}
                  {i % 4 === 1 && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {i % 4 === 2 && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                  {i % 4 === 3 && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-heading font-semibold text-text-primary group-hover:text-neon-violet transition-colors mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-text-muted line-clamp-2">
                  {category.description || 'Khám phá các bài viết về ' + category.name.toLowerCase()}
                </p>
              </Link>
            )) : (
              <div className="col-span-4 text-center py-12">
                <p className="text-text-muted text-lg">Chưa có danh mục nào</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-darkborder">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-heading font-bold text-text-primary mb-2">
                CuongHoangDev
              </h3>
              <p className="text-text-muted text-sm">
                Full Stack Developer | AI Enthusiast
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="p-3 bg-darkcard rounded-xl hover:bg-neon-violet/10 hover:text-neon-violet transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="#" className="p-3 bg-darkcard rounded-xl hover:bg-neon-violet/10 hover:text-neon-violet transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
            <p className="text-text-muted text-sm">
              © 2026 CuongHoangDev. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}