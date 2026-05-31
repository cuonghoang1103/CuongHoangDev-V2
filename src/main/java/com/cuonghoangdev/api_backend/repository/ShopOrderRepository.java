package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.ShopOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {

    Page<ShopOrder> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<ShopOrder> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT o FROM ShopOrder o WHERE (:status IS NULL OR o.status = :status) ORDER BY o.createdAt DESC")
    Page<ShopOrder> findByStatus(@Param("status") String status, Pageable pageable);

    @Query("SELECT o FROM ShopOrder o WHERE LOWER(o.buyerEmail) = LOWER(:email) ORDER BY o.createdAt DESC")
    Page<ShopOrder> findByEmail(@Param("email") String email, Pageable pageable);

    @Query("SELECT COUNT(o) FROM ShopOrder o WHERE o.status = :status")
    long countByStatus(@Param("status") String status);

    Optional<ShopOrder> findByOrderCode(String orderCode);
}
