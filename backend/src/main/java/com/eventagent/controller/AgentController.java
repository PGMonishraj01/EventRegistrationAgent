package com.eventagent.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eventagent.dto.ChatRequest;
import com.eventagent.dto.ChatResponse;
import com.eventagent.entity.Event;
import com.eventagent.service.AgentService;

@RestController
@RequestMapping("/api/agent")
public class AgentController {

    private final AgentService agentService;

    @Autowired
    public AgentController(AgentService agentService) {
        this.agentService = agentService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @RequestBody ChatRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        ChatResponse response = agentService.processChat(request.getMessage(), userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/events")
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(agentService.getAllEvents());
    }

    @PostMapping("/events")
    public ResponseEntity<?> createEvent(@RequestBody Event event) {
        try {
            Event saved = agentService.createEvent(event);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/register-id/{eventId}")
    public ResponseEntity<?> registerEventById(
            @PathVariable Long eventId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody(required = false) Map<String, Object> requestBody) {
        try {
            int ticketCount = 1;
            if (requestBody != null && requestBody.get("ticketCount") != null) {
                Object rawCount = requestBody.get("ticketCount");
                if (rawCount instanceof Number) {
                    ticketCount = ((Number) rawCount).intValue();
                } else {
                    ticketCount = Integer.parseInt(String.valueOf(rawCount));
                }
            }
            String message = agentService.registerEventById(eventId, userId, ticketCount);
            return ResponseEntity.ok(Map.of("message", message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/registrations/{userId}")
    public ResponseEntity<?> getRegistrations(@PathVariable Long userId) {
        try {
            List<Long> registeredEventIds = agentService.getUserRegisteredEventIds(userId);
            return ResponseEntity.ok(registeredEventIds);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to load registrations."));
        }
    }

    @PostMapping("/suggest-form")
    public ResponseEntity<?> suggestForm(@RequestBody Map<String, String> requestBody) {
        String name = requestBody.get("name");
        String description = requestBody.get("description");
        String prompt = requestBody.get("prompt");
        try {
            Map<String, Object> suggestions = agentService.getSuggestFormDetails(name, description, prompt);
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to generate suggestions. " + e.getMessage()));
        }
    }
}
