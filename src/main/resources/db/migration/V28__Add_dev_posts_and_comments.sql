-- V28__Add_dev_posts_and_comments.sql
-- Dev Sharing & Source Code Hub: posts + technical discussion comments

-- Bảng lưu trữ bài viết chia sẻ và mã nguồn
CREATE TABLE dev_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    source_url VARCHAR(555),
    download_count INT DEFAULT 0,
    category VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lưu trữ bình luận/trao đổi kỹ thuật
CREATE TABLE post_comments (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES dev_posts(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    user_avatar VARCHAR(255),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index cho hiệu suất truy vấn
CREATE INDEX idx_dev_posts_category ON dev_posts(category);
CREATE INDEX idx_dev_posts_download_count ON dev_posts(download_count DESC);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);

-- Seed sample data
INSERT INTO dev_posts (title, description, content, source_url, download_count, category) VALUES
(
    'Spring Security JWT Authentication Pattern',
    'Clean implementation of stateless JWT auth with refresh token rotation and role-based access control for Spring Boot 3.',
    E'## Overview\n\nThis pattern implements **stateless JWT authentication** with refresh token rotation — the industry standard for secure API access.\n\n## Key Features\n\n- Access token (15 min) + Refresh token (7 days)\n- Automatic rotation on refresh\n- Role-based endpoint protection\n- Blacklist support for logout\n\n## Core Snippet\n\n```java\n@PostMapping("/auth/login")\npublic ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {\n    User user = userRepo.findByEmail(req.email())\n        .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));\n\n    if (!passwordEncoder.matches(req.password(), user.getPassword())) {\n        throw new BadCredentialsException("Invalid credentials");\n    }\n\n    String accessToken = jwtProvider.generateAccessToken(user);\n    String refreshToken = jwtProvider.generateRefreshToken(user);\n\n    refreshTokenRepo.save(new RefreshToken(user, refreshToken, Instant.now().plus(7, ChronoUnit.DAYS)));\n\n    return ResponseEntity.ok(new AuthResponse(accessToken, refreshToken));\n}\n```\n\n## Security Considerations\n\n1. **Never** store tokens in localStorage — use httpOnly cookies\n2. Implement token blacklist with Redis for immediate logout\n3. Rate-limit the refresh endpoint\n4. Bind refresh token to user agent + IP hash',
    'https://github.com/cuonghoangdev/spring-security-jwt',
    342
),
(
    'React useSyncExternalStore Pattern for Global State',
    'A production-ready implementation of the React 18 recommended pattern for connecting Zustand/Jotai stores to Suspense boundaries.',
    E'## Why useSyncExternalStore?\n\nReact 18 made this hook mandatory for external store integrations. It ensures **consistency between SSR and client hydration**.\n\n## Implementation\n\n```typescript\nimport { useSyncExternalStore } from "react";\n\nexport function useStore<T>(selector: (state: StoreState) => T): T {\n  const subscribe = useCallback((callback: () => void) => {\n    const unsubscribe = store.subscribe(callback);\n    return unsubscribe;\n  }, []);\n\n  const getSnapshot = useCallback(() => selector(store.getState()), [selector]);\n\n  const getServerSnapshot = useCallback(\n    () => selector(initialState),\n    [selector]\n  );\n\n  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);\n}\n```\n\n## Common Pitfalls\n\n- `getSnapshot` must return the same reference if data hasn''t changed\n- Always provide `getServerSnapshot` for SSR support\n- Use `useCallback` on all callbacks to prevent infinite re-renders',
    'https://github.com/cuonghoangdev/react-useSyncExternalStore',
    218
),
(
    'PostgreSQL Row-Level Security with Supabase',
    'Implementing fine-grained RLS policies for multi-tenant SaaS — users can only see their own data with zero application-level filtering.',
    E'## The Problem\n\nIn multi-tenant apps, accidentally leaking tenant A''s data to tenant B is a catastrophic bug. **RLS makes this impossible at the database level.**\n\n## Setup\n\n```sql\n-- Enable RLS\nALTER TABLE orders ENABLE ROW LEVEL SECURITY;\n\n-- Policy: users only see their own orders\nCREATE POLICY tenant_isolation ON orders\n  USING (user_id = auth.uid());\n\n-- Service role bypass (for migrations/admin)\nALTER TABLE orders FORCE ROW LEVEL SECURITY;\n```\n\n## Best Practices\n\n1. **Always test with anon key**, never service_role\n2. Combine RLS with **column-level security** for sensitive fields\n3. Use **security definer** functions for cross-table queries\n4. Add `current_setting()` context checks for org-level isolation',
    'https://github.com/cuonghoangdev/postgres-rls-supabase',
    156
),
(
    'Docker Multi-Stage Build for Next.js Production',
    'Optimized Dockerfile that produces a ~180MB image instead of ~1.2GB by separating dependencies, build, and runtime stages.',
    E'## Why Multi-Stage?\n\nA standard Next.js Dockerfile includes dev dependencies, test tooling, and source files in the final image. Multi-stage builds **copy only what''s needed**.\n\n## Optimized Dockerfile\n\n```dockerfile\n# Stage 1: Dependencies\nFROM node:20-alpine AS deps\nWORKDIR /app\nCOPY package.json package-lock.json ./\nRUN npm ci --only=production && npm cache clean --force\n\n# Stage 2: Build\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY --from=deps /app/node_modules ./node_modules\nCOPY . .\nRUN npm run build\n\n# Stage 3: Runtime\nFROM node:20-alpine AS runner\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=builder /app/public ./public\nCOPY --from=builder /app/.next/standalone ./\nCOPY --from=builder /app/.next/static ./.next/static\nEXPOSE 3000\nCMD ["node", "server.js"]\n```\n\n## Result\n\n| Approach | Image Size | Build Time |\n|----------|-----------|------------|\n| Single-stage | ~1.2 GB | 3m 20s |\n| Multi-stage | ~180 MB | 4m 10s |',
    'https://github.com/cuonghoangdev/nextjs-docker-multi-stage',
    489
),
(
    'Go Concurrency Patterns: Worker Pool with Context Cancellation',
    'Production-grade worker pool implementation in Go using goroutines, channels, and context.Context for graceful shutdown.',
    E'## Architecture\n\n```go\ntype WorkerPool struct {\n    workers int\n    jobs    chan Job\n    results chan Result\n    wg      sync.WaitGroup\n    ctx     context.Context\n    cancel  context.CancelFunc\n}\n\nfunc New(workers int, bufSize int) *WorkerPool {\n    ctx, cancel := context.WithCancel(context.Background())\n    return &WorkerPool{\n        workers: workers,\n        jobs:    make(chan Job, bufSize),\n        results: make(chan Result, bufSize),\n        ctx:     ctx,\n        cancel:  cancel,\n    }\n}\n\nfunc (p *WorkerPool) Start() {\n    for i := 0; i < p.workers; i++ {\n        p.wg.Add(1)\n        go p.worker(i)\n    }\n}\n\nfunc (p *WorkerPool) worker(id int) {\n    defer p.wg.Done()\n    for {\n        select {\n        case job, ok := <-p.jobs:\n            if !ok { return }\n            p.results <- job.Process()\n        case <-p.ctx.Done():\n            return\n        }\n    }\n}\n```\n\n## Graceful Shutdown\n\n```go\nfunc (p *WorkerPool) Shutdown(timeout time.Duration) {\n    p.cancel()\n    close(p.jobs)\n    done := make(chan struct{})\n    go func() {\n        p.wg.Wait()\n        close(done)\n        close(p.results)\n    }()\n    select {\n    case <-done:\n    case <-time.After(timeout):\n        log.Fatal("shutdown timeout exceeded")\n    }\n}\n```',
    'https://github.com/cuonghoangdev/go-worker-pool',
    267
),
(
    'TypeScript Discriminated Unions for API Error Handling',
    'Replace try/catch chaos with a clean discriminated union pattern that makes every error state explicit at the type level.',
    E'## The Problem\n\n`try/catch` throws away type information. `Result<T, E>` makes every error state **explicit and exhaustive**.\n\n## Implementation\n\n```typescript\ntype Ok<T> = { success: true; data: T };\ntype Err<E> = { success: false; error: E };\ntype Result<T, E = string> = Ok<T> | Err<E>;\n\nasync function fetchUser(id: string): Promise<Result<User, ApiError>> {\n  const res = await fetch(`/api/users/${id}`);\n  if (!res.ok) {\n    return {\n      success: false,\n      error: { code: res.status, message: await res.text() }\n    };\n  }\n  return { success: true, data: await res.json() };\n}\n\n// Usage with exhaustive checking\nconst result = await fetchUser("123");\nif (result.success) {\n  console.log(result.data.name);\n} else {\n  // TypeScript knows result.error exists here\n  console.error(`Error ${result.error.code}: ${result.error.message}`);\n}\n```\n\n## Why This Beats try/catch\n\n1. Errors are **values**, not control flow\n2. TypeScript enforces **exhaustive handling**\n3. Works perfectly with **async/await**\n4. Easy to compose with `Result.map`, `Result.flatMap`',
    'https://github.com/cuonghoangdev/ts-result-pattern',
    198
);

-- Seed comments
INSERT INTO post_comments (post_id, user_name, user_avatar, comment_text) VALUES
(1, 'NguyenMinhTuan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhTuan', E'Thanks for sharing! The refresh token rotation part saved me hours of debugging. One note: consider using Redis for the blacklist — it scales better than an in-memory Map in production.'),
(1, 'tran_thi_lan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=LanTran', E'Clean implementation. I extended this with device fingerprint binding and it works great for fraud detection.'),
(2, 'dev_khoi', 'https://api.dicebear.com/7.x/avataaars/svg?seed=KhoiDev', E'This is exactly what I was looking for. The SSR hydration issue with Zustand has been a pain for months. Bookmarked.'),
(2, 'le_anh_nam', 'https://api.dicebear.com/7.x/avataaars/svg?seed=NamLe', E'Would be great to see this combined with React Server Components in Next.js 14 App Router. The boundaries are different there.'),
(3, 'hoang_van_b', 'https://api.dicebear.com/7.x/avataaars/svg?seed=VanB', E'RLS is underrated. We migrated our entire multi-tenant logic to RLS and deleted ~400 lines of WHERE clauses from our application code.'),
(3, 'pham_thi_h', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThiH', E'One thing to add: remember to also set RLS on the storage bucket policies in Supabase if you store user files there. Easy to forget.'),
(4, 'nguyen_van_c', 'https://api.dicebear.com/7.x/avataaars/svg?seed=VanCNguyen', E'The Alpine base image choice is key here. Dropping from 1.2GB to 180MB is massive for cold start times in serverless.'),
(4, 'do_thi_m', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThiM', E'Nice! I also added a layer caching step with GitHub Actions cache to bring build time down to ~90 seconds on subsequent builds.'),
(5, 'phuc_le', 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhucLe', E'This is textbook Go concurrency done right. The context cancellation propagation is the part most tutorials skip over.'),
(5, 'vo_thi_n', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThiNVo', E'Beautiful. Would love to see this extended with a semaphore for limiting concurrent DB connections in the worker pool.'),
(6, 'bui_van_d', 'https://api.dicebear.com/7.x/avataaars/svg?seed=VanDBui', E'This pattern changed how I think about error handling. Gone are the days of silent failures and untyped catch blocks.'),
(6, 'truong_thi_a', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThiA', E'Combined this with a fp-ts Either type for even stronger guarantees. The TypeScript inference works perfectly with discriminated unions.');
