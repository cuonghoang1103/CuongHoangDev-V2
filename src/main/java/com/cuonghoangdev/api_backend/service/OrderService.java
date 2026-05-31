package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.CreateOrderRequest;
import com.cuonghoangdev.api_backend.dto.OrderDto;
import com.cuonghoangdev.api_backend.entity.*;
import com.cuonghoangdev.api_backend.repository.*;
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
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
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

        // Simulated payment auto-completes
        if ("SIMULATED".equals(order.getPaymentMethod())) {
            order.setStatus("COMPLETED");
            order.setPaymentStatus("PAID");
            order.setPaymentId("SIM_" + UUID.randomUUID().toString().substring(0, 8));
            order.setPaidAt(LocalDateTime.now());
        }

        ShopOrder saved = orderRepository.save(order);
        return toDto(saved);
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

    public OrderDto updateOrderStatus(Long id, String status) {
        ShopOrder order = orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        if ("PAID".equals(status) || "COMPLETED".equals(status)) {
            order.setPaymentStatus("PAID");
            order.setPaidAt(LocalDateTime.now());
        }
        return toDto(orderRepository.save(order));
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
        dto.setItems(o.getItems().stream().map(item -> {
            OrderDto.OrderItemDto i = new OrderDto.OrderItemDto();
            i.setId(item.getId());
            i.setProductName(item.getProductName());
            i.setProductSlug(item.getProductSlug());
            i.setProductImage(item.getProductImage());
            i.setPrice(item.getPrice());
            i.setQuantity(item.getQuantity());
            i.setTotal(item.getTotal());
            return i;
        }).collect(Collectors.toList()));
        dto.setCreatedAt(o.getCreatedAt() != null ? o.getCreatedAt().format(DTF) : null);
        return dto;
    }
}
