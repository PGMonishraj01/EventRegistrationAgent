package com.eventagent.controller;

import com.eventagent.entity.EventHistory;
import com.eventagent.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    private final HistoryService historyService;

    @Autowired
    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserHistory(@PathVariable Long userId) {
        try {
            List<EventHistory> rawHistory = historyService.getHistoryByUserId(userId);
            List<Map<String, Object>> historyList = new ArrayList<>();

            for (EventHistory item : rawHistory) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", item.getId());
                map.put("title", item.getTitle());
                map.put("type", item.getType().name());
                map.put("createdAt", item.getCreatedAt());
                historyList.add(map);
            }

            return ResponseEntity.ok(historyList);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "Failed to retrieve user history.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/details/{historyId}")
    public ResponseEntity<?> getHistoryDetails(@PathVariable Long historyId) {
        try {
            EventHistory details = historyService.getHistoryDetails(historyId);

            Map<String, Object> map = new HashMap<>();
            map.put("id", details.getId());
            map.put("title", details.getTitle());
            map.put("type", details.getType().name());
            map.put("content", details.getContent());
            map.put("createdAt", details.getCreatedAt());

            return ResponseEntity.ok(map);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "Failed to retrieve history details.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
