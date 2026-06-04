package com.cuonghoangdev.api_backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class OrderDto {
    private Long id;
    private String orderCode;
    private Long userId;
    private String buyerName;
    private String buyerEmail;
    private String buyerPhone;
    private String buyerAddress;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private String discountCode;
    private BigDecimal total;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private String paidAt;
    private List<OrderItemDto> items;
    /** Summary of all digital delivery links/credentials for this order (only populated when COMPLETED). */
    private DeliveryInfo deliveryInfo;
    private String createdAt;

    public DeliveryInfo getDeliveryInfo() { return deliveryInfo; }
    public void setDeliveryInfo(DeliveryInfo deliveryInfo) { this.deliveryInfo = deliveryInfo; }

    public static class DeliveryInfo {
        private boolean hasDigitalItems;
        private List<DigitalDelivery> items;
        private String message;

        public DeliveryInfo() {}

        public boolean isHasDigitalItems() { return hasDigitalItems; }
        public void setHasDigitalItems(boolean hasDigitalItems) { this.hasDigitalItems = hasDigitalItems; }
        public List<DigitalDelivery> getItems() { return items; }
        public void setItems(List<DigitalDelivery> items) { this.items = items; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class DigitalDelivery {
        private String productName;
        private String type;
        private String fileUrl;
        private String credentials;

        public DigitalDelivery() {}

        public DigitalDelivery(String productName, String type, String fileUrl, String credentials) {
            this.productName = productName;
            this.type = type;
            this.fileUrl = fileUrl;
            this.credentials = credentials;
        }

        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getFileUrl() { return fileUrl; }
        public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
        public String getCredentials() { return credentials; }
        public void setCredentials(String credentials) { this.credentials = credentials; }
    }

    public OrderDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }
    public String getBuyerEmail() { return buyerEmail; }
    public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }
    public String getBuyerPhone() { return buyerPhone; }
    public void setBuyerPhone(String buyerPhone) { this.buyerPhone = buyerPhone; }
    public String getBuyerAddress() { return buyerAddress; }
    public void setBuyerAddress(String buyerAddress) { this.buyerAddress = buyerAddress; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public String getDiscountCode() { return discountCode; }
    public void setDiscountCode(String discountCode) { this.discountCode = discountCode; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getPaidAt() { return paidAt; }
    public void setPaidAt(String paidAt) { this.paidAt = paidAt; }
    public List<OrderItemDto> getItems() { return items; }
    public void setItems(List<OrderItemDto> items) { this.items = items; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public static class OrderItemDto {
        private Long id;
        private String productName;
        private String productSlug;
        private String productImage;
        private java.math.BigDecimal price;
        private Integer quantity;
        private java.math.BigDecimal total;
        /** Download URL for digital products (set on payment completion). */
        private String fileUrl;
        /** Credential keys for AI Account products (set on payment completion). */
        private String credentials;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
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
}
