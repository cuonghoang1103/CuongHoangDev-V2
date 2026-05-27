package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.DocumentIndexRequest;
import com.cuonghoangdev.api_backend.entity.Post;
import com.cuonghoangdev.api_backend.entity.User;
import com.cuonghoangdev.api_backend.repository.PostRepository;
import com.cuonghoangdev.api_backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service quản lý việc nạp tri thức vào vector database
 * - Index tất cả posts đã publish
 * - Index thông tin profile cá nhân
 * - Index kỹ năng (skills)
 * - Index dự án (projects)
 */
@Service
public class KnowledgeIngestionService {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeIngestionService.class);

    private final DocumentIndexingService documentIndexingService;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public KnowledgeIngestionService(DocumentIndexingService documentIndexingService,
                                   PostRepository postRepository,
                                   UserRepository userRepository) {
        this.documentIndexingService = documentIndexingService;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    /**
     * Index tất cả posts đã publish
     */
    @Transactional(readOnly = true)
    public int indexAllPublishedPosts() {
        log.info("Bat dau index tat ca posts da xuat ban...");

        List<Post> publishedPosts = postRepository.findByStatus("PUBLISHED");

        int count = 0;
        for (Post post : publishedPosts) {
            try {
                indexPost(post);
                count++;
            } catch (Exception e) {
                log.error("Loi khi index post {}: {}", post.getSlug(), e.getMessage());
            }
        }

        log.info("Da index {} posts", count);
        return count;
    }

    /**
     * Index một post cụ thể
     */
    public void indexPost(Post post) {
        if (!"PUBLISHED".equals(post.getStatus())) {
            log.debug("Post {} chua xuat ban, bo qua", post.getSlug());
            return;
        }

        StringBuilder content = new StringBuilder();
        content.append(post.getTitle()).append(". ");
        if (post.getExcerpt() != null) {
            content.append(post.getExcerpt()).append(" ");
        }
        content.append(post.getContent());

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("title", post.getTitle());
        metadata.put("slug", post.getSlug());
        if (post.getCategory() != null) {
            metadata.put("category", post.getCategory().getName());
        }
        if (post.getAuthor() != null) {
            metadata.put("author", post.getAuthor().getFullName() != null
                    ? post.getAuthor().getFullName()
                    : post.getAuthor().getUsername());
        }
        if (post.getTags() != null && !post.getTags().isEmpty()) {
            metadata.put("tags", post.getTags().stream()
                    .map(t -> t.getName())
                    .toList());
        }

        DocumentIndexRequest request = new DocumentIndexRequest();
        request.setDocumentId("post_" + post.getId());
        request.setDocumentType("posts");
        request.setContent(content.toString());
        request.setMetadata(metadata);

        documentIndexingService.indexDocument(request);
    }

    /**
     * Index thông tin profile cá nhân
     */
    @Transactional(readOnly = true)
    public int indexAllProfiles() {
        log.info("Bat dau index tat ca profiles...");

        List<User> users = userRepository.findAll();
        int count = 0;

        for (User user : users) {
            try {
                indexUserProfile(user);
                count++;
            } catch (Exception e) {
                log.error("Loi khi index profile user {}: {}", user.getUsername(), e.getMessage());
            }
        }

        log.info("Da index {} profiles", count);
        return count;
    }

    /**
     * Index profile của một user cụ thể
     */
    public void indexUserProfile(User user) {
        StringBuilder content = new StringBuilder();

        // Tên và username
        content.append("Ho va ten: ")
                .append(user.getFullName() != null ? user.getFullName() : user.getUsername())
                .append(". ");

        // Email
        if (user.getEmail() != null) {
            content.append("Email: ").append(user.getEmail()).append(". ");
        }

        // Giới thiệu bản thân (nếu có trường bio)
        if (user.getBio() != null) {
            content.append("Gioi thieu: ").append(user.getBio()).append(". ");
        }

        // Kỹ năng từ roles
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            content.append("Vai tro: ");
            user.getRoles().forEach(role ->
                    content.append(role.getName()).append(", "));
            content.append(". ");
        }

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("username", user.getUsername());
        metadata.put("type", "profile");

        DocumentIndexRequest request = new DocumentIndexRequest();
        request.setDocumentId("profile_" + user.getId());
        request.setDocumentType("profile");
        request.setContent(content.toString());
        request.setMetadata(metadata);

        documentIndexingService.indexDocument(request);
    }

    /**
     * Index tất cả tri thức (posts + profiles)
     */
    @Transactional(readOnly = true)
    public IndexingResult indexAllKnowledge() {
        log.info("Bat dau index toan bo tri thuc...");

        IndexingResult result = new IndexingResult();

        // Index posts
        result.postsIndexed = indexAllPublishedPosts();

        // Index profiles
        result.profilesIndexed = indexAllProfiles();

        log.info("Hoan tat index: {} posts, {} profiles", result.postsIndexed, result.profilesIndexed);
        return result;
    }

    /**
     * Tái index toàn bộ tri thức (xóa hết và tạo lại)
     */
    @Transactional(readOnly = true)
    public IndexingResult reindexAllKnowledge() {
        log.warn("Bat dau reindex toan bo tri thuc...");

        // TODO: Xóa toàn bộ document_chunks trước khi reindex
        // Hiện tại để như vậy vì deleteDocument chỉ xóa theo document_id

        return indexAllKnowledge();
    }

    /**
     * Xóa toàn bộ knowledge khỏi vector database
     */
    @Transactional(readOnly = true)
    public void clearAllKnowledge() {
        log.warn("Xoa toan bo tri thuc khoi vector database...");

        // Lấy danh sách document types
        List<String> types = List.of("posts", "profile");

        for (String type : types) {
            documentIndexingService.deleteAllByDocumentType(type);
        }

        log.info("Da xoa toan bo tri thuc");
    }

    /**
     * Inner class để lưu kết quả indexing
     */
    public static class IndexingResult {
        public int postsIndexed = 0;
        public int profilesIndexed = 0;
        public int skillsIndexed = 0;
        public int projectsIndexed = 0;
        public int errors = 0;

        @Override
        public String toString() {
            return String.format("IndexingResult{posts=%d, profiles=%d, skills=%d, projects=%d, errors=%d}",
                    postsIndexed, profilesIndexed, skillsIndexed, projectsIndexed, errors);
        }
    }
}
