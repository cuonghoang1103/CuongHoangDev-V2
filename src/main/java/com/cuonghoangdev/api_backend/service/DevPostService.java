package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.DevPostDto;
import com.cuonghoangdev.api_backend.entity.DevPost;
import com.cuonghoangdev.api_backend.entity.PostComment;
import com.cuonghoangdev.api_backend.repository.DevPostRepository;
import com.cuonghoangdev.api_backend.repository.PostCommentRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DevPostService {

    private final DevPostRepository devPostRepository;
    private final PostCommentRepository commentRepository;

    public DevPostService(DevPostRepository devPostRepository, PostCommentRepository commentRepository) {
        this.devPostRepository = devPostRepository;
        this.commentRepository = commentRepository;
    }

    public List<DevPostDto.CardDto> getAllPosts() {
        return devPostRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(post -> DevPostDto.CardDto.fromEntity(post, commentRepository.countByPostId(post.getId())))
            .toList();
    }

    public List<DevPostDto.CardDto> getPostsByCategory(String category) {
        return devPostRepository.findByCategoryOrderByDownloadCountDesc(category).stream()
            .map(post -> DevPostDto.CardDto.fromEntity(post, commentRepository.countByPostId(post.getId())))
            .toList();
    }

    public List<String> getAllCategories() {
        return devPostRepository.findAllCategories();
    }

    public DevPostDto getPostById(Long id) {
        DevPost post = devPostRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Post not found: " + id));
        return DevPostDto.fromEntityWithComments(post);
    }

    @Transactional
    public DevPostDto createPost(String title, String description, String content,
                                  String sourceUrl, String category) {
        DevPost post = new DevPost();
        post.setTitle(title);
        post.setDescription(description);
        post.setContent(content);
        post.setSourceUrl(sourceUrl);
        post.setCategory(category != null ? category : "General");
        post.setDownloadCount(0);
        post = devPostRepository.save(post);
        return DevPostDto.fromEntity(post);
    }

    @Transactional
    public DevPostDto updatePost(Long id, String title, String description, String content,
                                  String sourceUrl, String category) {
        DevPost post = devPostRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Post not found: " + id));
        if (title != null) post.setTitle(title);
        if (description != null) post.setDescription(description);
        if (content != null) post.setContent(content);
        if (sourceUrl != null) post.setSourceUrl(sourceUrl);
        if (category != null) post.setCategory(category);
        post = devPostRepository.save(post);
        return DevPostDto.fromEntity(post);
    }

    @Transactional
    public void deletePost(Long id) {
        if (!devPostRepository.existsById(id)) {
            throw new EntityNotFoundException("Post not found: " + id);
        }
        devPostRepository.deleteById(id);
    }

    @Transactional
    public String recordDownloadAndGetUrl(Long id) {
        DevPost post = devPostRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Post not found: " + id));
        devPostRepository.incrementDownloadCount(id);
        return post.getSourceUrl();
    }

    @Transactional
    public DevPostDto.CommentDto addComment(Long postId, String userName, String userAvatar, String commentText) {
        DevPost post = devPostRepository.findById(postId)
            .orElseThrow(() -> new EntityNotFoundException("Post not found: " + postId));
        PostComment comment = new PostComment();
        comment.setPost(post);
        comment.setUserName(userName != null ? userName : "Anonymous");
        comment.setUserAvatar(userAvatar);
        comment.setCommentText(commentText);
        comment = commentRepository.save(comment);
        return DevPostDto.CommentDto.fromEntity(comment);
    }
}
