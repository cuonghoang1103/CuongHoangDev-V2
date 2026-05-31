package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.DiscountCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiscountCodeRepository extends JpaRepository<DiscountCode, Long> {

    Optional<DiscountCode> findByCode(String code);

    Optional<DiscountCode> findByCodeIgnoreCase(String code);

    @Modifying
    @Query("UPDATE DiscountCode d SET d.usedCount = d.usedCount + 1 WHERE d.id = :id")
    void incrementUsedCount(@Param("id") Long id);
}
