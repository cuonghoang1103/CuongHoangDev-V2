package com.cuonghoangdev.api_backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@EntityListeners(AuditingEntityListener.class)
public class Product {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "images", columnDefinition = "TEXT")
    private String images;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "stock_quantity")
    private Integer stockQuantity = 0;

    @Column(name = "sold_count")
    private Integer soldCount = 0;

    @Column
    private Boolean featured = false;

    @Column
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ProductCategory category;

    @Column(length = 20)
    private String type = "DIGITAL";

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    /**
     * Dynamic specification key-value pairs — stored as JSON TEXT in PostgreSQL.
     * Examples:
     *   AI Account:  [{ "label": "Loại tài khoản", "value": "ChatGPT Plus" }, ...]
     *   Tool/Script: [{ "label": "Phiên bản", "value": "v2.3.1" }, ...]
     * Serialized/deserialized manually via Jackson ObjectMapper — no Hibernate version dependency.
     */
    @Column(name = "specs", columnDefinition = "TEXT")
    private String specsJson = "[]";

    /**
     * Markdown/HTML guidance text for deployment instructions, warranty, and FAQ.
     * Rendered on the "Hướng dẫn & Bảo hành" tab of the product detail page.
     */
    @Column(columnDefinition = "TEXT")
    private String guidance;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Product() {}

    // ══════════════════════════════════════════════════════════════════════════════
    // Specs — serialized as JSON TEXT, not a Hibernate JSON type
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Returns the specs list, deserialized from the stored JSON.
     * Returns an empty list on parse error or if the stored value is null/blank.
     */
    @Transient
    public List<ProductSpec> getSpecs() {
        if (specsJson == null || specsJson.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return MAPPER.readValue(specsJson, new TypeReference<List<ProductSpec>>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    /**
     * Serializes the given specs list and stores it as JSON in the TEXT column.
     */
    public void setSpecs(List<ProductSpec> specs) {
        if (specs == null || specs.isEmpty()) {
            this.specsJson = "[]";
            return;
        }
        try {
            this.specsJson = MAPPER.writeValueAsString(specs);
        } catch (JsonProcessingException e) {
            this.specsJson = "[]";
        }
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // Accessors for fields managed by JPA / manual setters
    // ══════════════════════════════════════════════════════════════════════════════

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getShortDescription() { return shortDescription; }
    public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public String getImages() { return images; }
    public void setImages(String images) { this.images = images; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(BigDecimal originalPrice) { this.originalPrice = originalPrice; }
    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
    public Integer getSoldCount() { return soldCount; }
    public void setSoldCount(Integer soldCount) { this.soldCount = soldCount; }
    public Boolean getFeatured() { return featured; }
    public void setFeatured(Boolean featured) { this.featured = featured; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public ProductCategory getCategory() { return category; }
    public void setCategory(ProductCategory category) { this.category = category; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getGuidance() { return guidance; }
    public void setGuidance(String guidance) { this.guidance = guidance; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // ══════════════════════════════════════════════════════════════════════════════
    // Nested embeddable: specification key-value pair (POJO, no JPA annotations)
    // ══════════════════════════════════════════════════════════════════════════════

    public static class ProductSpec {
        @JsonProperty("label")
        private String label;
        @JsonProperty("value")
        private String value;

        public ProductSpec() {}
        public ProductSpec(String label, String value) {
            this.label = label;
            this.value = value;
        }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
    }
}
