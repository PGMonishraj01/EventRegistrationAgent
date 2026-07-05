package com.eventagent.repository;

import com.eventagent.entity.EventHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistoryRepository extends JpaRepository<EventHistory, Long> {
    List<EventHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
}
