package com.eventagent.dto;

public class SuggestionResponse {
    private String title;
    private String description;
    private String resources; // could be JSON or plain text
    private String estimate; // budget/time estimate
    private String additionalTips;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getResources() { return resources; }
    public void setResources(String resources) { this.resources = resources; }
    public String getEstimate() { return estimate; }
    public void setEstimate(String estimate) { this.estimate = estimate; }
    public String getAdditionalTips() { return additionalTips; }
    public void setAdditionalTips(String additionalTips) { this.additionalTips = additionalTips; }
}
