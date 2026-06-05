package com.cuonghoangdev.api_backend.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
@EntityListeners(AuditingEntityListener.class)
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private CourseCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id")
    private User instructor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id")
    private Semester semester;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "course_code", length = 50)
    private String courseCode;

    @Column(nullable = false, unique = true, length = 255)
    private String slug;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "preview_video_url", length = 500)
    private String previewVideoUrl;

    @Column(precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "discount_price", precision = 10, scale = 2)
    private BigDecimal discountPrice;

    @Column(name = "discount_expires_at")
    private LocalDateTime discountExpiresAt;

    @Column(length = 20)
    private String level = "BEGINNER";

    @Column(length = 20)
    private String language = "Vietnamese";

    @Column(name = "academy_type", length = 30)
    private String academyType = "GENERAL";

    @Column(name = "is_free")
    private Boolean isFree = false;

    @Column(name = "is_featured")
    private Boolean isFeatured = false;

    @Column(name = "is_published")
    private Boolean isPublished = false;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "total_duration_seconds")
    private Integer totalDurationSeconds = 0;

    @Column(name = "total_lessons")
    private Integer totalLessons = 0;

    @Column(name = "total_students")
    private Integer totalStudents = 0;

    @Column(name = "total_reviews")
    private Integer totalReviews = 0;

    @Column(name = "avg_rating", precision = 3, scale = 2)
    private BigDecimal avgRating = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "what_you_learn", columnDefinition = "TEXT")
    private String whatYouLearn;

    @Column(length = 20)
    private String status = "DRAFT";

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<CourseSection> sections = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CourseReview> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Enrollment> enrollments = new ArrayList<>();

    public Course() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CourseCategory getCategory() { return category; }
    public void setCategory(CourseCategory category) { this.category = category; }
    public User getInstructor() { return instructor; }
    public void setInstructor(User instructor) { this.instructor = instructor; }
    public Semester getSemester() { return semester; }
    public void setSemester(Semester semester) { this.semester = semester; }
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
    public List<CourseSection> getSections() { return sections; }
    public void setSections(List<CourseSection> sections) { this.sections = sections; }
    public List<CourseReview> getReviews() { return reviews; }
    public void setReviews(List<CourseReview> reviews) { this.reviews = reviews; }
    public List<Enrollment> getEnrollments() { return enrollments; }
    public void setEnrollments(List<Enrollment> enrollments) { this.enrollments = enrollments; }
}
