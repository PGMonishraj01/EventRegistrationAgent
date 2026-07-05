package com.eventagent.service;

import com.eventagent.entity.Event;
import com.eventagent.entity.Registration;
import com.eventagent.entity.User;
import com.eventagent.repository.ChatMessageRepository;
import com.eventagent.repository.EventRepository;
import com.eventagent.repository.RegistrationRepository;
import com.eventagent.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AgentServiceTest {

    private static AgentService buildService(UserRepository ur, EventRepository er,
                                              RegistrationRepository rr) {
        return new AgentService(
                Mockito.mock(HistoryService.class),
                ur,
                er,
                rr,
                Mockito.mock(ChatMessageRepository.class),
                Mockito.mock(EligibilityService.class)
        );
    }

    @Test
    void buildRegistrationTicketIncludesRegistrationIdAndEventDetails() {
        AgentService service = buildService(
                Mockito.mock(UserRepository.class),
                Mockito.mock(EventRepository.class),
                Mockito.mock(RegistrationRepository.class)
        );

        String ticket = service.buildRegistrationTicket("AI Summit", "EVT-2026-00001", "Ada Lovelace");

        assertThat(ticket).contains("AI Summit");
        assertThat(ticket).contains("EVT-2026-00001");
        assertThat(ticket).contains("Ada Lovelace");
    }

    @Test
    void buildOrganizerFormDocumentIncludesEventDetails() {
        AgentService service = buildService(
                Mockito.mock(UserRepository.class),
                Mockito.mock(EventRepository.class),
                Mockito.mock(RegistrationRepository.class)
        );

        String formDoc = service.buildOrganizerFormDocument("AI Summit", "Technology", "Campus Hall", "Ada Lovelace", "2026-08-10");

        assertThat(formDoc).contains("AI Summit");
        assertThat(formDoc).contains("Technology");
        assertThat(formDoc).contains("Campus Hall");
        assertThat(formDoc).contains("2026-08-10");
    }

    @Test
    void registerEventByIdReducesSeatsByRequestedTicketCount() {
        UserRepository userRepository = Mockito.mock(UserRepository.class);
        EventRepository eventRepository = Mockito.mock(EventRepository.class);
        RegistrationRepository registrationRepository = Mockito.mock(RegistrationRepository.class);

        // Use a real EligibilityService (it has no external deps)
        EligibilityService eligibilityService = new EligibilityService();

        AgentService service = new AgentService(
                Mockito.mock(HistoryService.class),
                userRepository,
                eventRepository,
                registrationRepository,
                Mockito.mock(ChatMessageRepository.class),
                eligibilityService
        );

        User user = new User();
        user.setId(1L);
        Event event = new Event();
        event.setId(10L);
        event.setName("AI Summit");
        event.setAvailableSeats(10);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));
        when(registrationRepository.findByUserIdAndEventId(1L, 10L)).thenReturn(Optional.empty());
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(registrationRepository.save(any(Registration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String message = service.registerEventById(10L, 1L, 3);

        assertThat(message).contains("Registration Successful");
        assertThat(event.getAvailableSeats()).isEqualTo(7);
        verify(eventRepository).save(any(Event.class));
    }
}
