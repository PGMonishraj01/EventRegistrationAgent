package com.eventagent.service;

import com.eventagent.entity.Event;
import com.eventagent.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;

@Service
public class EventSeeder implements CommandLineRunner {

    private final EventRepository eventRepository;

    @Autowired
    public EventSeeder(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (eventRepository.count() == 0) {
            Event[] events = new Event[]{
                new Event(
                    "AI Bootcamp 2026",
                    "Covers Machine Learning, Deep Learning and Generative AI.",
                    "Artificial Intelligence",
                    LocalDate.of(2026, 7, 15),
                    "09:00 AM",
                    "Silicon Valley Tech Center",
                    "AI Pioneer Group",
                    2500.0,
                    25,
                    "3 Days",
                    "Developers, Students",
                    "★★★★★"
                ),
                new Event(
                    "Prompt Engineering Workshop",
                    "Best suited for beginners interested in AI prompting techniques.",
                    "Artificial Intelligence",
                    LocalDate.of(2026, 7, 20),
                    "02:00 PM",
                    "Online / Virtual",
                    "PromptCraft Academy",
                    500.0,
                    50,
                    "4 Hours",
                    "Beginners, Non-programmers",
                    "★★★★☆"
                ),
                new Event(
                    "AI Career Summit",
                    "Helps students explore AI career opportunities and build portfolios.",
                    "Artificial Intelligence",
                    LocalDate.of(2026, 7, 28),
                    "10:00 AM",
                    "Grand Convention Hall",
                    "Future Careers Org",
                    0.0,
                    100,
                    "1 Day",
                    "Students, Graduates",
                    "★★★★★"
                ),
                new Event(
                    "Machine Learning Workshop",
                    "Hands-on implementation of ML algorithms using Python.",
                    "Machine Learning",
                    LocalDate.of(2026, 7, 18),
                    "11:00 AM",
                    "Tech Lab B",
                    "DataScience Labs",
                    1200.0,
                    30,
                    "2 Days",
                    "Software Developers",
                    "★★★★☆"
                ),
                new Event(
                    "Generative AI Summit",
                    "Conference showcasing latest LLMs, image generation, and agents.",
                    "Artificial Intelligence",
                    LocalDate.of(2026, 7, 22),
                    "09:00 AM",
                    "Hyatt Regency Hall",
                    "GenAI Network",
                    3000.0,
                    150,
                    "1 Day",
                    "AI Researchers, Developers",
                    "★★★★★"
                ),
                new Event(
                    "Communication Skills Workshop",
                    "Master verbal and non-verbal communications.",
                    "Public Speaking",
                    LocalDate.of(2026, 7, 10),
                    "10:00 AM",
                    "Focus Training Center",
                    "SpeechCraft Associates",
                    800.0,
                    40,
                    "1 Day",
                    "Professionals, Managers",
                    "★★★★☆"
                ),
                new Event(
                    "Leadership Development Program",
                    "Build leadership traits, team delegation, and strategy skills.",
                    "Management",
                    LocalDate.of(2026, 7, 25),
                    "09:00 AM",
                    "Executive Plaza",
                    "Global Leadership Inst",
                    5000.0,
                    20,
                    "5 Days",
                    "Team Leaders, Executives",
                    "★★★★★"
                ),
                new Event(
                    "Public Speaking Masterclass",
                    "Learn to command the stage and reduce stage fright.",
                    "Public Speaking",
                    LocalDate.of(2026, 8, 2),
                    "03:00 PM",
                    "Auditorium Prime",
                    "Orators Guild",
                    1500.0,
                    60,
                    "1 Day",
                    "Public Speakers, Beginners",
                    "★★★★★"
                ),
                new Event(
                    "Startup Networking Meetup",
                    "Pitch your ideas and network with local founders and angels.",
                    "Networking",
                    LocalDate.of(2026, 7, 12),
                    "06:00 PM",
                    "Rooftop Lounge",
                    "StartupHub",
                    300.0,
                    80,
                    "3 Hours",
                    "Founders, Investors",
                    "★★★★☆"
                ),
                new Event(
                    "Industry Connect Conference",
                    "Connecting academia with industry leaders for collaboration.",
                    "Networking",
                    LocalDate.of(2026, 7, 26),
                    "09:00 AM",
                    "Metropolitan Expo",
                    "ConnectCorp",
                    2000.0,
                    200,
                    "2 Days",
                    "Professionals, Recruiters",
                    "★★★★★"
                ),
                new Event(
                    "Young Entrepreneurs Summit",
                    "Empowering next-gen founders with tools and resources.",
                    "Networking",
                    LocalDate.of(2026, 8, 5),
                    "10:00 AM",
                    "Innovation Center",
                    "Youth Biz Network",
                    1000.0,
                    120,
                    "1 Day",
                    "Entrepreneurs under 30",
                    "★★★★★"
                ),
                new Event(
                    "Java Spring Boot Masterclass",
                    "Build enterprise REST APIs with Spring Boot and Hibernate.",
                    "Software Engineering",
                    LocalDate.of(2026, 7, 14),
                    "09:00 AM",
                    "Virtual Classroom",
                    "JavaDevs Community",
                    1800.0,
                    40,
                    "2 Days",
                    "Backend Developers",
                    "★★★★★"
                ),
                new Event(
                    "Cloud Computing Workshop",
                    "Deploy scalable apps on AWS, GCP, and Azure.",
                    "Software Engineering",
                    LocalDate.of(2026, 7, 21),
                    "10:00 AM",
                    "CloudLabs Institute",
                    "Cloud Architecture Group",
                    2200.0,
                    30,
                    "1 Day",
                    "DevOps & Cloud Engineers",
                    "★★★★☆"
                ),
                new Event(
                    "AI for Developers Summit",
                    "Leveraging APIs, embeddings, and agentic workflows in code.",
                    "Software Engineering",
                    LocalDate.of(2026, 7, 29),
                    "09:00 AM",
                    "Tech Hall One",
                    "DevAI Guild",
                    2800.0,
                    80,
                    "1 Day",
                    "Software Engineers",
                    "★★★★★"
                ),
                new Event(
                    "Green Technology Expo",
                    "Showcasing eco-friendly technology and sustainability solutions.",
                    "Environment",
                    LocalDate.of(2026, 6, 5), // Environment Day
                    "10:00 AM",
                    "Eco Convention Hall",
                    "GreenPlanet Org",
                    0.0,
                    300,
                    "1 Day",
                    "All Sustainability Enthusiasts",
                    "★★★★☆"
                ),
                new Event(
                    "Women Leadership Summit",
                    "Empowering female leaders, panel discussions, and career advice.",
                    "Leadership",
                    LocalDate.of(2026, 3, 8), // Women's Day
                    "09:30 AM",
                    "Empower Ballroom",
                    "WomenInBiz Network",
                    1200.0,
                    150,
                    "1 Day",
                    "Aspiring Female Leaders",
                    "★★★★★"
                ),
                new Event(
                    "National Technology Hackathon",
                    "24-hour hackathon focused on national development tech.",
                    "Technology",
                    LocalDate.of(2026, 5, 11), // Technology Day
                    "09:00 AM",
                    "Tech Park Incubator",
                    "Ministry of Tech",
                    0.0,
                    100,
                    "2 Days",
                    "Developers, Students",
                    "★★★★★"
                ),
                new Event(
                    "Academic Excellence Conference",
                    "Exploring modern pedagogy, student engagement, and educational tools.",
                    "Education",
                    LocalDate.of(2026, 9, 5), // Teacher's Day
                    "09:00 AM",
                    "EdTech University Hall",
                    "Educators League",
                    1500.0,
                    200,
                    "2 Days",
                    "Teachers, Academicians",
                    "★★★★★"
                ),
                new Event(
                    "Rapid Engineering Hackathon",
                    "A quick-paced prototyping contest to build helpful utilities.",
                    "Engineering",
                    LocalDate.of(2026, 9, 15), // Engineers' Day
                    "09:00 AM",
                    "Makerspace Lab",
                    "Engineers Hub",
                    0.0,
                    50,
                    "24 Hours",
                    "Engineers, Tinkerers",
                    "★★★★★"
                )
            };

            eventRepository.saveAll(Arrays.asList(events));
            System.out.println("Seeded database with " + events.length + " default events.");
        }
    }
}
