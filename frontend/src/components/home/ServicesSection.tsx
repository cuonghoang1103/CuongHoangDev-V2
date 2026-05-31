'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

export default function ServicesSection() {
  const { t } = useTranslation();

  const services = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      titleKey: 'services.webDev.title',
      descriptionKey: 'services.webDev.description',
      featuresKey: 'services.webDev.features',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      titleKey: 'services.aiIntegration.title',
      descriptionKey: 'services.aiIntegration.description',
      featuresKey: 'services.aiIntegration.features',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      titleKey: 'services.ecommerce.title',
      descriptionKey: 'services.ecommerce.description',
      featuresKey: 'services.ecommerce.features',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      titleKey: 'services.devops.title',
      descriptionKey: 'services.devops.description',
      featuresKey: 'services.devops.features',
    },
  ];

  // Helper to get features array safely
  const getFeatures = (key: string): string[] => {
    const result = t(key);
    if (Array.isArray(result)) return result;
    return [];
  };

  return (
    <section id="services" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 bg-neon-violet/10 border border-neon-violet/20 rounded-full text-sm text-neon-violet font-medium mb-4">
              {t('services.header')}
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-text-primary mb-4">
              {t('services.title')}&nbsp;<span className="text-neon-violet">{t('services.provide')}</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              {t('services.subtitle')}
            </p>
          </motion.div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 bg-darkcard rounded-2xl border border-darkborder/50 hover:border-neon-violet/40 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-indigo/20 to-neon-violet/20 border border-neon-violet/20 flex items-center justify-center mb-5 text-neon-violet group-hover:scale-110 transition-transform">
                {service.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-heading font-bold text-text-primary mb-3 group-hover:text-neon-violet transition-colors">
                {t(service.titleKey)}
              </h3>

              {/* Description */}
              <p className="text-text-secondary mb-4 leading-relaxed">
                {t(service.descriptionKey)}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {getFeatures(service.featuresKey).map((feature: string) => (
                  <span
                    key={feature}
                    className="px-3 py-1 bg-darkbg rounded-lg text-xs text-text-muted border border-darkborder/50"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
