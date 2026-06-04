package com.cuonghoangdev.api_backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "shop_order_items")
public class ShopOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private ShopOrder order;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = false)
    private String productSlug;

    @Column
    private String productImage;

    @Column(nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal price = java.math.BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal total = java.math.BigDecimal.ZERO;

    /**
     * File download URL returned when a digital product (AI Account, Tool/Script)
     * is delivered after payment completion.
     */
    @Column(name = "file_url", length = 500)
    private String fileUrl;

    /**
     * Credential text key(s) returned when an AI Account is delivered.
     * E.g. "Email: user@example.com | Password: Abc123! | API Key: sk-..."
     */
    @Column(name = "credentials", columnDefinition = "TEXT")
    private String credentials;

    public ShopOrderItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ShopOrder getOrder() { return order; }
    public void setOrder(ShopOrder order) { this.order = order; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getProductSlug() { return productSlug; }
    public void setProductSlug(String productSlug) { this.productSlug = productSlug; }
    public String getProductImage() { return productImage; }
    public void setProductImage(String productImage) { this.productImage = productImage; }
    public java.math.BigDecimal getPrice() { return price; }
    public void setPrice(java.math.BigDecimal price) { this.price = price; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public java.math.BigDecimal getTotal() { return total; }
    public void setTotal(java.math.BigDecimal total) { this.total = total; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getCredentials() { return credentials; }
    public void setCredentials(String credentials) { this.credentials = credentials; }
}
