-- V15: Shop module - Products, Orders, Discount Codes
-- =====================================================

-- Product Categories
CREATE TABLE product_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100),
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

-- Products
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    thumbnail_url VARCHAR(500),
    images TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    original_price DECIMAL(10, 2),
    stock_quantity INTEGER DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    category_id BIGINT REFERENCES product_categories(id),
    type VARCHAR(20) DEFAULT 'DIGITAL',
    file_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = TRUE;
CREATE INDEX idx_products_created ON products(created_at DESC);

-- Shop Orders
CREATE TABLE shop_orders (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id),
    buyer_name VARCHAR(255) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    buyer_phone VARCHAR(50),
    buyer_address TEXT,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    discount_code VARCHAR(50),
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50) DEFAULT 'SIMULATED',
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    payment_id VARCHAR(100),
    paid_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON shop_orders(user_id);
CREATE INDEX idx_orders_code ON shop_orders(order_code);
CREATE INDEX idx_orders_status ON shop_orders(status);
CREATE INDEX idx_orders_created ON shop_orders(created_at DESC);

-- Order Items
CREATE TABLE shop_order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_slug VARCHAR(255),
    product_image VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_order_items_order ON shop_order_items(order_id);

-- Discount Codes
CREATE TABLE discount_codes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) DEFAULT 'PERCENT',
    discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discount_code ON discount_codes(code);

-- Seed product categories
INSERT INTO product_categories (name, slug, description, sort_order) VALUES
('Templates', 'templates', 'Website and app templates', 1),
('E-books', 'e-books', 'Digital books and guides', 2),
('UI Kits', 'ui-kits', 'Design system and UI kit', 3),
('Plugins', 'plugins', 'WordPress and browser plugins', 4),
('Tools', 'tools', 'Developer tools and utilities', 5);

-- Seed products
INSERT INTO products (name, slug, description, short_description, thumbnail_url, price, original_price, stock_quantity, sold_count, featured, active, category_id, type) VALUES
('Portfolio Website Template', 'portfolio-template', '<p>Professional portfolio website template built with Next.js 14, TailwindCSS, and Framer Motion. Modern dark theme with smooth animations.</p><h3>Features</h3><ul><li>Responsive design</li><li>Dark theme</li><li>Framer Motion animations</li><li>Contact form</li><li>Blog integration</li></ul><h3>Tech Stack</h3><p>Next.js 14, TypeScript, TailwindCSS, Framer Motion</p>', 'Professional portfolio website template with dark theme and smooth animations', '/images/products/portfolio.jpg', 299000, 499000, 999, 45, true, true, 1, 'DIGITAL'),

('E-commerce Dashboard Template', 'ecommerce-dashboard', '<p>Complete admin dashboard for e-commerce with analytics, orders, products management.</p><h3>Features</h3><ul><li>Sales analytics</li><li>Order management</li><li>Product CRUD</li><li>User management</li><li>Dark/Light mode</li></ul><h3>Tech Stack</h3><p>React, TypeScript, TailwindCSS, Recharts</p>', 'Complete admin dashboard template with analytics and e-commerce features', '/images/products/dashboard.jpg', 499000, 799000, 888, 32, true, true, 1, 'DIGITAL'),

('Landing Page Mastery E-book', 'landing-page-ebook', '<p>Learn how to create high-converting landing pages. 150+ pages of practical techniques, case studies, and templates.</p><h3>Contents</h3><ul><li>Psychology of conversion</li><li>Copywriting formulas</li><li>Design principles</li><li>A/B testing guide</li><li>15 template examples</li></ul>', 'Complete guide to creating high-converting landing pages - 150 pages', '/images/products/ebook-landing.jpg', 99000, 199000, 9999, 128, true, true, 2, 'DIGITAL'),

('Next.js SaaS Boilerplate', 'nextjs-saas-boilerplate', '<p>Production-ready Next.js 14 SaaS boilerplate with authentication, billing, and admin panel.</p><h3>Features</h3><ul><li>NextAuth v5 authentication</li><li>Stripe integration</li><li>Prisma ORM</li><li>Admin dashboard</li><li>Landing page</li><li>Pricing page</li></ul><h3>Tech Stack</h3><p>Next.js 14, TypeScript, Prisma, PostgreSQL, Stripe, NextAuth</p>', 'Production-ready SaaS boilerplate with auth, billing, and admin', '/images/products/saas.jpg', 799000, 1299000, 499, 28, true, true, 1, 'DIGITAL'),

('React Component Library', 'react-component-library', '<p>50+ beautiful React components with dark theme, TypeScript, and Storybook docs.</p><h3>Components</h3><ul><li>Buttons, Cards, Modals</li><li>Forms and Inputs</li><li>Tables and Data grids</li><li>Charts and Graphs</li><li>Navigation components</li></ul>', '50+ beautiful React components with dark theme and TypeScript', '/images/products/components.jpg', 199000, 399000, 999, 67, false, true, 3, 'DIGITAL'),

('Chrome Extension Boilerplate', 'chrome-extension-boilerplate', '<p>Build Chrome extensions with React + TypeScript. Includes popup, options, and content script setup.</p><h3>Features</h3><ul><li>React in popup</li><li>Options page</li><li>Content scripts</li><li>Chrome storage API</li><li>Message passing</li></ul><h3>Tech Stack</h3><p>React, TypeScript, Vite, Chrome API</p>', 'Build Chrome extensions with React + TypeScript quickly', '/images/products/chrome-ext.jpg', 149000, 249000, 9999, 41, false, true, 5, 'DIGITAL'),

('Backend API Design Guide', 'backend-api-guide', '<p>Complete guide to designing RESTful APIs. Best practices, patterns, and security considerations.</p><h3>Topics</h3><ul><li>REST principles</li><li>Authentication (JWT, OAuth2)</li><li>Rate limiting</li><li>Caching strategies</li><li>API documentation</li></ul>', 'Complete guide to designing RESTful APIs - best practices and patterns', '/images/products/api-guide.jpg', 79000, 149000, 9999, 89, false, true, 2, 'DIGITAL'),

('TailwindCSS Admin Template', 'tailwind-admin-template', '<p>Modern admin template with 100+ components, dark theme, and responsive design.</p><h3>Features</h3><ul><li>100+ UI components</li><li>Dark/Light themes</li><li>Responsive design</li><li>Chart.js integrated</li><li>Data tables</li></ul>', '100+ UI components, dark theme, responsive admin template', '/images/products/admin-tailwind.jpg', 349000, 599000, 750, 53, false, true, 1, 'DIGITAL');

-- Seed discount codes
INSERT INTO discount_codes (code, discount_type, discount_value, min_order_amount, max_discount_amount, max_uses, active, description) VALUES
('WELCOME10', 'PERCENT', 10, 50000, NULL, NULL, true, 'Welcome discount 10% off'),
('SUMMER50', 'PERCENT', 50, 200000, 100000, 100, true, 'Summer sale 50% off, max 100k'),
('VIP20', 'PERCENT', 20, 100000, 50000, NULL, true, 'VIP member 20% off, max 50k'),
('FREESHIP', 'FIXED', 30000, 100000, NULL, 200, true, 'Free shipping for orders over 100k'),
('LAUNCH50K', 'FIXED', 50000, 150000, NULL, 50, true, 'Launch special - 50k off');
