'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { blogApi } from '@/lib/api';
import type { Post, Category } from '@/types';
import { useProjectStore } from '@/store/projectStore';
import { useTranslation } from '@/hooks/useTranslation';
import BlogCard from '@/components/blog/BlogCard';
import ServicesSection from '@/components/home/ServicesSection';
import ContactSection from '@/components/home/ContactSection';
import Footer from '@/components/home/Footer';
import BenefitCard, { benefits } from '@/components/home/BenefitCard';
import StatsSection from '@/components/home/StatsSection';
import { formatNumber } from '@/lib/utils';
import { ArrowRight, Sparkles, Code2 } from 'lucide-react';

export default function HomePage() {
  const { t, locale } = useTranslation();
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const getFeaturedProjects = useProjectStore((s) => s.getFeaturedProjects);
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

  const featuredProjects = getFeaturedProjects().slice(0, 4);

  return (
    <div className="min-h-screen bg-darkbg">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-neon-indigo/20 rounded-full blur-[180px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-violet/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-neon-fuchsia/10 rounded-full blur-[120px]" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Text Content */}
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-neon-violet/10 border border-neon-violet/30 rounded-full mb-6"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-violet opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-violet"></span>
                </span>
                <span className="text-sm text-neon-violet font-medium">{t('hero.badge')}</span>
              </motion.div>

              {/* Main Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-4 leading-tight"
              >
                <span className="text-text-primary">{t('hero.greeting')}</span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia">
                  {t('hero.name')}
                </span>
              </motion.h1>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl md:text-2xl font-bold mb-4"
              >
                <span className="text-neon-indigo">{t('hero.tagline')}</span>
                <span className="text-text-muted"> + </span>
                <span className="text-neon-fuchsia">{t('hero.tagline2')}</span>
              </motion.p>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-base md:text-lg text-text-secondary max-w-xl mb-6 leading-relaxed"
              >
                {t('hero.description')}
              </motion.p>

              {/* Benefit Cards - Upgraded */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
              >
                {benefits.map((benefit, index) => (
                  <BenefitCard
                    key={benefit.titleKey}
                    icon={benefit.icon}
                    titleKey={benefit.titleKey}
                    descriptionKey={benefit.descriptionKey}
                    color={benefit.color}
                    delay={index * 0.1}
                  />
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row items-start gap-4"
              >
                <Link
                  href="/projects"
                  className="group relative px-8 py-4 bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia text-white font-semibold rounded-2xl overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center justify-center gap-2">
                    {t('hero.viewProjects')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  href="/chat"
                  className="group px-8 py-4 bg-darkcard border-2 border-darkborder text-text-primary font-semibold rounded-2xl hover:border-neon-violet hover:bg-darkcard/80 transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-neon-fuchsia" />
                    {t('hero.chatWithAI')}
                  </span>
                </Link>
              </motion.div>
            </div>

            {/* Right - Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex justify-center items-center"
            >
              <div className="relative">
                <div className="w-[400px] h-[400px] xl:w-[450px] xl:h-[450px] rounded-3xl bg-gradient-to-br from-neon-indigo/30 via-neon-violet/20 to-neon-fuchsia/30 border border-neon-violet/20 p-3 max-w-full max-h-full overflow-hidden">
                  <img
                    src="/images/avatar.png"
                    alt="CuongHoang"
                    className="w-full h-full rounded-2xl object-cover"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 w-40 h-40 bg-neon-fuchsia/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-neon-indigo/20 rounded-full blur-3xl" />
                
                {/* Floating badges */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="absolute -top-4 left-6 px-4 py-2.5 bg-darkcard/95 backdrop-blur-md border border-darkborder rounded-xl shadow-xl"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                    </span>
                    <span className="text-text-primary font-medium">{t('hero.experience')}</span>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="absolute -bottom-4 right-6 px-4 py-2.5 bg-darkcard/95 backdrop-blur-md border border-darkborder rounded-xl shadow-xl"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-400">★★★★★</span>
                    <span className="text-text-primary font-medium">{t('hero.happyClients')}</span>
                  </div>
                </motion.div>
                
                {/* Tech stack badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute -left-8 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-darkcard/95 backdrop-blur-md border border-darkborder rounded-lg shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-neon-indigo" />
                    <span className="text-xs text-text-primary font-medium">Next.js</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 border-2 border-text-muted/30 rounded-full flex justify-center pt-2"
            >
              <motion.div
                animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-3 bg-text-muted/50 rounded-full"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section - Upgraded */}
      <StatsSection />

      {/* Featured Projects */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="inline-block px-4 py-1.5 bg-neon-fuchsia/10 border border-neon-fuchsia/20 rounded-full text-sm text-neon-fuchsia font-medium mb-4">
              {t('featuredWork')}
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-text-primary mb-4">
              {t('projects.title')}
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              {t('projects.subtitle')}
            </p>
          </motion.div>

          {featuredProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-darkcard rounded-2xl border border-darkborder/50 hover:border-neon-fuchsia/40 transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-darkbg">
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-indigo/20 to-neon-violet/20">
                        <span className="text-4xl opacity-30">{project.title.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h3 className="text-base font-heading font-bold text-text-primary group-hover:text-neon-fuchsia transition-colors line-clamp-1">
                        {project.title}
                      </h3>
                      <span className={`shrink-0 px-2 py-0.5 text-xs rounded-md border ${
                        project.status === 'COMPLETED'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : project.status === 'IN_PROGRESS'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {project.status === 'IN_PROGRESS' ? 'In Progress' : project.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2 mb-3">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {project.technologies.slice(0, 3).map((tech) => (
                          <span key={tech} className="px-2 py-0.5 bg-darkbg text-text-muted text-xs rounded-md border border-darkborder">
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 3 && (
                          <span className="px-2 py-0.5 bg-darkbg text-text-muted text-xs rounded-md border border-darkborder">
                            +{project.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <Link
                      href={`/projects/${project.slug}`}
                      className="inline-flex items-center gap-1 text-sm text-neon-fuchsia hover:text-neon-violet transition-colors group/link"
                    >
                      {t('projects.viewDetails')}
                      <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'CuongHoang Portfolio V2',
                  desc: 'Next-gen portfolio with AI chatbot & RAG architecture',
                  tags: ['Java', 'Next.js', 'AI'],
                  status: 'IN_PROGRESS',
                  emoji: 'P',
                  gradient: 'from-neon-indigo',
                },
                {
                  title: 'E-Commerce Platform',
                  desc: 'Full e-commerce with payment integration',
                  tags: ['Spring Boot', 'React', 'Stripe'],
                  status: 'COMPLETED',
                  emoji: 'E',
                  gradient: 'from-green-500',
                },
                {
                  title: 'Microservices Demo',
                  desc: 'Spring Cloud, Eureka, API Gateway',
                  tags: ['Java', 'Docker', 'K8s'],
                  status: 'COMPLETED',
                  emoji: 'M',
                  gradient: 'from-blue-500',
                },
                {
                  title: 'AI Chat Application',
                  desc: 'Smart chatbot with RAG knowledge base',
                  tags: ['Next.js', 'OpenAI', 'PostgreSQL'],
                  status: 'COMPLETED',
                  emoji: 'A',
                  gradient: 'from-neon-violet',
                },
              ].map((project, index) => (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-darkcard rounded-2xl border border-darkborder/50 hover:border-neon-fuchsia/40 transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-darkcard to-darkbg flex items-center justify-center relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient}/10 to-neon-fuchsia/5`} />
                    <span className="relative text-5xl font-heading font-bold text-neon-fuchsia/30 group-hover:text-neon-fuchsia/50 transition-colors">
                      {project.emoji}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h3 className="text-base font-heading font-bold text-text-primary group-hover:text-neon-fuchsia transition-colors line-clamp-1">
                        {project.title}
                      </h3>
                      <span className={`shrink-0 px-2 py-0.5 text-xs rounded-md border ${
                        project.status === 'COMPLETED'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {project.status === 'In Progress' ? 'In Progress' : project.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2 mb-3">{project.desc}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-darkbg text-text-muted text-xs rounded-md border border-darkborder">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      href="/projects"
                      className="inline-flex items-center gap-1 text-sm text-neon-fuchsia hover:text-neon-violet transition-colors group/link"
                    >
                      {t('projects.viewDetails')}
                      <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-heading font-bold text-text-primary mb-6">
                {t('about.title')}&nbsp;<span className="text-neon-violet">{t('about.subtitle')}</span>
              </h2>
              <p className="text-text-secondary text-lg leading-relaxed mb-6">
                {t('about.description1')}
              </p>
              <p className="text-text-secondary text-lg leading-relaxed mb-8">
                {t('about.description2')}
              </p>
              <div className="flex flex-wrap gap-3">
                {['JavaScript', 'TypeScript', 'React', 'Next.js', 'Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Docker'].map((skill) => (
                  <span key={skill} className="px-4 py-2 bg-darkcard border border-darkborder rounded-xl text-sm text-text-secondary">
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-neon-indigo/20 to-neon-violet/20 border border-neon-violet/20 p-8 overflow-hidden">
                <img
                  src="/images/avatar.png"
                  alt="CuongHoang"
                  className="w-full h-full rounded-2xl object-cover"
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-neon-fuchsia/20 rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-neon-indigo/20 rounded-full blur-xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-24 bg-gradient-to-b from-darkbg to-darkcard">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-heading font-bold text-text-primary mb-4">
              {t('latestArticles')}&nbsp;<span className="text-neon-violet">{t('articles')}</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              {t('blog.subtitle')}
            </p>
          </motion.div>

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
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                  >
                    <BlogCard post={post} variant={index === 0 ? 'featured' : 'default'} />
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-12">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-darkcard border border-darkborder text-text-primary font-semibold rounded-2xl hover:border-neon-violet hover:text-neon-violet transition-all duration-300"
                >
                  {t('viewAllArticles')}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-muted text-lg">{t('noArticles')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-heading font-bold text-text-primary mb-4">
              {t('blogCategories')}&nbsp;<span className="text-neon-fuchsia">{t('categories')}</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              {t('categoriesSubtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.length > 0 ? categories.map((category, i) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link
                  href={`/blog?category=${category.slug}`}
                  className="group block p-6 bg-darkcard rounded-2xl border border-darkborder/50 hover:border-neon-violet transition-all duration-300"
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
                  {category.description || t('categoriesSubtitle')}
                </p>
              </Link>
              </motion.div>
            )) : (
              <div className="col-span-4 text-center py-12">
                <p className="text-text-muted text-lg">{t('noCategories')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-heading font-bold text-text-primary mb-4">
              {t('skillsTech')}&nbsp;<span className="text-neon-indigo">{t('about.title')}</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              {t('skillsTechSubtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { name: 'Java', level: 95, color: 'from-orange-500 to-red-500' },
              { name: 'Spring Boot', level: 90, color: 'from-green-500 to-emerald-500' },
              { name: 'JavaScript', level: 85, color: 'from-yellow-400 to-orange-500' },
              { name: 'React', level: 85, color: 'from-cyan-400 to-blue-500' },
              { name: 'TypeScript', level: 80, color: 'from-blue-500 to-indigo-500' },
              { name: 'Next.js', level: 80, color: 'from-gray-600 to-gray-900' },
              { name: 'PostgreSQL', level: 85, color: 'from-blue-600 to-indigo-700' },
              { name: 'Docker', level: 80, color: 'from-blue-400 to-cyan-500' },
              { name: 'Redis', level: 75, color: 'from-red-500 to-orange-500' },
              { name: 'AWS', level: 65, color: 'from-orange-400 to-yellow-500' },
            ].map((skill, i) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="p-4 bg-darkcard rounded-xl border border-darkborder/50 hover:border-neon-violet/30 transition-all group cursor-default"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-text-primary group-hover:text-neon-violet transition-colors">
                    {skill.name}
                  </span>
                  <span className="text-xs text-text-muted">{skill.level}%</span>
                </div>
                <div className="h-1.5 bg-darkbg rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${skill.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <ServicesSection />

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}