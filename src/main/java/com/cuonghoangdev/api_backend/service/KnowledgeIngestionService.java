package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.entity.DocumentChunk;
import com.cuonghoangdev.api_backend.repository.DocumentChunkRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Ingest portfolio data into the vector database using Gemini embeddings.
 *
 * Supported document types:
 *   ABOUT      - Personal bio, introduction
 *   SKILL      - Technical skills and technologies
 *   PROJECT    - Portfolio projects
 *   BLOG       - Blog posts and articles
 *   FEATURE    - Website features (Shop, Academy, Games, Music)
 *   EXPERIENCE - Work experience and education
 *
 * Each document is chunked, embedded via Gemini, and stored in document_chunks.
 * Call seedAll() on startup or via admin endpoint to populate the knowledge base.
 */
@Service
public class KnowledgeIngestionService {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeIngestionService.class);

    private final DocumentChunkRepository chunkRepository;
    private final AIService aiService;
    private final ChunkingService chunkingService;
    private final ObjectMapper objectMapper;

    public KnowledgeIngestionService(
            DocumentChunkRepository chunkRepository,
            AIService aiService,
            ChunkingService chunkingService,
            ObjectMapper objectMapper) {
        this.chunkRepository = chunkRepository;
        this.aiService = aiService;
        this.chunkingService = chunkingService;
        this.objectMapper = objectMapper;
    }

    public record IngestResult(int totalChunks, int embedded, int skipped, List<String> errors) {}

    // ============================================================
    // Public API
    // ============================================================

    /**
     * Seed all portfolio data into the vector DB.
     * Clears existing chunks first, then ingests fresh data.
     */
    @Transactional
    public IngestResult seedAll() {
        log.info("=== Starting full knowledge base seed ===");
        long existing = chunkRepository.count();
        if (existing > 0) {
            log.info("Clearing {} existing chunks before re-seeding", existing);
            chunkRepository.deleteAll();
        }

        List<String> errors = new ArrayList<>();
        int totalEmbedded = 0;
        int totalSkipped = 0;

        totalEmbedded += ingestAboutMe();
        totalEmbedded += ingestSkills();
        totalEmbedded += ingestProjects();
        totalEmbedded += ingestFeatures();
        totalEmbedded += ingestExperience();

        log.info("=== Seed complete: {} chunks embedded, {} skipped, {} errors ===",
                totalEmbedded, totalSkipped, errors.size());
        return new IngestResult(totalEmbedded + totalSkipped, totalEmbedded, totalSkipped, errors);
    }

    /**
     * Re-embed only chunks that are missing embeddings.
     * Safe to call on already-embedded chunks — skips them.
     */
    @Transactional
    public int embedPendingChunks() {
        long pending = chunkRepository.countPendingChunks();
        log.info("Found {} chunks pending embedding", pending);
        if (pending == 0) return 0;

        List<DocumentChunk> chunks = chunkRepository.findAll().stream()
                .filter(c -> c.getEmbedding() == null || c.getEmbedding().isBlank())
                .toList();

        int embedded = 0;
        for (DocumentChunk chunk : chunks) {
            boolean ok = embedAndSave(chunk);
            if (ok) embedded++;
        }
        log.info("Re-embedded {} pending chunks", embedded);
        return embedded;
    }

    // ============================================================
    // Per-Document-Type Ingestion
    // ============================================================

    private int ingestAboutMe() {
        log.info("Ingesting ABOUT data...");
        List<Map<String, String>> sections = List.of(
                Map.of(
                        "title", "Introduction",
                        "content", """
                                Cuong Hoang Dev — Full Stack Developer & AI Enthusiast.

                                I am a passionate Full Stack Developer with over 3 years of experience building modern web applications. My core stack includes Java with Spring Boot for backend development, and React/Next.js with TypeScript for frontend work.

                                I love exploring new technologies and continuously improving my skills. My focus areas are: AI integration, RAG architecture, microservices, and creating exceptional user experiences.

                                I built this portfolio website as a demonstration of my skills, integrating AI chatbots, music streaming, e-commerce features, and interactive games — all in one cohesive platform.
                                """
                ),
                Map.of(
                        "title", "Goals & Vision",
                        "content", """
                                My vision is to create technology solutions that make a real impact. I believe in writing clean, maintainable code and following best practices.

                                My goals include: mastering AI/ML integration, building scalable distributed systems, contributing to open source, and sharing knowledge through technical blog posts.

                                I am particularly interested in the intersection of AI and software engineering — specifically how LLMs and RAG systems can be applied to solve real-world problems.
                                """
                ),
                Map.of(
                        "title", "Contact & Social",
                        "content", """
                                You can reach me at:
                                - Email: cuonghoang1103@gmail.com
                                - GitHub: github.com/cuonghoangdev
                                - LinkedIn: linkedin.com/in/cuonghoangdev

                                I am open to freelance projects, collaboration opportunities, and interesting full-time positions. Feel free to reach out!
                                """
                )
        );

        return ingestDocument("about-main", "ABOUT", sections);
    }

    private int ingestSkills() {
        log.info("Ingesting SKILLS data...");
        List<Map<String, String>> sections = List.of(
                Map.of(
                        "title", "Frontend Development",
                        "content", """
                                Frontend Development Skills:

                                React & Next.js — 3+ years building production React applications with Next.js for SSR/SSG. Proficient with App Router, Server Components, and Client Components.

                                TypeScript — Strong understanding of type systems, generics, interfaces, and advanced TypeScript patterns for large-scale applications.

                                Tailwind CSS — Expert in utility-first CSS. Created custom design systems with dark mode, animations, and responsive layouts.

                                State Management — Zustand for client state, React Query/TanStack Query for server state, Context API for theme and auth state.

                                UI Libraries — Experience with shadcn/ui, Radix UI, Framer Motion for animations, Lucide React for icons.
                                """
                ),
                Map.of(
                        "title", "Backend Development",
                        "content", """
                                Backend Development Skills:

                                Java & Spring Boot — 3+ years with Spring Boot 3.x/4.x. Deep experience with Spring Security, Spring Data JPA, Spring WebFlux, and Spring AI.

                                Spring AI — Working with Spring AI framework for RAG, embeddings, and LLM integration. Familiar with vector stores (pgvector, ChromaDB).

                                Node.js & Express — Building RESTful APIs and real-time services with Express, Fastify, and NestJS.

                                API Design — RESTful APIs, GraphQL basics, WebSocket for real-time communication, Server-Sent Events (SSE) for streaming.
                                """
                ),
                Map.of(
                        "title", "Database & Infrastructure",
                        "content", """
                                Database & Infrastructure Skills:

                                PostgreSQL — Expert in relational databases, complex queries, indexing strategies, migrations with Flyway. Experience with pgvector for semantic search.

                                Redis — Caching strategies, session management, pub/sub for real-time features, rate limiting.

                                MongoDB — Document database for flexible schema requirements.

                                Docker & DevOps — Containerizing applications with Docker, Docker Compose for local dev, GitHub Actions for CI/CD pipelines, deployment on Linux servers.

                                Cloud — Basic AWS (EC2, S3, RDS) and experience deploying on VPS.
                                """
                ),
                Map.of(
                        "title", "AI & Machine Learning",
                        "content", """
                                AI & Machine Learning Skills:

                                RAG Architecture — Retrieval-Augmented Generation using pgvector, semantic search, document chunking, embedding strategies, hybrid search.

                                OpenAI API — GPT-4, GPT-4o, text-embedding-3-small integration. Both streaming and non-streaming responses.

                                Spring AI — Spring AI framework integration with multiple LLM providers (OpenAI, Anthropic, Google Gemini).

                                Vector Databases — pgvector setup, HNSW indexes, cosine similarity search, hybrid search combining keyword and vector search.

                                AI Chatbots — Building conversational AI with context awareness, session management, and streaming responses.
                                """
                )
        );

        return ingestDocument("skills-main", "SKILL", sections);
    }

    private int ingestProjects() {
        log.info("Ingesting PROJECTS data...");
        List<Map<String, String>> sections = List.of(
                Map.of(
                        "title", "Portfolio Website V2",
                        "content", """
                                Project: CuongHoangDev Portfolio V2

                                This is the current website you're browsing. A full-featured portfolio with AI chatbot integration.

                                Tech Stack: Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Spring Boot, PostgreSQL with pgvector, Redis, Spring AI.

                                Key Features:
                                - AI Chatbot powered by RAG (Retrieval-Augmented Generation) with semantic search
                                - Music streaming player with persistent playback across navigation
                                - E-commerce shop with cart, checkout, and order management
                                - Academy section for courses
                                - Interactive games section
                                - Admin dashboard for managing products, orders, blog posts
                                - NextAuth v5 + Spring Boot JWT dual authentication
                                - Dark theme with neon accents

                                GitHub: github.com/cuonghoangdev/portfolio-v2
                                """
                ),
                Map.of(
                        "title", "E-Commerce Platform",
                        "content", """
                                Project: Full E-Commerce Platform

                                A complete e-commerce platform built with Spring Boot and React.

                                Tech Stack: Spring Boot, React, PostgreSQL, Redis, Stripe payment integration.

                                Features:
                                - Product catalog with categories, search, and filtering
                                - Shopping cart with persistent session
                                - Order management with status tracking
                                - User authentication and authorization (ROLE_USER, ROLE_ADMIN)
                                - Payment processing with Stripe
                                - Email notifications for orders
                                - Admin dashboard for inventory management
                                - RESTful API with proper error handling
                                """
                ),
                Map.of(
                        "title", "Microservices Demo",
                        "content", """
                                Project: Microservices Architecture Demo

                                A demonstration of microservices patterns with Spring Cloud.

                                Tech Stack: Spring Boot, Spring Cloud, Netflix Eureka, API Gateway, Config Server, RabbitMQ.

                                Features:
                                - Service discovery with Eureka
                                - API Gateway for routing and load balancing
                                - Centralized configuration with Spring Cloud Config
                                - Asynchronous communication with RabbitMQ
                                - Circuit breaker with Resilience4j
                                - Distributed tracing
                                - Docker containerization
                                """
                ),
                Map.of(
                        "title", "AI RAG Chatbot",
                        "content", """
                                Project: AI RAG Chatbot for Portfolio

                                A smart AI chatbot that answers questions about the portfolio using RAG.

                                Features:
                                - Semantic search using pgvector and OpenAI embeddings
                                - Document chunking with overlap for context preservation
                                - Streaming responses via Server-Sent Events (SSE)
                                - Chat history and session management
                                - Contextual prompts based on conversation
                                - Fallback responses when OpenAI API key is not configured
                                - Feedback system for continuous improvement
                                - Analytics dashboard for chat insights

                                The chatbot uses cosine similarity to find the most relevant document chunks,
                                then augments the LLM prompt with retrieved context for accurate answers.
                                """
                )
        );

        return ingestDocument("projects-main", "PROJECT", sections);
    }

    private int ingestFeatures() {
        log.info("Ingesting FEATURE data...");
        List<Map<String, String>> sections = List.of(
                Map.of(
                        "title", "Shop Feature",
                        "content", """
                                Website Shop Feature:

                                The Shop section is an integrated e-commerce store where visitors can browse and purchase digital products, courses, or merchandise.

                                Features:
                                - Product browsing with categories and search
                                - Product detail pages with images and descriptions
                                - Shopping cart with add/remove/update quantity
                                - Persistent cart (survives page refresh via backend session)
                                - Checkout process with order summary
                                - Order history and tracking
                                - Wishlist functionality
                                - Admin panel for managing products and orders

                                Products are managed through an admin dashboard and stored in PostgreSQL.
                                Cart state is persisted in Redis for fast access.
                                """
                ),
                Map.of(
                        "title", "Academy Feature",
                        "content", """
                                Website Academy Feature:

                                The Academy section provides online courses and learning materials.

                                Features:
                                - Course catalog with categories
                                - Course detail pages with curriculum
                                - Course enrollment and progress tracking
                                - Video content delivery
                                - Quizzes and assessments
                                - Certificates of completion
                                - Instructor dashboard
                                - Student progress analytics

                                Built with Spring Boot for course management and video streaming capabilities.
                                Progress tracking uses PostgreSQL with efficient indexing.
                                """
                ),
                Map.of(
                        "title", "Games Feature",
                        "content", """
                                Website Games Feature:

                                The Games section offers interactive browser-based games.

                                Available Games:
                                - Snake Game: Classic snake game with score tracking
                                - Memory Game: Card matching with difficulty levels
                                - Puzzle Game: Brain teasers and challenges

                                Features:
                                - High score leaderboard
                                - Game progress persistence
                                - Responsive design (playable on mobile)
                                - Smooth animations with CSS/JS
                                - Sound effects and haptic feedback
                                - Dark theme optimized for gaming

                                Games are built with vanilla JavaScript and CSS for fast load times.
                                Leaderboard scores are stored in PostgreSQL.
                                """
                ),
                Map.of(
                        "title", "Music Feature",
                        "content", """
                                Website Music Feature:

                                The Music section allows visitors to stream background music while browsing the portfolio.

                                Features:
                                - Curated music playlists (Lo-Fi, Ambient, Focus music)
                                - Persistent audio player across page navigation
                                - Play/Pause, Next, Previous controls
                                - Volume control with mute toggle
                                - Track progress bar
                                - Playlist selection
                                - Currently playing display
                                - Keyboard shortcuts (Space to play/pause)

                                Audio is served from static files or CDN.
                                Player state is managed with Zustand (frontend) and persists playback position.
                                Music metadata stored in PostgreSQL.
                                """
                )
        );

        return ingestDocument("features-main", "FEATURE", sections);
    }

    private int ingestExperience() {
        log.info("Ingesting EXPERIENCE data...");
        List<Map<String, String>> sections = List.of(
                Map.of(
                        "title", "Work Experience",
                        "content", """
                                Work Experience:

                                Full Stack Developer (Freelance) — 2022-Present
                                - Building full-featured web applications for clients
                                - Specializing in Java/Spring Boot + React/Next.js
                                - Implementing AI integrations and RAG chatbots
                                - DevOps: Docker, CI/CD, cloud deployment

                                Key Projects:
                                - E-commerce platform with payment integration (Stripe)
                                - Portfolio websites with AI chatbots
                                - Microservices demo systems
                                - Real-time chat applications

                                Technical Lead — 2020-2022
                                - Led a team of 3 developers building a CRM system
                                - Designed RESTful APIs and database schemas
                                - Implemented authentication and authorization
                                - Mentored junior developers
                                """
                ),
                Map.of(
                        "title", "Education",
                        "content", """
                                Education:

                                Computer Science Degree (or related field)
                                - Focused on software engineering and web development
                                - Completed courses in data structures, algorithms, databases
                                - Capstone project: AI chatbot with NLP

                                Continuous Learning:
                                - Completed online courses on Udemy, Coursera, Pluralsight
                                - Spring Boot certification
                                - AWS Cloud Practitioner certification
                                - Active contributor to open source projects

                                Technical Blog:
                                - Regular posts about Java, Spring Boot, React, and AI
                                - Tutorials and best practices articles
                                - Published at: cuonghoangdev.com/blog
                                """
                )
        );

        return ingestDocument("experience-main", "EXPERIENCE", sections);
    }

    // ============================================================
    // Core Ingestion Logic
    // ============================================================

    /**
     * Ingest a logical document: chunk → embed → save to DB.
     */
    private int ingestDocument(String documentId, String documentType, List<Map<String, String>> sections) {
        if (!aiService.isConfigured()) {
            log.warn("Gemini API key not configured — skipping ingestion for {}", documentType);
            return 0;
        }

        int embedded = 0;
        int chunkIndex = 0;

        for (Map<String, String> section : sections) {
            String title = section.get("title");
            String content = section.get("content");

            List<ChunkingService.Chunk> chunks = chunkingService.chunk(content);

            for (ChunkingService.Chunk chunk : chunks) {
                String metadataJson = toMetadata(documentId, documentType, title, chunkIndex);

                DocumentChunk entity = new DocumentChunk(
                        chunk.content(),
                        metadataJson,
                        documentId,
                        documentType,
                        chunkIndex
                );

                // Embed now (synchronous for small batches)
                boolean ok = embedAndSave(entity);
                if (ok) {
                    chunkRepository.save(entity);
                    embedded++;
                }

                chunkIndex++;
            }
        }

        log.info("Ingested {} chunks for {} ({})", embedded, documentType, documentId);
        return embedded;
    }

    /**
     * Create Gemini embedding and save the vector string to the entity.
     */
    private boolean embedAndSave(DocumentChunk entity) {
        if (entity.getContent() == null || entity.getContent().isBlank()) return false;

        try {
            AIService.EmbeddingResult result = aiService.createEmbedding(entity.getContent());
            if (!result.success || result.embedding == null) {
                log.warn("Embedding failed for chunk [{}]: {}",
                        entity.getDocumentType(), result.error);
                return false;
            }

            entity.setEmbedding(toPgVectorLiteral(result.embedding));
            return true;
        } catch (Exception e) {
            log.error("Error embedding chunk: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Convert float[] to pgvector literal format: '[f1,f2,...,fn]'
     */
    private String toPgVectorLiteral(float[] vector) {
        if (vector == null || vector.length == 0) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            sb.append(vector[i]);
            if (i < vector.length - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Build metadata JSON with document info.
     */
    private String toMetadata(String documentId, String documentType, String title, int chunkIndex) {
        try {
            Map<String, Object> meta = new LinkedHashMap<>();
            meta.put("documentId", documentId);
            meta.put("documentType", documentType);
            meta.put("title", title);
            meta.put("chunkIndex", chunkIndex);
            meta.put("ingestedAt", LocalDateTime.now().toString());
            return objectMapper.writeValueAsString(meta);
        } catch (Exception e) {
            return "{\"documentId\":\"" + documentId + "\",\"documentType\":\"" + documentType + "\"}";
        }
    }
}
