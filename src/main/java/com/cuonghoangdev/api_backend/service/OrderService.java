package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.CreateOrderRequest;
import com.cuonghoangdev.api_backend.dto.OrderDto;
import com.cuonghoangdev.api_backend.entity.*;
import com.cuonghoangdev.api_backend.repository.*;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class OrderService {

    @Autowired
    private ShopOrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private DiscountCodeRepository discountRepository;

    @Autowired
    private UserRepository userRepository;

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    @Transactional
    public OrderDto createOrder(CreateOrderRequest request) {
        ShopOrder order = new ShopOrder();
        order.setOrderCode(generateOrderCode());
        order.setBuyerName(request.getBuyerName());
        order.setBuyerEmail(request.getBuyerEmail());
        order.setBuyerPhone(request.getBuyerPhone());
        order.setBuyerAddress(request.getBuyerAddress());
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "SIMULATED");
        order.setStatus("PENDING");
        order.setPaymentStatus("PENDING");
        order.setNotes(request.getNotes());

        BigDecimal runningTotal = BigDecimal.ZERO;

        if (request.getItems() != null) {
            for (CreateOrderRequest.OrderItemRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

                if (!Boolean.TRUE.equals(product.getActive())) {
                    throw new RuntimeException("Product not available: " + product.getName());
                }

                BigDecimal price = product.getPrice();
                BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(itemReq.getQuantity()));

                ShopOrderItem item = new ShopOrderItem();
                item.setProductName(product.getName());
                item.setProductSlug(product.getSlug());
                item.setProductImage(product.getThumbnailUrl());
                item.setPrice(price);
                item.setQuantity(itemReq.getQuantity());
                item.setTotal(itemTotal);
                // Pre-populate delivery fields — will be populated when payment completes
                item.setFileUrl(product.getFileUrl());
                order.addItem(item);

                runningTotal = runningTotal.add(itemTotal);

                if (product.getStockQuantity() != null) {
                    product.setStockQuantity(product.getStockQuantity() - itemReq.getQuantity());
                }
                if (product.getSoldCount() != null) {
                    product.setSoldCount(product.getSoldCount() + itemReq.getQuantity());
                }
                productRepository.save(product);
            }
        }

        final BigDecimal subtotal = runningTotal;
        order.setSubtotal(subtotal);

        // Apply discount
        BigDecimal discountToApply = BigDecimal.ZERO;
        if (request.getDiscountCode() != null && !request.getDiscountCode().isBlank()) {
            final BigDecimal discAmt = discountRepository.findByCodeIgnoreCase(request.getDiscountCode())
                .filter(d -> d.isValid(subtotal))
                .map(d -> {
                    order.setDiscountCode(d.getCode());
                    order.setDiscountAmount(d.calculateDiscount(subtotal));
                    discountRepository.incrementUsedCount(d.getId());
                    return order.getDiscountAmount();
                })
                .orElse(BigDecimal.ZERO);
            discountToApply = discAmt;
        }

        order.setDiscountAmount(discountToApply);

        BigDecimal total = subtotal.subtract(discountToApply);
        order.setTotal(total.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : total);

        // Simulated payment auto-completes — trigger digital delivery
        if ("SIMULATED".equals(order.getPaymentMethod())) {
            order.setStatus("COMPLETED");
            order.setPaymentStatus("PAID");
            order.setPaymentId("SIM_" + UUID.randomUUID().toString().substring(0, 8));
            order.setPaidAt(LocalDateTime.now());
            // Populate digital delivery credentials on each item
            populateDigitalDelivery(order);
        }

        ShopOrder saved = orderRepository.save(order);
        return toDto(saved);
    }

    /**
     * Populates digital delivery data on each order item after payment completion.
     * For AI Account products, generates mock credentials.
     * For Tool/Script products, returns the stored fileUrl.
     * This runs inside the same transaction as order creation, guaranteeing consistency.
     */
    private void populateDigitalDelivery(ShopOrder order) {
        for (ShopOrderItem item : order.getItems()) {
            if (item.getFileUrl() != null && !item.getFileUrl().isBlank()) {
                // Tool/Script product — file download URL is already set
                continue;
            }
            // AI Account or other digital — generate mock credential delivery
            String generatedCredentials = generateMockCredentials();
            item.setCredentials(generatedCredentials);
        }
    }

    /**
     * Generates mock credential text for AI Account products.
     * In production, this would query a credential vault or retrieve
     * pre-provisioned account data from a secure store.
     */
    private String generateMockCredentials() {
        String key = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String email = "user" + key.toLowerCase() + "@aiplatform.dev";
        String password = "P@" + key + "!" + (int)(Math.random() * 900 + 100);
        String apiKey = "sk-prod-" + UUID.randomUUID().toString().replace("-", "").substring(0, 32);
        return String.format(
            "Email: %s%nPassword: %s%nAPI Key: %s%nCreated: %s",
            email, password, apiKey, LocalDateTime.now().format(DTF)
        );
    }

    public Page<OrderDto> getOrdersByUser(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::toDto);
    }

    public Page<OrderDto> getAllOrders(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (status != null && !status.isBlank()) {
            return orderRepository.findByStatus(status, pageable).map(this::toDto);
        }
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toDto);
    }

    public OrderDto getOrderById(Long id) {
        ShopOrder order = orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        return toDto(order);
    }

    @Transactional
    public OrderDto updateOrderStatus(Long id, String status) {
        ShopOrder order = orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        if ("PAID".equals(status) || "COMPLETED".equals(status)) {
            order.setPaymentStatus("PAID");
            order.setPaidAt(LocalDateTime.now());
            populateDigitalDelivery(order);
        }
        ShopOrder saved = orderRepository.save(order);
        return toDto(saved);
    }

    public OrderDto getOrderByCode(String code) {
        ShopOrder order = orderRepository.findByOrderCode(code)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        return toDto(order);
    }

    public long countByStatus(String status) {
        return orderRepository.countByStatus(status);
    }

    private String generateOrderCode() {
        return "ORD" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    private OrderDto toDto(ShopOrder o) {
        Hibernate.initialize(o.getItems());
        OrderDto dto = new OrderDto();
        dto.setId(o.getId());
        dto.setOrderCode(o.getOrderCode());
        if (o.getUser() != null) dto.setUserId(o.getUser().getId());
        dto.setBuyerName(o.getBuyerName());
        dto.setBuyerEmail(o.getBuyerEmail());
        dto.setBuyerPhone(o.getBuyerPhone());
        dto.setBuyerAddress(o.getBuyerAddress());
        dto.setSubtotal(o.getSubtotal());
        dto.setDiscountAmount(o.getDiscountAmount());
        dto.setDiscountCode(o.getDiscountCode());
        dto.setTotal(o.getTotal());
        dto.setStatus(o.getStatus());
        dto.setPaymentMethod(o.getPaymentMethod());
        dto.setPaymentStatus(o.getPaymentStatus());
        dto.setPaidAt(o.getPaidAt() != null ? o.getPaidAt().format(DTF) : null);

        List<OrderDto.DigitalDelivery> digitalItems = new ArrayList<>();
        List<OrderDto.OrderItemDto> itemDtos = new ArrayList<>();

        for (ShopOrderItem item : o.getItems()) {
            OrderDto.OrderItemDto i = new OrderDto.OrderItemDto();
            i.setId(item.getId());
            i.setProductName(item.getProductName());
            i.setProductSlug(item.getProductSlug());
            i.setProductImage(item.getProductImage());
            i.setPrice(item.getPrice());
            i.setQuantity(item.getQuantity());
            i.setTotal(item.getTotal());
            i.setFileUrl(item.getFileUrl());
            i.setCredentials(item.getCredentials());
            itemDtos.add(i);

            // Build delivery summary if credentials or fileUrl is present
            if ((item.getFileUrl() != null && !item.getFileUrl().isBlank())
                    || (item.getCredentials() != null && !item.getCredentials().isBlank())) {
                digitalItems.add(new OrderDto.DigitalDelivery(
                    item.getProductName(),
                    item.getFileUrl() != null ? "TOOL" : "ACCOUNT",
                    item.getFileUrl(),
                    item.getCredentials()
                ));
            }
        }

        dto.setItems(itemDtos);

        // Attach delivery info for completed digital orders
        if (!digitalItems.isEmpty()) {
            OrderDto.DeliveryInfo di = new OrderDto.DeliveryInfo();
            di.setHasDigitalItems(true);
            di.setItems(digitalItems);
            di.setMessage("Đơn hàng hoàn tất! Thông tin giao hàng số đã được gửi qua email " + o.getBuyerEmail() + ".");
            dto.setDeliveryInfo(di);
        }

        dto.setCreatedAt(o.getCreatedAt() != null ? o.getCreatedAt().format(DTF) : null);
        return dto;
    }
}
