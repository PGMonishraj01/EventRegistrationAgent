package com.eventagent.dto;

public class ChatResponse {
    private String response;
    private String title;
    private String type;
    private Long historyId;

    public ChatResponse() {}

    public ChatResponse(String response, String title, String type, Long historyId) {
        this.response = response;
        this.title = title;
        this.type = type;
        this.historyId = historyId;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getHistoryId() {
        return historyId;
    }

    public void setHistoryId(Long historyId) {
        this.historyId = historyId;
    }
}
