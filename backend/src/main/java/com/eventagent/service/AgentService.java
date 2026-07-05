package com.eventagent.service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.eventagent.dto.ChatResponse;
import com.eventagent.entity.ChatMessage;
import com.eventagent.entity.Event;
import com.eventagent.entity.EventHistory;
import com.eventagent.entity.Registration;
import com.eventagent.entity.User;
import com.eventagent.repository.ChatMessageRepository;
import com.eventagent.repository.EventRepository;
import com.eventagent.repository.RegistrationRepository;
import com.eventagent.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service

public class AgentService {

    private final HistoryService historyService;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final EligibilityService eligibilityService;

    @Value("${external.service.api-key}")
    private String geminiApiKey;

    @Autowired
    public AgentService(HistoryService historyService,
                        UserRepository userRepository,
                        EventRepository eventRepository,
                        RegistrationRepository registrationRepository,
                        ChatMessageRepository chatMessageRepository,
                        EligibilityService eligibilityService) {
        this.historyService = historyService;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.eligibilityService = eligibilityService;
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Event createEvent(Event event) {
        if (event.getName() == null || event.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Event name cannot be empty.");
        }
        if (eventRepository.findByNameIgnoreCase(event.getName().trim()).isPresent()) {
            throw new IllegalArgumentException("An event with this name already exists.");
        }
        event.setName(event.getName().trim());
        if (event.getAvailableSeats() == null) {
            event.setAvailableSeats(50);
        }
        if (event.getRegistrationFee() == null) {
            event.setRegistrationFee(0.0);
        }
        if (event.getRating() == null || event.getRating().isEmpty()) {
            event.setRating("★★★★★");
        }
        if (event.getEventDate() == null) {
            event.setEventDate(LocalDate.now().plusDays(10));
        }
        return eventRepository.save(event);
    }

    public String registerEventById(Long eventId, Long userId) {
        return registerEventById(eventId, userId, 1);
    }

    public String registerEventById(Long eventId, Long userId, int ticketCount) {
        if (ticketCount <= 0) {
            throw new IllegalArgumentException("Ticket count must be at least 1.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found."));

        Optional<Registration> existing = registrationRepository.findByUserIdAndEventId(userId, eventId);
        if (existing.isPresent()) {
            return "You have already registered for **" + event.getName() + "**. Registration ID: " + existing.get().getRegistrationId();
        }

        // Eligibility check
        eligibilityService.checkEligibility(user, event);

        int availableSeats = event.getAvailableSeats() == null ? 0 : event.getAvailableSeats();
        if (availableSeats < ticketCount) {
            throw new IllegalArgumentException("Only " + availableSeats + " seats are available for **" + event.getName() + "**.");
        }

        int originalSeats = availableSeats;
        event.setAvailableSeats(originalSeats - ticketCount);
        eventRepository.save(event);

        String regId = "EVT-2026-" + String.format("%05d", (int)(Math.random() * 100000));
        Registration registration = new Registration(user, event, regId);
        registrationRepository.save(registration);

        return "Registration Successful. Registration ID: " + regId;
    }

    public List<Long> getUserRegisteredEventIds(Long userId) {
        return registrationRepository.findByUserId(userId).stream()
                .map(r -> r.getEvent().getId())
                .collect(java.util.stream.Collectors.toList());
    }

    public Map<String, Object> getSuggestFormDetails(String name, String description, String prompt) {
        String requestPrompt = "You are a creative event planning AI copilot.\n" +
                "The user wants to organize a new event. They provided the following partial details:\n" +
                "- Event Name: " + (name != null ? name : "Tech Workshop") + "\n" +
                "- Event Description: " + (description != null ? description : "An interactive event.") + "\n" +
                "- Assistant Prompt: " + (prompt != null && !prompt.isBlank() ? prompt : "Create a polished event plan") + "\n\n" +
                "Based on these details, please generate creative and appropriate event details for the following fields to auto-complete their form:\n" +
                "- name: (a polished event name if the current one is too generic)\n" +
                "- description: (elaborate the description into a compelling 2-3 sentence markdown summary)\n" +
                "- category: (choose one of: Technology, Software Engineering, Education, Management, Networking)\n" +
                "- eventDate: (choose a date in 2026, formatted as YYYY-MM-DD)\n" +
                "- eventTime: (a start time, e.g. \"10:00 AM\" or \"02:00 PM\")\n" +
                "- venue: (a venue suggestion, e.g. \"Online / Virtual\", \"Grand Ballroom\", \"Auditorium Hall\")\n" +
                "- organizer: (an organizer name suggestion)\n" +
                "- registrationFee: (a sensible registration fee in INR, double type like 0.0 or 1500.0)\n" +
                "- availableSeats: (sensible seating capacity, e.g. 50, 100, 200)\n" +
                "- duration: (e.g. \"1 Day\", \"3 Hours\", \"2 Days\")\n" +
                "- targetAudience: (e.g. \"Students, Software Engineers\")\n\n" +
                "Return your response strictly as a JSON object, with no other text, comments, or markdown wraps (like ```json), in this format:\n" +
                "{\n" +
                "  \"name\": \"string\",\n" +
                "  \"description\": \"string\",\n" +
                "  \"category\": \"string\",\n" +
                "  \"eventDate\": \"string\",\n" +
                "  \"eventTime\": \"string\",\n" +
                "  \"venue\": \"string\",\n" +
                "  \"organizer\": \"string\",\n" +
                "  \"registrationFee\": 500.0,\n" +
                "  \"availableSeats\": 50,\n" +
                "  \"duration\": \"string\",\n" +
                "  \"targetAudience\": \"string\"\n" +
                "}";

        try {
            String rawJson = callGemini(requestPrompt);
            if (rawJson.contains("```")) {
                rawJson = rawJson.replaceAll("```json|```", "").trim();
            }
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(rawJson, Map.class);
        } catch (Exception e) {
            System.err.println("Gemini form suggestion failed: " + e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("name", name != null && !name.isBlank() ? name : "AI Event Workshop");
            fallback.put("description", description != null ? description : "An interactive workshop.");
            fallback.put("category", "Technology");
            fallback.put("eventDate", "2026-08-20");
            fallback.put("eventTime", "10:00 AM");
            fallback.put("venue", "Virtual / Online");
            fallback.put("organizer", "Tech Event Group");
            fallback.put("registrationFee", 0.0);
            fallback.put("availableSeats", 50);
            fallback.put("duration", "1 Day");
            fallback.put("targetAudience", "Students & Professionals");
            return fallback;
        }
    }

    public String buildRegistrationTicket(String eventName, String registrationId, String attendeeName) {
        return "# 🎫 Registration Ticket\n\n" +
                "**Event**: " + eventName + "\n" +
                "**Registration ID**: " + registrationId + "\n" +
                "**Attendee**: " + attendeeName + "\n" +
                "**Status**: Confirmed\n\n" +
                "Please keep this ticket handy for check-in and event access.";
    }

    public String buildOrganizerFormDocument(String eventName, String category, String venue, String organizer, String eventDate) {
        return "# 📝 Event Organizer Form\n\n" +
                "**Event Name**: " + eventName + "\n" +
                "**Category**: " + category + "\n" +
                "**Venue**: " + venue + "\n" +
                "**Organizer**: " + organizer + "\n" +
                "**Event Date**: " + eventDate + "\n\n" +
                "This document can be shared with partners, sponsors, or the event team.";
    }

    public ChatResponse processChat(String message, Long userId) {
        String lowerMessage = message.toLowerCase();

        // 1. Fetch User and context details
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        // 2. Save User input to database memory
        if (user != null) {
            try {
                chatMessageRepository.save(new ChatMessage(user, "USER", message));
            } catch (Exception e) {
                System.err.println("Failed to save user chat message: " + e.getMessage());
            }
        }

        // 3. Load chat history (last 10 messages)
        StringBuilder historyBuilder = new StringBuilder();
        if (user != null) {
            try {
                List<ChatMessage> historyList = chatMessageRepository.findByUserIdOrderByCreatedAtAsc(userId);
                // Keep only last 10 messages for prompt sizing
                List<ChatMessage> recentHistory = historyList.size() > 10 
                        ? historyList.subList(historyList.size() - 10, historyList.size()) 
                        : historyList;
                for (ChatMessage m : recentHistory) {
                    historyBuilder.append(m.getSender()).append(": ").append(m.getContent()).append("\n");
                }
            } catch (Exception e) {
                System.err.println("Failed to load chat history: " + e.getMessage());
            }
        }

        // 4. Fetch available events from database
        List<Event> availableEvents = eventRepository.findAll();
        StringBuilder eventsBuilder = new StringBuilder();
        for (Event e : availableEvents) {
            eventsBuilder.append("- Name: \"").append(e.getName())
                         .append("\", Category: \"").append(e.getCategory())
                         .append("\", Date: ").append(e.getEventDate())
                         .append(", Available Seats: ").append(e.getAvailableSeats())
                         .append(", Fee: ₹").append(e.getRegistrationFee())
                         .append(", Rating: ").append(e.getRating())
                         .append(", Target Audience: ").append(e.getTargetAudience())
                         .append(", Description: ").append(e.getDescription())
                         .append("\n");
        }

        // 5. Fetch registered events for user
        StringBuilder registeredBuilder = new StringBuilder();
        if (user != null) {
            try {
                List<Registration> userRegs = registrationRepository.findByUserId(userId);
                for (Registration r : userRegs) {
                    registeredBuilder.append("- ").append(r.getEvent().getName()).append("\n");
                }
            } catch (Exception e) {
                System.err.println("Failed to load user registrations: " + e.getMessage());
            }
        }

        // 6. Build LLM prompt supporting ORGANIZE intent
        String systemPrompt = "You are an AI Event Recommendation & Registration Agent and virtual event advisor.\n" +
                "Today's date is: Sunday, July 5, 2026.\n" +
                "User Profile:\n" +
                "- Name: " + (user != null ? user.getFullName() : "Guest") + "\n" +
                "- Industry: " + (user != null ? user.getIndustry() : "None") + "\n\n" +
                "User's Registered Events:\n" +
                (registeredBuilder.length() > 0 ? registeredBuilder.toString() : "None") + "\n\n" +
                "Available Events in Database:\n" +
                eventsBuilder.toString() + "\n" +
                "Conversation History:\n" +
                historyBuilder.toString() + "\n" +
                "Latest User Message: \"" + message + "\"\n\n" +
                "Tasks:\n" +
                "1. Classify the user's intent as one of the following:\n" +
                "   - 'REGISTER': The user wants to register/sign up for an event.\n" +
                "   - 'DETAILS': The user is asking for details or information about a specific event.\n" +
                "   - 'RECOMMEND': The user wants event recommendations, suggestions, or is looking for what events to attend (e.g. 'I want to improve my AI skills').\n" +
                "   - 'ORGANIZE': The user (representing a college, college club, organizer, or organization) wants to host, organize, register, or create a new event (e.g. 'Our college wants to host a hackathon called TechInnovate 2026', 'Create an event Python workshop on Aug 10').\n" +
                "   - 'CHAT': General conversational greetings, chat, or questions that don't match the other categories (e.g. checklists or quotation queries).\n" +
                "2. Resolve the exact event name from the Available Events list if the intent is REGISTER or DETAILS. If they refer to it by a pronoun ('yes', 'that one', 'it') or a short name, check the Conversation History to resolve it to the exact event name from the list. If no event can be resolved, return null.\n" +
                "3. If the intent is ORGANIZE, extract and construct an eventData object. Populate fields based on the message content:\n" +
                "   - name: (required, resolve a catchy name if not specified)\n" +
                "   - description: (brief description)\n" +
                "   - category: (e.g., Technology, Software Engineering, Education, Management, Networking)\n" +
                "   - eventDate: (ISO date string YYYY-MM-DD, default to 2026-08-15 if not provided)\n" +
                "   - eventTime: (e.g. \"10:00 AM\")\n" +
                "   - venue: (e.g. \"College Auditorium\" or \"Online\")\n" +
                "   - organizer: (name of the college or organizing group)\n" +
                "   - registrationFee: (double, default 0.0)\n" +
                "   - availableSeats: (int, default 100)\n" +
                "   - duration: (e.g. \"1 Day\")\n" +
                "   - targetAudience: (e.g. \"Students, Developers\")\n" +
                "4. Generate 'reply' text:\n" +
                "   - If intent is RECOMMEND, generate a list of the 3 most suitable events from the Available Events list. Personalize based on their industry (e.g., Software Engineering -> Java Masterclass, Cloud Computing, AI for Developers; Education -> Academic Excellence Conference). If today is or is near a special day/occasion (e.g. Engineers Day, Women's Day), recommend technical or leadership summits. Highlight the event rating (e.g. ★★★★★) and a brief description, plus a clear 'Reason' why it's recommended. Crucially, avoid recommending events they are already registered for. End the recommendations with 'Would you like to register for this event?' or 'Which event would you like to register for?'.\n" +
                "   - If intent is CHAT, respond naturally. If they ask about checklists or quotations, generate a checklist or a budget quotation in a table as the reply.\n" +
                "   - If intent is REGISTER, DETAILS, or a successful ORGANIZE, you do not need to populate the reply field (set it to null) because the Java backend will construct the transactional reply.\n\n" +
                "Return your response strictly as a JSON object, with no other text, comments, or markdown wraps (like ```json), in this format:\n" +
                "{\n" +
                "  \"action\": \"RECOMMEND\" | \"DETAILS\" | \"REGISTER\" | \"CHAT\" | \"ORGANIZE\",\n" +
                "  \"eventName\": \"resolved exact event name or null\",\n" +
                "  \"reply\": \"generated response text in markdown or null\",\n" +
                "  \"eventData\": {\n" +
                "    \"name\": \"string\",\n" +
                "    \"description\": \"string\",\n" +
                "    \"category\": \"string\",\n" +
                "    \"eventDate\": \"string\",\n" +
                "    \"eventTime\": \"string\",\n" +
                "    \"venue\": \"string\",\n" +
                "    \"organizer\": \"string\",\n" +
                "    \"registrationFee\": 0.0,\n" +
                "    \"availableSeats\": 100,\n" +
                "    \"duration\": \"string\",\n" +
                "    \"targetAudience\": \"string\"\n" +
                "  } or null\n" +
                "}";

        // 7. Call Gemini API
        String action = "CHAT";
        String eventName = null;
        String reply = null;
        JsonNode eventDataNode = null;

        try {
            String rawJson = callGemini(systemPrompt);
            if (rawJson.contains("```")) {
                rawJson = rawJson.replaceAll("```json|```", "").trim();
            }
            ObjectMapper mapper = new ObjectMapper();
            JsonNode responseNode = mapper.readTree(rawJson);
            action = responseNode.path("action").asText("CHAT");
            eventName = responseNode.path("eventName").isNull() ? null : responseNode.path("eventName").asText(null);
            reply = responseNode.path("reply").isNull() ? null : responseNode.path("reply").asText(null);
            eventDataNode = responseNode.path("eventData");

            if ("null".equalsIgnoreCase(eventName)) {
                eventName = null;
            }
        } catch (Exception e) {
            System.err.println("Failed to classify intent via LLM, falling back: " + e.getMessage());
            // Fallback heuristics
            if (lowerMessage.contains("register") || lowerMessage.contains("sign up")) {
                action = "REGISTER";
            } else if (lowerMessage.contains("detail") || lowerMessage.contains("about") || lowerMessage.contains("info")) {
                action = "DETAILS";
            } else if (lowerMessage.contains("suggest") || lowerMessage.contains("recommend") || lowerMessage.contains("today")) {
                action = "RECOMMEND";
            } else if (lowerMessage.contains("host") || lowerMessage.contains("organize") || lowerMessage.contains("create event")) {
                action = "ORGANIZE";
            }
        }

        // 8. Execute logic based on resolved intent
        String title = null;
        EventHistory.HistoryType historyType = null;
        String responseText = "";
        String responseType = null;

        if ("REGISTER".equalsIgnoreCase(action)) {
            // Find event in database
            Event event = null;
            if (eventName != null) {
                event = eventRepository.findByNameIgnoreCase(eventName.trim()).orElse(null);
            }
            // Fuzzy lookup fallback
            if (event == null && eventName != null) {
                for (Event e : availableEvents) {
                    if (e.getName().toLowerCase().contains(eventName.toLowerCase()) || 
                        eventName.toLowerCase().contains(e.getName().toLowerCase())) {
                        event = e;
                        break;
                    }
                }
            }

            if (event == null) {
                // If it's a generic "yes" but we couldn't resolve the event from history, check history manually
                if (user != null) {
                    try {
                        List<ChatMessage> historyList = chatMessageRepository.findByUserIdOrderByCreatedAtAsc(userId);
                        // Search backwards for an event name mentioned by AI
                        for (int i = historyList.size() - 1; i >= 0; i--) {
                            String content = historyList.get(i).getContent();
                            if ("AI".equalsIgnoreCase(historyList.get(i).getSender())) {
                                for (Event e : availableEvents) {
                                    if (content.toLowerCase().contains(e.getName().toLowerCase())) {
                                        event = e;
                                        break;
                                    }
                                }
                            }
                            if (event != null) break;
                        }
                    } catch (Exception ex) {
                        System.err.println("Manual history lookup failed: " + ex.getMessage());
                    }
                }
            }

            if (user == null) {
                responseText = "Please register or log in first to sign up for events.";
            } else if (event == null) {
                responseText = "I couldn't identify which event you would like to register for. Could you please specify the event name?";
            } else {
                Optional<Registration> existing = registrationRepository.findByUserIdAndEventId(user.getId(), event.getId());
                if (existing.isPresent()) {
                    responseText = buildRegistrationTicket(event.getName(), existing.get().getRegistrationId(), user.getFullName());
                    title = "Registration Ticket";
                    historyType = EventHistory.HistoryType.RECOMMENDATION;
                    responseType = "TICKET";
                } else if (event.getAvailableSeats() <= 0) {
                    responseText = "Checking seat availability...\n\n" +
                            "Seats Available: 0\n\n" +
                            "Sorry, registration failed because **" + event.getName() + "** is fully booked.";
                } else {
                    int originalSeats = event.getAvailableSeats();
                    event.setAvailableSeats(originalSeats - 1);
                    eventRepository.save(event);

                    String regId = "EVT-2026-" + String.format("%05d", (int)(Math.random() * 100000));
                    Registration registration = new Registration(user, event, regId);
                    registrationRepository.save(registration);

                    responseText = buildRegistrationTicket(event.getName(), regId, user.getFullName());
                    title = "Registration Ticket";
                    historyType = EventHistory.HistoryType.RECOMMENDATION;
                    responseType = "TICKET";
                }
            }
        } else if ("DETAILS".equalsIgnoreCase(action)) {
            // Find event in database
            Event event = null;
            if (eventName != null) {
                event = eventRepository.findByNameIgnoreCase(eventName.trim()).orElse(null);
            }
            // Fuzzy lookup fallback
            if (event == null && eventName != null) {
                for (Event e : availableEvents) {
                    if (e.getName().toLowerCase().contains(eventName.toLowerCase()) || 
                        eventName.toLowerCase().contains(e.getName().toLowerCase())) {
                        event = e;
                        break;
                    }
                }
            }

            if (event == null) {
                responseText = "I couldn't find details for that event. Could you please check the event name?";
            } else {
                responseText = "### ℹ️ Event Details: " + event.getName() + "\n\n" +
                        "* **Event Name**: " + event.getName() + "\n" +
                        "* **Description**: " + event.getDescription() + "\n" +
                        "* **Date**: " + event.getEventDate() + "\n" +
                        "* **Time**: " + event.getEventTime() + "\n" +
                        "* **Venue**: " + event.getVenue() + "\n" +
                        "* **Organizer**: " + event.getOrganizer() + "\n" +
                        "* **Registration Fee**: " + (event.getRegistrationFee() == 0.0 ? "Free" : "₹" + event.getRegistrationFee()) + "\n" +
                        "* **Available Seats**: " + event.getAvailableSeats() + "\n" +
                        "* **Duration**: " + event.getDuration() + "\n" +
                        "* **Target Audience**: " + event.getTargetAudience() + "\n" +
                        "* **Rating**: " + event.getRating() + "\n\n" +
                        "Would you like to register for this event?";
            }
        } else if ("ORGANIZE".equalsIgnoreCase(action)) {
            if (user == null) {
                responseText = "Please register or log in first to host/register events.";
            } else if (eventDataNode == null || eventDataNode.isNull() || !eventDataNode.has("name")) {
                responseText = "I'd love to help you register a new event! Could you please provide some details such as event name, date, category, and organizer?";
            } else {
                String name = eventDataNode.path("name").asText(null);
                if (name == null || name.trim().isEmpty() || "null".equalsIgnoreCase(name)) {
                    responseText = "Please specify a name for the event you'd like to organize.";
                } else {
                    Optional<Event> existing = eventRepository.findByNameIgnoreCase(name.trim());
                    if (existing.isPresent()) {
                        responseText = "An event named **" + name.trim() + "** has already been registered. Please select a unique name for your event.";
                    } else {
                        Event newEvent = new Event();
                        newEvent.setName(name.trim());
                        newEvent.setDescription(eventDataNode.path("description").asText("Interactive campus workshop and showcase."));
                        newEvent.setCategory(eventDataNode.path("category").asText("Technology"));

                        String dateStr = eventDataNode.path("eventDate").asText("2026-08-15");
                        try {
                            newEvent.setEventDate(LocalDate.parse(dateStr));
                        } catch (Exception ex) {
                            newEvent.setEventDate(LocalDate.of(2026, 8, 15));
                        }

                        newEvent.setEventTime(eventDataNode.path("eventTime").asText("10:00 AM"));
                        newEvent.setVenue(eventDataNode.path("venue").asText("Campus Seminar Hall"));
                        newEvent.setOrganizer(eventDataNode.path("organizer").asText(user.getFullName() + "'s College"));
                        newEvent.setRegistrationFee(eventDataNode.path("registrationFee").asDouble(0.0));
                        newEvent.setAvailableSeats(eventDataNode.path("availableSeats").asInt(100));
                        newEvent.setDuration(eventDataNode.path("duration").asText("1 Day"));
                        newEvent.setTargetAudience(eventDataNode.path("targetAudience").asText("Students & Developers"));
                        newEvent.setRating("★★★★★");

                        eventRepository.save(newEvent);

                        responseText = buildOrganizerFormDocument(
                                newEvent.getName(),
                                newEvent.getCategory(),
                                newEvent.getVenue(),
                                newEvent.getOrganizer(),
                                newEvent.getEventDate().toString()
                        );
                        title = "Organizer Form";
                        historyType = EventHistory.HistoryType.CHECKLIST;
                        responseType = "FORM";
                    }
                }
            }
        } else if ("RECOMMEND".equalsIgnoreCase(action)) {
            title = "Personalized Event Recommendations";
            historyType = EventHistory.HistoryType.RECOMMENDATION;
            responseText = (reply != null && !reply.isEmpty()) ? reply : "Based on your request, I couldn't find matching events. Please try again.";
        } else { // CHAT
            responseText = (reply != null && !reply.isEmpty()) ? reply : "Hello! I am your Event Registration AI Assistant. How can I help you today?";

            // Match custom categories for backward compatibility
            if (lowerMessage.contains("organize") || lowerMessage.contains("plan") || lowerMessage.contains("checklist")) {
                title = "Event Planning Checklist";
                historyType = EventHistory.HistoryType.CHECKLIST;
            } else if (lowerMessage.contains("quote") || lowerMessage.contains("cost")) {
                title = "Estimated Event Quotation";
                historyType = EventHistory.HistoryType.QUOTATION;
            }
        }

        // 9. Save AI response to database memory
        if (user != null) {
            try {
                chatMessageRepository.save(new ChatMessage(user, "AI", responseText));
            } catch (Exception e) {
                System.err.println("Failed to save AI chat message: " + e.getMessage());
            }
        }

        // 10. Save to event history if keyword/intent triggered a loggable session
        Long historyId = null;
        if (historyType != null && user != null) {
            try {
                EventHistory saved = historyService.saveHistory(userId, title, historyType, responseText);
                historyId = saved.getId();
            } catch (Exception e) {
                System.err.println("Failed to save event history: " + e.getMessage());
            }
        }

        return new ChatResponse(responseText, title, responseType != null ? responseType : (historyType != null ? historyType.name() : null), historyId);
    }

    private String callGemini(String prompt) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            throw new IllegalStateException("Gemini API key is not configured in application.properties.");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Build request JSON
        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> contentMap = new HashMap<>();
        Map<String, Object> partMap = new HashMap<>();
        partMap.put("text", prompt);
        contentMap.put("parts", Collections.singletonList(partMap));
        requestBody.put("contents", Collections.singletonList(contentMap));

        // Request structured JSON response from LLM
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        requestBody.put("generationConfig", generationConfig);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode rootNode = mapper.readTree(response.getBody());
                return rootNode.path("candidates")
                               .path(0)
                               .path("content")
                               .path("parts")
                               .path(0)
                               .path("text")
                               .asText();
            } else {
                throw new RuntimeException("Gemini API returned code: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("Error calling Gemini API: " + e.getMessage());
            throw new RuntimeException("Failed to call Gemini API", e);
        }
    }
}
