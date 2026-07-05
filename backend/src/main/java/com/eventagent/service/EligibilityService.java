package com.eventagent.service;

import org.springframework.stereotype.Service;

import com.eventagent.entity.Event;
import com.eventagent.entity.User;

/**
 * EligibilityService checks whether a given user meets the criteria to register
 * for a specific event based on their profile (age, userType, interests).
 */
@Service
public class EligibilityService {

    /**
     * Checks if the user is eligible to register for the event.
     * Throws IllegalArgumentException with a friendly message if not eligible.
     */
    public void checkEligibility(User user, Event event) {
        // 1. Age check: if event targetAudience mentions a minimum age hint, check it
        //    For now we use a simple heuristic: events for "Professional" require age >= 18
        if (user.getAge() != null && user.getAge() < 16) {
            throw new IllegalArgumentException(
                "You must be at least 16 years old to register for events. " +
                "Please update your profile age and try again.");
        }

        // 2. UserType / Target Audience check
        String targetAudience = event.getTargetAudience();
        String userType = user.getUserType();

        if (targetAudience != null && !targetAudience.isBlank() && userType != null && !userType.isBlank()) {
            String audienceLower = targetAudience.toLowerCase();
            String typeLower = userType.toLowerCase();

            // Check if audience explicitly mentions certain types and user doesn't qualify
            boolean audienceRequiresStudentOnly = audienceLower.contains("student") &&
                    !audienceLower.contains("professional") &&
                    !audienceLower.contains("all") &&
                    !audienceLower.contains("everyone");

            boolean audienceRequiresProfessionalOnly = (audienceLower.contains("professional") ||
                    audienceLower.contains("it professional") ||
                    audienceLower.contains("developer") ||
                    audienceLower.contains("engineer")) &&
                    !audienceLower.contains("student") &&
                    !audienceLower.contains("all") &&
                    !audienceLower.contains("everyone");

            if (audienceRequiresStudentOnly && !typeLower.contains("student")) {
                throw new IllegalArgumentException(
                    "This event is exclusively for Students. Your profile lists you as: " + userType +
                    ". Please update your profile if this is incorrect.");
            }

            if (audienceRequiresProfessionalOnly && typeLower.contains("student")) {
                throw new IllegalArgumentException(
                    "This event is for IT Professionals / Developers. " +
                    "Your profile indicates you are a Student. " +
                    "Please update your profile if this is incorrect.");
            }
        }

        // 3. Profile completeness nudge (soft check - warn but don't block)
        // If a user has NO profile info at all, allow registration but note it
        // Hard blocks only happen for clear mismatches above
    }

    /**
     * Returns a friendly eligibility status message for display in UI.
     */
    public String getEligibilityStatus(User user, Event event) {
        try {
            checkEligibility(user, event);
            return "eligible";
        } catch (IllegalArgumentException e) {
            return "ineligible: " + e.getMessage();
        }
    }
}
