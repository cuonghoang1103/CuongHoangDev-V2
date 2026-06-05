package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.CourseSection;
import com.cuonghoangdev.api_backend.entity.Lesson;

import java.util.List;

public class CourseSectionDto {
    private Long id;
    private String title;
    private String description;
    private Integer sortOrder;
    private Boolean isLocked;
    private Integer lessonCount;
    private Integer totalDurationSeconds;
    private List<LessonDto> lessons;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Boolean getIsLocked() {
        return isLocked;
    }

    public void setIsLocked(Boolean isLocked) {
        this.isLocked = isLocked;
    }

    public Integer getLessonCount() {
        return lessonCount;
    }

    public void setLessonCount(Integer lessonCount) {
        this.lessonCount = lessonCount;
    }

    public Integer getTotalDurationSeconds() {
        return totalDurationSeconds;
    }

    public void setTotalDurationSeconds(Integer totalDurationSeconds) {
        this.totalDurationSeconds = totalDurationSeconds;
    }

    public List<LessonDto> getLessons() {
        return lessons;
    }

    public void setLessons(List<LessonDto> lessons) {
        this.lessons = lessons;
    }

    public static CourseSectionDto fromEntity(CourseSection entity) {
        return fromEntity(entity, null, false);
    }

    public static CourseSectionDto fromEntity(CourseSection entity, List<Lesson> lessons, boolean includeVideo) {
        CourseSectionDto dto = new CourseSectionDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setSortOrder(entity.getSortOrder());
        dto.setIsLocked(entity.getIsLocked());
        if (lessons != null) {
            dto.setLessonCount(lessons.size());
            int total = 0;
            for (Lesson l : lessons) {
                total += l.getVideoDurationSeconds() != null ? l.getVideoDurationSeconds() : 0;
            }
            dto.setTotalDurationSeconds(total);
            dto.setLessons(lessons.stream()
                .map(l -> LessonDto.fromEntityWithDocuments(l, includeVideo))
                .toList());
        }
        return dto;
    }
}
