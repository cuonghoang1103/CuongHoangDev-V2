package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.entity.DiscountCode;
import com.cuonghoangdev.api_backend.repository.DiscountCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class DiscountService {

    @Autowired
    private DiscountCodeRepository discountRepository;

    public Map<String, Object> validateCode(String code, BigDecimal orderAmount) {
        return discountRepository.findByCodeIgnoreCase(code)
            .map(discount -> {
                if (discount.isValid(orderAmount)) {
                    BigDecimal discountAmount = discount.calculateDiscount(orderAmount);
                    return Map.<String, Object>of(
                        "valid", true,
                        "code", discount.getCode(),
                        "discountAmount", discountAmount,
                        "discountType", discount.getDiscountType(),
                        "message", discount.getDescription() != null ? discount.getDescription() : "Code applied successfully"
                    );
                } else {
                    return Map.<String, Object>of(
                        "valid", false,
                        "message", "Code expired or invalid"
                    );
                }
            })
            .orElse(Map.of("valid", false, "message", "Code not found"));
    }

    public Map<String, Object> validateCode(String code) {
        return discountRepository.findByCodeIgnoreCase(code)
            .map(discount -> Map.<String, Object>of(
                "valid", discount.isActive(),
                "code", discount.getCode(),
                "discountType", discount.getDiscountType(),
                "discountValue", discount.getDiscountValue(),
                "minOrderAmount", discount.getMinOrderAmount(),
                "maxDiscountAmount", discount.getMaxDiscountAmount() != null ? discount.getMaxDiscountAmount() : BigDecimal.ZERO,
                "message", discount.isActive() ? "Code is valid" : "Code is inactive"
            ))
            .orElse(Map.of("valid", false, "message", "Code not found"));
    }

    public DiscountCode createCode(DiscountCode code) {
        return discountRepository.save(code);
    }

    public List<DiscountCode> getAllCodes() {
        return discountRepository.findAll();
    }

    public DiscountCode getCodeById(Long id) {
        return discountRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Discount code not found"));
    }

    public DiscountCode updateCode(Long id, DiscountCode updated) {
        DiscountCode code = discountRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Discount code not found"));
        code.setCode(updated.getCode());
        code.setDiscountType(updated.getDiscountType());
        code.setDiscountValue(updated.getDiscountValue());
        code.setMinOrderAmount(updated.getMinOrderAmount());
        code.setMaxDiscountAmount(updated.getMaxDiscountAmount());
        code.setMaxUses(updated.getMaxUses());
        code.setStartsAt(updated.getStartsAt());
        code.setExpiresAt(updated.getExpiresAt());
        code.setActive(updated.getActive());
        code.setDescription(updated.getDescription());
        return discountRepository.save(code);
    }

    public void deleteCode(Long id) {
        discountRepository.deleteById(id);
    }

    public void seedDemoCodes() {
        if (discountRepository.findByCodeIgnoreCase("WELCOME10").isEmpty()) {
            DiscountCode c = new DiscountCode();
            c.setCode("WELCOME10");
            c.setDiscountType("PERCENT");
            c.setDiscountValue(BigDecimal.valueOf(10));
            c.setMinOrderAmount(BigDecimal.valueOf(50000));
            c.setActive(true);
            c.setDescription("Welcome discount 10%");
            discountRepository.save(c);
        }
        if (discountRepository.findByCodeIgnoreCase("SUMMER50").isEmpty()) {
            DiscountCode c = new DiscountCode();
            c.setCode("SUMMER50");
            c.setDiscountType("PERCENT");
            c.setDiscountValue(BigDecimal.valueOf(50));
            c.setMinOrderAmount(BigDecimal.valueOf(200000));
            c.setMaxDiscountAmount(BigDecimal.valueOf(100000));
            c.setMaxUses(100);
            c.setActive(true);
            c.setDescription("Summer sale 50% off (max 100k)");
            discountRepository.save(c);
        }
        if (discountRepository.findByCodeIgnoreCase("VIP20").isEmpty()) {
            DiscountCode c = new DiscountCode();
            c.setCode("VIP20");
            c.setDiscountType("PERCENT");
            c.setDiscountValue(BigDecimal.valueOf(20));
            c.setMinOrderAmount(BigDecimal.valueOf(100000));
            c.setMaxDiscountAmount(BigDecimal.valueOf(50000));
            c.setActive(true);
            c.setDescription("VIP member 20% off (max 50k)");
            discountRepository.save(c);
        }
    }
}
