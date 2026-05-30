package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.CreatePostRequest;
import com.cuonghoangdev.api_backend.dto.PageResponse;
import com.cuonghoangdev.api_backend.dto.PostDto;
import com.cuonghoangdev.api_backend.dto.UpdatePostRequest;
import com.cuonghoangdev.api_backend.entity.Category;
import com.cuonghoangdev.api_backend.entity.Post;
import com.cuonghoangdev.api_backend.entity.Tag;
import com.cuonghoangdev.api_backend.entity.User;
import com.cuonghoangdev.api_backend.exception.BadRequestException;
import com.cuonghoangdev.api_backend.exception.ResourceNotFoundException;
import com.cuonghoangdev.api_backend.repository.CategoryRepository;
import com.cuonghoangdev.api_backend.repository.PostRepository;
import com.cuonghoangdev.api_backend.repository.TagRepository;
import com.cuonghoangdev.api_backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class PostService {

    private static final Logger log = LoggerFactory.getLogger(PostService.class);

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final DocumentIndexingService documentIndexingService;

    public PostService(PostRepository postRepository,
                       CategoryRepository categoryRepository,
                       TagRepository tagRepository,
                       UserRepository userRepository,
                       DocumentIndexingService documentIndexingService) {
        this.postRepository = postRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.userRepository = userRepository;
        this.documentIndexingService = documentIndexingService;
    }

    // ============ PUBLIC (Cached) ============

    public PageResponse<PostDto> getPublishedPosts(int page, int size, String categorySlug) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("publishedAt").descending());
        Page<Post> posts;
        if (categorySlug == null || categorySlug.isBlank()) {
            posts = postRepository.findByStatus("PUBLISHED", pageable);
        } else {
            posts = postRepository.findByStatusAndCategorySlug("PUBLISHED", categorySlug, pageable);
        }
        return toPageResponse(posts);
    }

    @Cacheable(value = "posts", key = "'featured'")
    public List<PostDto> getFeaturedPosts() {
        List<Post> posts = postRepository.findFeaturedPosts(PageRequest.of(0, 5));
        return posts.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Cacheable(value = "posts", key = "'popular'")
    public List<PostDto> getPopularPosts(int limit) {
        List<Post> posts = postRepository.findTopByViewCount(PageRequest.of(0, limit));
        return posts.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Cacheable(value = "posts", key = "'slug:' + #slug")
    public PostDto getPostBySlug(String slug) {
        Post post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Post", "slug", slug));
        return toDto(post);
    }

    public PageResponse<PostDto> searchPosts(String keyword, String categorySlug, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository.searchPosts(keyword, categorySlug, pageable);
        return toPageResponse(posts);
    }

    // ============ ADMIN (Evict cache) ============

    public PageResponse<PostDto> getAllPostsForAdmin(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<Post> posts = postRepository.findAll(pageable);
        return toPageResponse(posts);
    }

    public PageResponse<PostDto> searchPostsAdmin(String keyword, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> posts = postRepository.searchPostsAdmin(keyword, status, pageable);
        return toPageResponse(posts);
    }

    @Caching(evict = {
            @CacheEvict(value = "posts", allEntries = true)
    })
    public PostDto createPost(CreatePostRequest request, Long authorId) {
        if (postRepository.existsBySlug(request.getSlug())) {
            throw new BadRequestException("Slug already exists: " + request.getSlug());
        }

        Post post = new Post();
        post.setTitle(request.getTitle());
        post.setSlug(request.getSlug());
        post.setExcerpt(request.getExcerpt());
        post.setContent(request.getContent());
        post.setThumbnailUrl(request.getThumbnailUrl());
        post.setStatus(request.getStatus() != null ? request.getStatus() : "DRAFT");

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
            post.setCategory(category);
        }

        if (authorId != null) {
            User author = userRepository.findById(authorId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", authorId));
            post.setAuthor(author);
        }

        if ("PUBLISHED".equals(post.getStatus()) && post.getPublishedAt() == null) {
            post.setPublishedAt(LocalDateTime.now());
        }

        if (request.getTagNames() != null && !request.getTagNames().isEmpty()) {
            for (String tagName : request.getTagNames()) {
                Tag tag = tagRepository.findByName(tagName)
                        .orElseGet(() -> tagRepository.save(new Tag(tagName, slugify(tagName))));
                post.addTag(tag);
            }
        }

        Post saved = postRepository.save(post);

        // Tự động index vào vector database nếu là post PUBLISHED
        indexPostToVector(saved);

        return toDto(saved);
    }

    /**
     * Index một post vào vector database
     */
    private void indexPostToVector(Post post) {
        if (!"PUBLISHED".equals(post.getStatus())) {
            log.debug("Post {} chua xuat ban, khong index", post.getSlug());
            return;
        }

        try {
            // Xây dựng content để index
            StringBuilder contentToIndex = new StringBuilder();
            contentToIndex.append(post.getTitle()).append(". ");
            if (post.getExcerpt() != null) {
                contentToIndex.append(post.getExcerpt()).append(" ");
            }
            contentToIndex.append(post.getContent());

            // Xây dựng metadata
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("title", post.getTitle());
            metadata.put("slug", post.getSlug());
            if (post.getCategory() != null) {
                metadata.put("category", post.getCategory().getName());
            }
            if (post.getAuthor() != null) {
                String authorName = post.getAuthor().getFullName() != null
                        ? post.getAuthor().getFullName()
                        : post.getAuthor().getUsername();
                metadata.put("author", authorName);
            }
            if (post.getTags() != null && !post.getTags().isEmpty()) {
                metadata.put("tags", post.getTags().stream()
                        .map(Tag::getName)
                        .collect(Collectors.joining(", ")));
            }

            // Index
            com.cuonghoangdev.api_backend.dto.DocumentIndexRequest indexRequest =
                    new com.cuonghoangdev.api_backend.dto.DocumentIndexRequest();
            indexRequest.setDocumentId("post_" + post.getId());
            indexRequest.setDocumentType("posts");
            indexRequest.setContent(contentToIndex.toString());
            indexRequest.setMetadata(metadata);

            documentIndexingService.indexDocument(indexRequest);
            log.info("Da index post {} vao vector database", post.getSlug());

        } catch (Exception e) {
            // Không throw exception để không ảnh hưởng đến việc lưu post
            log.error("Loi khi index post {}: {}", post.getSlug(), e.getMessage());
        }
    }

    /**
     * Xóa post khỏi vector database
     */
    private void deletePostFromVector(Long postId) {
        try {
            documentIndexingService.deleteDocument("post_" + postId);
            log.info("Da xoa post {} khoi vector database", postId);
        } catch (Exception e) {
            log.error("Loi khi xoa post {} khoi vector: {}", postId, e.getMessage());
        }
    }

    @Caching(evict = {
            @CacheEvict(value = "posts", allEntries = true)
    })
    public PostDto updatePost(Long id, UpdatePostRequest request) {
        Post post = postRepository.findByIdWithTags(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post", "id", id));

        if (request.getSlug() != null && !request.getSlug().equals(post.getSlug())
                && postRepository.existsBySlug(request.getSlug())) {
            throw new BadRequestException("Slug already exists: " + request.getSlug());
        }

        if (request.getTitle() != null) post.setTitle(request.getTitle());
        if (request.getSlug() != null) post.setSlug(request.getSlug());
        if (request.getExcerpt() != null) post.setExcerpt(request.getExcerpt());
        if (request.getContent() != null) post.setContent(request.getContent());
        if (request.getThumbnailUrl() != null) post.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getIsFeatured() != null) post.setIsFeatured(request.getIsFeatured());

        if (request.getStatus() != null) {
            String oldStatus = post.getStatus();
            post.setStatus(request.getStatus());
            if ("PUBLISHED".equals(request.getStatus()) && !"PUBLISHED".equals(oldStatus)) {
                post.setPublishedAt(LocalDateTime.now());
            }
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
            post.setCategory(category);
        }

        if (request.getTagNames() != null) {
            post.getTags().clear();
            for (String tagName : request.getTagNames()) {
                Tag tag = tagRepository.findByName(tagName)
                        .orElseGet(() -> tagRepository.save(new Tag(tagName, slugify(tagName))));
                post.addTag(tag);
            }
        }

        Post saved = postRepository.save(post);

        // Re-index vào vector database nếu là post PUBLISHED
        indexPostToVector(saved);

        return toDto(saved);
    }

    @Caching(evict = {
            @CacheEvict(value = "posts", allEntries = true)
    })
    public void deletePost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post", "id", id));

        // Xóa khỏi vector database
        deletePostFromVector(id);

        postRepository.delete(post);
    }

    @Caching(evict = {
            @CacheEvict(value = "posts", key = "'slug:' + #slug")
    })
    public void incrementViewCount(String slug) {
        Post post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Post", "slug", slug));
        postRepository.incrementViewCount(post.getId());
    }

    // ============ HELPERS ============

    private PostDto toDto(Post post) {
        PostDto dto = new PostDto();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setSlug(post.getSlug());
        dto.setExcerpt(post.getExcerpt());
        dto.setContent(post.getContent());
        dto.setThumbnailUrl(post.getThumbnailUrl());
        dto.setStatus(post.getStatus());
        dto.setViewCount(post.getViewCount());
        dto.setIsFeatured(post.getIsFeatured());
        dto.setPublishedAt(post.getPublishedAt());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());

        if (post.getCategory() != null) {
            dto.setCategoryId(post.getCategory().getId());
            dto.setCategoryName(post.getCategory().getName());
            dto.setCategorySlug(post.getCategory().getSlug());
        }
        if (post.getAuthor() != null) {
            dto.setAuthorId(post.getAuthor().getId());
            dto.setAuthorName(post.getAuthor().getFullName() != null
                    ? post.getAuthor().getFullName() : post.getAuthor().getUsername());
        }
        if (post.getTags() != null && !post.getTags().isEmpty()) {
            dto.setTagNames(post.getTags().stream()
                    .map(Tag::getName).collect(Collectors.toList()));
        }
        return dto;
    }

    private PageResponse<PostDto> toPageResponse(Page<Post> page) {
        List<PostDto> content = page.getContent().stream().map(this::toDto).collect(Collectors.toList());
        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    private String slugify(String text) {
        return text.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();
    }
}
