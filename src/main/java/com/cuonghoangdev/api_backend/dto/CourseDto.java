package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.Course;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class CourseDto {
    private Long id;
    private String title;
    private String courseCode;
    private String slug;
    private String shortDescription;
    private String description;
    private String thumbnailUrl;
    private String previewVideoUrl;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private LocalDateTime discountExpiresAt;
    private String level;
    private String language;
    private String academyType;
    private Boolean isFree;
    private Boolean isFeatured;
    private Boolean isPublished;
    private LocalDateTime publishedAt;
    private Integer totalDurationSeconds;
    private Integer totalLessons;
    private Integer totalStudents;
    private Integer totalReviews;
    private BigDecimal avgRating;
    private String requirements;
    private String whatYouLearn;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Long categoryId;
    private String categoryName;
    private String categorySlug;

    private Long instructorId;
    private String instructorName;
    private String instructorAvatar;

    private Long semesterId;
    private String semesterName;
    private String semesterCode;
    private Integer semesterOrdinal;
    private SemesterDto semester;

    private List<CourseSectionDto> sections;
    private List<String> tags;
    private Boolean isEnrolled;
    private BigDecimal enrollmentProgress;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getShortDescription() { return shortDescription; }
    public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public String getPreviewVideoUrl() { return previewVideoUrl; }
    public void setPreviewVideoUrl(String previewVideoUrl) { this.previewVideoUrl = previewVideoUrl; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getDiscountPrice() { return discountPrice; }
    public void setDiscountPrice(BigDecimal discountPrice) { this.discountPrice = discountPrice; }
    public LocalDateTime getDiscountExpiresAt() { return discountExpiresAt; }
    public void setDiscountExpiresAt(LocalDateTime discountExpiresAt) { this.discountExpiresAt = discountExpiresAt; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getAcademyType() { return academyType; }
    public void setAcademyType(String academyType) { this.academyType = academyType; }
    public Boolean getIsFree() { return isFree; }
    public void setIsFree(Boolean isFree) { this.isFree = isFree; }
    public Boolean getIsFeatured() { return isFeatured; }
    public void setIsFeatured(Boolean isFeatured) { this.isFeatured = isFeatured; }
    public Boolean getIsPublished() { return isPublished; }
    public void setIsPublished(Boolean isPublished) { this.isPublished = isPublished; }
    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }
    public Integer getTotalDurationSeconds() { return totalDurationSeconds; }
    public void setTotalDurationSeconds(Integer totalDurationSeconds) { this.totalDurationSeconds = totalDurationSeconds; }
    public Integer getTotalLessons() { return totalLessons; }
    public void setTotalLessons(Integer totalLessons) { this.totalLessons = totalLessons; }
    public Integer getTotalStudents() { return totalStudents; }
    public void setTotalStudents(Integer totalStudents) { this.totalStudents = totalStudents; }
    public Integer getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Integer totalReviews) { this.totalReviews = totalReviews; }
    public BigDecimal getAvgRating() { return avgRating; }
    public void setAvgRating(BigDecimal avgRating) { this.avgRating = avgRating; }
    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }
    public String getWhatYouLearn() { return whatYouLearn; }
    public void setWhatYouLearn(String whatYouLearn) { this.whatYouLearn = whatYouLearn; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public String getCategorySlug() { return categorySlug; }
    public void setCategorySlug(String categorySlug) { this.categorySlug = categorySlug; }
    public Long getInstructorId() { return instructorId; }
    public void setInstructorId(Long instructorId) { this.instructorId = instructorId; }
    public String getInstructorName() { return instructorName; }
    public void setInstructorName(String instructorName) { this.instructorName = instructorName; }
    public String getInstructorAvatar() { return instructorAvatar; }
    public void setInstructorAvatar(String instructorAvatar) { this.instructorAvatar = instructorAvatar; }
    public Long getSemesterId() { return semesterId; }
    public void setSemesterId(Long semesterId) { this.semesterId = semesterId; }
    public String getSemesterName() { return semesterName; }
    public void setSemesterName(String semesterName) { this.semesterName = semesterName; }
    public String getSemesterCode() { return semesterCode; }
    public void setSemesterCode(String semesterCode) { this.semesterCode = semesterCode; }
    public Integer getSemesterOrdinal() { return semesterOrdinal; }
    public void setSemesterOrdinal(Integer semesterOrdinal) { this.semesterOrdinal = semesterOrdinal; }
    public SemesterDto getSemester() { return semester; }
    public void setSemester(SemesterDto semester) { this.semester = semester; }
    public List<CourseSectionDto> getSections() { return sections; }
    public void setSections(List<CourseSectionDto> sections) { this.sections = sections; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public Boolean getIsEnrolled() { return isEnrolled; }
    public void setIsEnrolled(Boolean isEnrolled) { this.isEnrolled = isEnrolled; }
    public BigDecimal getEnrollmentProgress() { return enrollmentProgress; }
    public void setEnrollmentProgress(BigDecimal enrollmentProgress) { this.enrollmentProgress = enrollmentProgress; }

    public static CourseDto fromEntity(Course entity) {
        CourseDto dto = new CourseDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setCourseCode(entity.getCourseCode());
        dto.setSlug(entity.getSlug());
        dto.setShortDescription(entity.getShortDescription());
        dto.setDescription(entity.getDescription());
        dto.setThumbnailUrl(entity.getThumbnailUrl());
        dto.setPreviewVideoUrl(entity.getPreviewVideoUrl());
        dto.setPrice(entity.getPrice());
        dto.setDiscountPrice(entity.getDiscountPrice());
        dto.setDiscountExpiresAt(entity.getDiscountExpiresAt());
        dto.setLevel(entity.getLevel());
        dto.setLanguage(entity.getLanguage());
        dto.setAcademyType(entity.getAcademyType());
        dto.setIsFree(entity.getIsFree());
        dto.setIsFeatured(entity.getIsFeatured());
        dto.setIsPublished(entity.getIsPublished());
        dto.setPublishedAt(entity.getPublishedAt());
        dto.setTotalDurationSeconds(entity.getTotalDurationSeconds());
        dto.setTotalLessons(entity.getTotalLessons());
        dto.setTotalStudents(entity.getTotalStudents());
        dto.setTotalReviews(entity.getTotalReviews());
        dto.setAvgRating(entity.getAvgRating());
        dto.setRequirements(entity.getRequirements());
        dto.setWhatYouLearn(entity.getWhatYouLearn());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        if (entity.getCategory() != null) {
            dto.setCategoryId(entity.getCategory().getId());
            dto.setCategoryName(entity.getCategory().getName());
            dto.setCategorySlug(entity.getCategory().getSlug());
        }
        if (entity.getInstructor() != null) {
            dto.setInstructorId(entity.getInstructor().getId());
            dto.setInstructorName(entity.getInstructor().getFullName());
            dto.setInstructorAvatar(entity.getInstructor().getAvatarUrl());
        }
        if (entity.getSemester() != null) {
            dto.setSemesterId(entity.getSemester().getId());
            dto.setSemesterName(entity.getSemester().getName());
            dto.setSemesterCode(entity.getSemester().getCode());
            dto.setSemesterOrdinal(entity.getSemester().getOrdinal());
            dto.setSemester(SemesterDto.fromEntity(entity.getSemester()));
        }
        return dto;
    }
}
