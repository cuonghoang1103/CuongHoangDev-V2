package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.ProductDto;
import com.cuonghoangdev.api_backend.entity.Product;
import com.cuonghoangdev.api_backend.entity.ProductCategory;
import com.cuonghoangdev.api_backend.repository.ProductRepository;
import com.cuonghoangdev.api_backend.repository.ProductCategoryRepository;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductCategoryRepository categoryRepository;

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    public Page<ProductDto> getAllProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return productRepository.findByActiveTrue(pageable).map(this::toDto);
    }

    public Page<ProductDto> getFeaturedProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findByActiveTrueAndFeaturedTrue(pageable).map(this::toDto);
    }

    public Page<ProductDto> getProductsByCategory(Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return productRepository.findByFilters(categoryId, pageable).map(this::toDto);
    }

    public Page<ProductDto> searchProducts(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.search(query, pageable).map(this::toDto);
    }

    public ProductDto getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        return toDto(product);
    }

    public ProductDto getProductById(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        return toDto(product);
    }

    public List<ProductDto> getTopSelling(int limit) {
        return productRepository.findTop10ByActiveTrueOrderBySoldCountDesc().stream()
            .limit(limit)
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @Transactional
    public ProductDto createProduct(Product product) {
        Product saved = productRepository.save(product);
        Hibernate.initialize(saved.getSpecs());
        return toDto(saved);
    }

    @Transactional
    public ProductDto updateProduct(Long id, Product updated) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setName(updated.getName());
        product.setSlug(updated.getSlug());
        product.setDescription(updated.getDescription());
        product.setShortDescription(updated.getShortDescription());
        product.setPrice(updated.getPrice());
        product.setOriginalPrice(updated.getOriginalPrice());
        product.setStockQuantity(updated.getStockQuantity());
        product.setFeatured(updated.getFeatured());
        product.setActive(updated.getActive());
        product.setCategory(updated.getCategory());
        product.setType(updated.getType());
        product.setFileUrl(updated.getFileUrl());
        product.setSpecs(updated.getSpecs());
        product.setGuidance(updated.getGuidance());
        Hibernate.initialize(product.getSpecs());
        return toDto(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setActive(false);
        productRepository.save(product);
    }

    public List<ProductDto> getAllCategories() {
        return categoryRepository.findAll().stream()
            .map(this::toCategoryDto)
            .collect(Collectors.toList());
    }

    private ProductDto toDto(Product p) {
        Hibernate.initialize(p.getSpecs());
        Hibernate.initialize(p.getCategory());
        ProductDto dto = new ProductDto();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setSlug(p.getSlug());
        dto.setDescription(p.getDescription());
        dto.setShortDescription(p.getShortDescription());
        dto.setThumbnailUrl(p.getThumbnailUrl());
        dto.setImages(p.getImages());
        dto.setPrice(p.getPrice());
        dto.setOriginalPrice(p.getOriginalPrice());

        BigDecimal effPrice = p.getPrice();
        if (p.getOriginalPrice() != null && p.getOriginalPrice().compareTo(BigDecimal.ZERO) > 0) {
            effPrice = p.getOriginalPrice();
        }
        dto.setEffectivePrice(effPrice);

        dto.setStockQuantity(p.getStockQuantity());
        dto.setSoldCount(p.getSoldCount());
        dto.setFeatured(p.getFeatured());
        dto.setActive(p.getActive());
        dto.setType(p.getType());
        dto.setFileUrl(p.getFileUrl());
        dto.setSpecs(p.getSpecs());
        dto.setGuidance(p.getGuidance());
        if (p.getCategory() != null) {
            dto.setCategoryId(p.getCategory().getId());
            dto.setCategoryName(p.getCategory().getName());
            dto.setCategorySlug(p.getCategory().getSlug());
        }
        if (p.getCreatedAt() != null) {
            dto.setCreatedAt(p.getCreatedAt().format(DTF));
        }
        return dto;
    }

    private ProductDto toCategoryDto(ProductCategory c) {
        ProductDto dto = new ProductDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setSlug(c.getSlug());
        dto.setShortDescription(c.getDescription());
        return dto;
    }
}
