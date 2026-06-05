package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, Long> {
    List<Semester> findAllByOrderByOrdinalAsc();
}
