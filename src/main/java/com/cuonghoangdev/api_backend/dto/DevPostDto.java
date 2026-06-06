package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.DevPost;
import com.cuonghoangdev.api_backend.entity.PostComment;

import java.time.LocalDateTime;
import java.util.List;

public class DevPostDto {

    public Long id;
    public String title;
    public String description;
    public String content;
    public String sourceUrl;
    public Integer downloadCount;
    public String category;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public List<CommentDto> comments;
    public int commentCount;

    public DevPostDto() {}

    public static DevPostDto fromEntity(DevPost entity) {
        DevPostDto dto = new DevPostDto();
        dto.id = entity.getId();
        dto.title = entity.getTitle();
        dto.description = entity.getDescription();
        dto.content = entity.getContent();
        dto.sourceUrl = entity.getSourceUrl();
        dto.downloadCount = entity.getDownloadCount();
        dto.category = entity.getCategory();
        dto.createdAt = entity.getCreatedAt();
        dto.updatedAt = entity.getUpdatedAt();
        return dto;
    }

    public static DevPostDto fromEntityWithComments(DevPost entity) {
        DevPostDto dto = fromEntity(entity);
        if (entity.getComments() != null) {
            dto.comments = entity.getComments().stream()
                .map(CommentDto::fromEntity)
                .toList();
            dto.commentCount = dto.comments.size();
        }
        return dto;
    }

    // Simple card DTO without content (for listing)
    public static class CardDto {
        public Long id;
        public String title;
        public String description;
        public String category;
        public String sourceUrl;
        public Integer downloadCount;
        public int commentCount;
        public LocalDateTime createdAt;

        public static CardDto fromEntity(DevPost entity, int commentCount) {
            CardDto dto = new CardDto();
            dto.id = entity.getId();
            dto.title = entity.getTitle();
            dto.description = entity.getDescription();
            dto.category = entity.getCategory();
            dto.sourceUrl = entity.getSourceUrl();
            dto.downloadCount = entity.getDownloadCount();
            dto.commentCount = commentCount;
            dto.createdAt = entity.getCreatedAt();
            return dto;
        }
    }

    public static class CommentDto {
        public Long id;
        public String userName;
        public String userAvatar;
        public String commentText;
        public LocalDateTime createdAt;

        public static CommentDto fromEntity(PostComment entity) {
            CommentDto dto = new CommentDto();
            dto.id = entity.getId();
            dto.userName = entity.getUserName();
            dto.userAvatar = entity.getUserAvatar();
            dto.commentText = entity.getCommentText();
            dto.createdAt = entity.getCreatedAt();
            return dto;
        }
    }
}
