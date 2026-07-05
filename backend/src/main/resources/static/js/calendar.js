// calendar.js

// 1. Dictionary of Special Occasions (Month: 0-indexed)
const SPECIAL_OCCASIONS = {
    0: { // January
        1: { name: "New Year's Day", suggestion: "New Year Launch Event or Corporate Kickoff Meeting" },
        15: { name: "Indian Army Day", suggestion: "Army Tribute Ceremony or Charity Marathon" },
        26: { name: "Republic Day (India)", suggestion: "Republic Day Gala or Cultural Flag Hoisting Festival" }
    },
    1: { // February
        14: { name: "Valentine's Day", suggestion: "Couple's Dinner Experience or Networking Social" },
        28: { name: "National Science Day", suggestion: "STEM Innovation Exhibition or Science Fair" }
    },
    2: { // March
        8: { name: "International Women's Day", suggestion: "Women in Leadership Panels & Networking Seminar" },
        21: { name: "World Poetry Day", suggestion: "Poetry Recital & Open Mic Night" }
    },
    3: { // April
        7: { name: "World Health Day", suggestion: "Corporate Wellness Workshop & Fitness Fair" },
        22: { name: "Earth Day", suggestion: "Sustainability Seminar or Tree Planting Drive" }
    },
    4: { // May
        1: { name: "International Workers' Day", suggestion: "Employee Appreciation Dinner & Awards" },
        11: { name: "National Technology Day", suggestion: "Tech Pitch Competition & Startup Showcase" }
    },
    5: { // June
        5: { name: "World Environment Day", suggestion: "Green Planet Eco-Seminars & Recycle Drive" },
        21: { name: "International Yoga Day", suggestion: "Outdoor Yoga & Mindful Meditation Retreat" }
    },
    6: { // July
        1: { name: "National Doctors' Day", suggestion: "Healthcare Appreciation Summit" },
        4: { name: "Independence Day (USA)", suggestion: "Outdoor Barbecue & Networking Gala" }
    },
    7: { // August
        15: { name: "Independence Day (India)", suggestion: "National Pride Run or Independence Day Concert" },
        29: { name: "National Sports Day", suggestion: "Community Sports Day & Athletic Tournaments" }
    },
    8: { // September
        5: { name: "Teachers' Day", suggestion: "Academic Excellence Symposium & Gala Dinner" },
        15: { name: "Engineers' Day", suggestion: "Hackathon or Rapid Engineering Sprint" },
        27: { name: "World Tourism Day", suggestion: "Travel & Culture Expo" }
    },
    9: { // October
        2: { name: "Gandhi Jayanti", suggestion: "Peace & Voluntary Community Drive" },
        16: { name: "World Food Day", suggestion: "Food Festival or Charity Culinary Cook-off" },
        31: { name: "Halloween", suggestion: "Halloween Costume Mixer & Networking Event" }
    },
    10: { // November
        14: { name: "Children's Day", suggestion: "STEM Coding Workshop & Game Carnival for Kids" },
        26: { name: "Constitution Day (India)", suggestion: "Civic Rights Panel & Legal Discussion Forum" }
    },
    11: { // December
        10: { name: "Human Rights Day", suggestion: "Diversity and Inclusion Seminar" },
        25: { name: "Christmas Day", suggestion: "Christmas Charity Gala & Dinner Celebration" }
    }
};

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

let displayedDate = new Date(); // Date displaying on monthly calendar
let selectedDate = new Date();  // Currently selected date

document.addEventListener('DOMContentLoaded', () => {
    initCalendar();
});

function initCalendar() {
    renderCalendar();

    // Attach Month Navigation Listeners
    document.getElementById('prev-month-btn').addEventListener('click', () => {
        displayedDate.setMonth(displayedDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('next-month-btn').addEventListener('click', () => {
        displayedDate.setMonth(displayedDate.getMonth() + 1);
        renderCalendar();
    });

    // Attach Ask AI to Plan Button Listener
    const askBtn = document.getElementById('calendar-ask-ai-btn');
    askBtn.addEventListener('click', () => {
        const title = document.getElementById('selected-date-title').textContent;
        const occasion = document.getElementById('occasion-badge').textContent;
        const suggestion = document.getElementById('calendar-recommendation-text').textContent;
        
        let query = "";
        if (occasion !== "No special occasion today") {
            query = `Suggest events and recommend what to register for on ${occasion} scheduled on ${title}`;
        } else {
            query = `Suggest events and recommend what to register for related to ${suggestion.replace('Suggested Event: ', '')} scheduled on ${title}`;
        }
        
        triggerAISearch(query);
    });

    // Attach Interactive Welcome Category Selectors
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('event-pill')) {
            const eventType = e.target.getAttribute('data-event');
            const query = `Suggest event recommendations to register for a ${eventType}`;
            triggerAISearch(query);
        }
    });

    // Trigger Initial Suggestions
    updateSuggestions(selectedDate);
}

function renderCalendar() {
    const month = displayedDate.getMonth();
    const year = displayedDate.getFullYear();

    // Set Month-Year Title
    document.getElementById('calendar-month-year').textContent = `${MONTH_NAMES[month]} ${year}`;

    const daysGrid = document.getElementById('calendar-days-grid');
    daysGrid.innerHTML = '';

    // First day of the month index (0: Sunday, 1: Monday, etc.)
    const firstDayIndex = new Date(year, month, 1).getDay();

    // Number of days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Render Empty Slots for preceding month days
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        daysGrid.appendChild(emptyCell);
    }

    // Render Actual Days
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;

        const cellDate = new Date(year, month, day);

        // Check if day matches today
        if (cellDate.toDateString() === today.toDateString()) {
            dayCell.classList.add('today');
        }

        // Check if day is currently selected
        if (cellDate.toDateString() === selectedDate.toDateString()) {
            dayCell.classList.add('selected');
        }

        // Check if day has a special occasion
        if (SPECIAL_OCCASIONS[month] && SPECIAL_OCCASIONS[month][day]) {
            dayCell.classList.add('has-occasion');
        }

        // Add Click Listener
        dayCell.addEventListener('click', () => {
            selectedDate = cellDate;
            
            // Remove 'selected' class from previously selected day
            const prevSelected = daysGrid.querySelector('.calendar-day.selected');
            if (prevSelected) prevSelected.classList.remove('selected');
            
            // Add 'selected' to current day
            dayCell.classList.add('selected');

            updateSuggestions(selectedDate);
        });

        daysGrid.appendChild(dayCell);
    }

    // Update upcoming events list for this month
    renderUpcomingEvents(month, year);
}

function updateSuggestions(date) {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    document.getElementById('selected-date-title').textContent = formattedDate;

    const occasionBadge = document.getElementById('occasion-badge');
    const recText = document.getElementById('calendar-recommendation-text');
    const askBtn = document.getElementById('calendar-ask-ai-btn');

    // Check Occasion
    if (SPECIAL_OCCASIONS[month] && SPECIAL_OCCASIONS[month][day]) {
        const occasion = SPECIAL_OCCASIONS[month][day];
        occasionBadge.textContent = occasion.name;
        occasionBadge.className = "occasion-badge";
        recText.innerHTML = `💡 <strong>Idea:</strong> Organize a <strong>${occasion.suggestion}</strong> to celebrate this occasion.`;
        askBtn.style.display = "block";
    } else {
        // Fallback generic suggestion based on weekday
        occasionBadge.textContent = "No special occasion today";
        occasionBadge.className = "occasion-badge none";
        
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        if (isWeekend) {
            recText.innerHTML = `Suggested Event: <strong>Social Networking Celebration or Sports Tournament</strong> (Ideal for weekends)`;
        } else {
            recText.innerHTML = `Suggested Event: <strong>Corporate Business Meeting or Technical Workshop Seminar</strong> (Ideal for weekdays)`;
        }
        askBtn.style.display = "block";
    }
}

function renderUpcomingEvents(month, year) {
    const listContainer = document.getElementById('upcoming-events-list');
    listContainer.innerHTML = '';

    const occasionsInMonth = SPECIAL_OCCASIONS[month] || {};
    const days = Object.keys(occasionsInMonth).sort((a, b) => parseInt(a) - parseInt(b));

    if (days.length === 0) {
        listContainer.innerHTML = `
            <div style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; padding: 10px 0;">
                No fixed occasions in this month.
            </div>
        `;
        return;
    }

    days.forEach(day => {
        const occasion = occasionsInMonth[day];
        
        const item = document.createElement('div');
        item.className = 'upcoming-event-item';
        
        const dateStr = `${MONTH_NAMES[month].substring(0, 3)} ${day}`;
        
        item.innerHTML = `
            <div class="upcoming-event-info">
                <span class="upcoming-event-date">${dateStr}</span>
                <span class="upcoming-event-name">${occasion.name}</span>
            </div>
            <span class="upcoming-event-arrow">&rarr;</span>
        `;

        item.addEventListener('click', () => {
            selectedDate = new Date(year, month, parseInt(day));
            displayedDate = new Date(year, month, parseInt(day));
            renderCalendar();
            updateSuggestions(selectedDate);
        });

        listContainer.appendChild(item);
    });
}

function triggerAISearch(query) {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    if (input && sendBtn) {
        input.value = query;
        sendBtn.click();
    }
}
