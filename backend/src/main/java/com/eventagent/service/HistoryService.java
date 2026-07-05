package com.eventagent.service;

import com.eventagent.entity.EventHistory;
import com.eventagent.entity.User;
import com.eventagent.repository.HistoryRepository;
import com.eventagent.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HistoryService {

    private final HistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Autowired
    public HistoryService(HistoryRepository historyRepository, UserRepository userRepository) {
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
    }

    public EventHistory saveHistory(Long userId, String title, EventHistory.HistoryType type, String content) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        EventHistory history = new EventHistory(user, title, type, content);
        return historyRepository.save(history);
    }

    public List<EventHistory> getHistoryByUserId(Long userId) {
        // Confirm user exists first
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }
        return historyRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public EventHistory getHistoryDetails(Long historyId) {
        return historyRepository.findById(historyId)
                .orElseThrow(() -> new IllegalArgumentException("History record not found with ID: " + historyId));
    }
}
