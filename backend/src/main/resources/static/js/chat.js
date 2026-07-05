const API_BASE = 'http://localhost:8081/api/agent';
const CHAT_API = `${API_BASE}/chat`;
const EVENTS_API = `${API_BASE}/events`;
const SUGGEST_FORM_API = `${API_BASE}/suggest-form`;

let activeRegistrationModal = null;
let currentUserId = null;

document.addEventListener('DOMContentLoaded', () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
        return;
    }

    const user = JSON.parse(userData);
    const userId = user.id;
    currentUserId = userId;

    const chatContainer = document.getElementById('chat-container');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const eventsGrid = document.getElementById('events-grid');

    const organizeForm = document.getElementById('organize-event-form');
    const formEventNameInput = document.getElementById('form-event-name');
    const formCategoryInput = document.getElementById('form-category');
    const formCategoryCustomInput = document.getElementById('form-category-custom');
    const formOrganizerInput = document.getElementById('form-organizer');
    const formDescriptionInput = document.getElementById('form-description');
    const formDateInput = document.getElementById('form-date');
    const formTimeInput = document.getElementById('form-time');
    const formVenueInput = document.getElementById('form-venue');
    const formDurationInput = document.getElementById('form-duration');
    const formFeeInput = document.getElementById('form-fee');
    const formSeatsInput = document.getElementById('form-seats');
    const formAudienceInput = document.getElementById('form-audience');

    const launchpadUserName = document.getElementById('launchpad-user-name');
    const launchpadUserIndustry = document.getElementById('launchpad-user-industry');

    const tabMap = {
        home: {
            button: document.getElementById('tab-btn-home'),
            view: document.getElementById('view-home')
        },
        chat: {
            button: document.getElementById('tab-btn-chat'),
            view: document.getElementById('view-chat')
        },
        register: {
            button: document.getElementById('tab-btn-register'),
            view: document.getElementById('view-register'),
            onEnter: loadEventsGrid
        },
        organize: {
            button: document.getElementById('tab-btn-organize'),
            view: document.getElementById('view-organize')
        }
    };

    let activeTab = 'home';
    let activeAssistantMode = 'register';

    const assistantDrawer = document.getElementById('assistant-drawer');
    const assistantBackdrop = document.getElementById('assistant-backdrop');
    const assistantCloseBtn = document.getElementById('assistant-close-btn');
    const assistantContextLabel = document.getElementById('assistant-context-label');
    const assistantTitle = document.getElementById('assistant-title');
    const assistantDescription = document.getElementById('assistant-panel-description');
    const assistantPromptInput = document.getElementById('assistant-prompt-input');
    const assistantRunBtn = document.getElementById('assistant-run-btn');
    const assistantChatJumpBtn = document.getElementById('assistant-chat-jump-btn');
    const assistantStatus = document.getElementById('assistant-status');
    const assistantResult = document.getElementById('assistant-result');

    if (launchpadUserName) {
        launchpadUserName.textContent = user.fullName || 'User';
    }
    if (launchpadUserIndustry) {
        launchpadUserIndustry.textContent = `Industry: ${user.industry || 'General'}`;
    }

    const toggleCustomCategoryInput = () => {
        if (!formCategoryCustomInput) {
            return;
        }
        const shouldShow = formCategoryInput.value === 'Other';
        formCategoryCustomInput.style.display = shouldShow ? 'block' : 'none';
        if (!shouldShow) {
            formCategoryCustomInput.value = '';
        }
    };

    formCategoryInput.addEventListener('change', toggleCustomCategoryInput);
    formCategoryInput.addEventListener('input', toggleCustomCategoryInput);
    toggleCustomCategoryInput();
    initNotificationCenter();

    Object.entries(tabMap).forEach(([key, config]) => {
        config.button.addEventListener('click', async () => {
            await switchTab(key);
        });
    });

    document.getElementById('launchpad-organize-btn').addEventListener('click', async () => {
        await switchTab('organize');
    });
    document.getElementById('launchpad-register-btn').addEventListener('click', async () => {
        await switchTab('register');
    });
    document.getElementById('launchpad-chat-btn').addEventListener('click', async () => {
        await switchTab('chat');
        chatInput.focus();
    });

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    document.getElementById('browse-ai-btn').addEventListener('click', async () => {
        openAssistant('register', {
            prompt: buildRegistrationPrompt(),
            autoRun: true
        });
    });

    document.getElementById('ai-copilot-btn').addEventListener('click', async () => {
        openAssistant('organize', {
            prompt: buildOrganizerPrompt(),
            autoRun: true
        });
    });

    assistantBackdrop.addEventListener('click', closeAssistant);
    assistantCloseBtn.addEventListener('click', closeAssistant);
    assistantRunBtn.addEventListener('click', async () => {
        await runAssistant(activeAssistantMode);
    });
    assistantChatJumpBtn.addEventListener('click', async () => {
        const prompt = assistantPromptInput.value.trim();
        closeAssistant();
        await switchTab('chat');
        chatInput.value = activeAssistantMode === 'organize'
            ? `Help me organize this event: ${prompt || buildOrganizerPrompt()}`
            : prompt || buildRegistrationPrompt();
        await sendMessage();
    });

    organizeForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitBtn = organizeForm.querySelector('.host-event-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Hosting Event...';

        const eventData = collectFormEventData();

        try {
            const response = await fetch(EVENTS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });

            const result = await response.json();

            if (response.ok) {
                const formDocument = buildOrganizerFormContent(eventData);
                downloadTextFile(formDocument, `${eventData.name.replace(/\s+/g, '_')}_organizer_form.md`);
                alert(`Event "${eventData.name}" has been successfully hosted and is live for all users.`);
                organizeForm.reset();
                toggleCustomCategoryInput();
                await switchTab('register');
            } else {
                alert(result.message || 'Failed to host event.');
            }
        } catch (error) {
            console.error('Error hosting event:', error);
            alert('Connection error. Make sure the backend is running.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Host Event Live';
        }
    });

    window.loadEventsGrid = loadEventsGrid;

    window.displayHistoricalChat = async (title, content, category) => {
        await switchTab('chat');
        chatContainer.innerHTML = '';

        const alertBubble = document.createElement('div');
        alertBubble.className = 'chat-bubble ai';

        const sender = document.createElement('div');
        sender.className = 'bubble-sender';
        sender.textContent = 'System Recall';

        const inner = document.createElement('div');
        inner.className = 'bubble-content';
        inner.innerHTML = `
            <h3>Session Recall: ${escapeHtml(title)}</h3>
            <p style="font-size: 0.85rem; color: var(--primary-color);">Loaded from your ${escapeHtml(category.toLowerCase())} history archives.</p>
            <hr>
        `;

        alertBubble.appendChild(sender);
        alertBubble.appendChild(inner);
        chatContainer.appendChild(alertBubble);

        appendMessage('AI Assistant', content, 'ai');
    };

    window.switchDashboardTab = switchTab;
    window.sendDashboardMessage = async (message) => {
        await switchTab('chat');
        chatInput.value = message;
        await sendMessage();
    };

    async function switchTab(tabName) {
        if (!tabMap[tabName]) {
            return;
        }

        Object.values(tabMap).forEach(({ button, view }) => {
            button.classList.remove('active');
            view.classList.remove('active');
        });

        tabMap[tabName].button.classList.add('active');
        tabMap[tabName].view.classList.add('active');
        activeTab = tabName;

        if (typeof tabMap[tabName].onEnter === 'function') {
            await tabMap[tabName].onEnter();
        }
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) {
            return;
        }

        appendMessage('User', text, 'user');
        chatInput.value = '';

        const loaderId = appendLoaderBubble();

        try {
            const data = await postChatMessage(text);
            removeLoaderBubble(loaderId);

            appendMessage('AI Assistant', data.response, 'ai');
            appendDownloadButtons(chatContainer, data);

            if (data.type && data.type.toUpperCase() === 'TICKET') {
                await handleTicketGenerationFromChat(data.response);
            }

            if (data.historyId && typeof window.refreshHistorySidebar === 'function') {
                window.refreshHistorySidebar();
            }
        } catch (error) {
            console.error('Chat Error:', error);
            removeLoaderBubble(loaderId);
            appendMessage('AI Assistant', 'Network error. Make sure the Spring Boot service is running.', 'ai');
        }
    }

    async function postChatMessage(message) {
        const response = await fetch(CHAT_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId.toString()
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to process chat request.');
        }

        return data;
    }

    async function loadEventsGrid() {
        eventsGrid.innerHTML = '<div class="events-grid-message">Loading available events...</div>';

        try {
            const eventsResponse = await fetch(EVENTS_API);
            const events = await eventsResponse.json();

            let registeredIds = [];
            try {
                const regResponse = await fetch(`${API_BASE}/registrations/${userId}`);
                if (regResponse.ok) {
                    registeredIds = await regResponse.json();
                }
            } catch (error) {
                console.error('Failed to load user registrations:', error);
            }

            eventsGrid.innerHTML = '';
            if (!Array.isArray(events) || events.length === 0) {
                eventsGrid.innerHTML = '<div class="events-grid-message">No events available at this time.</div>';
                return;
            }

            events.forEach((eventItem) => {
                const card = createEventCard(eventItem, registeredIds);
                eventsGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading events:', error);
            eventsGrid.innerHTML = '<div class="events-grid-message error">Failed to load events from server.</div>';
        }
    }

    function createEventCard(eventItem, registeredIds) {
        const isRegistered = registeredIds.includes(eventItem.id);
        const isFull = eventItem.availableSeats <= 0;
        const feeFormatted = Number(eventItem.registrationFee) === 0 ? 'Free' : `INR ${eventItem.registrationFee}`;

        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <div class="event-card-header">
                <span class="event-card-category">${escapeHtml(eventItem.category || 'General')}</span>
                <span class="event-card-rating">${escapeHtml(eventItem.rating || 'Top rated')}</span>
            </div>
            <h3 class="event-card-title">${escapeHtml(eventItem.name)}</h3>
            <p class="event-card-desc">${escapeHtml(eventItem.description || 'No description provided.')}</p>
            <div class="event-card-details">
                <div class="event-card-detail-item"><strong>Date:</strong> ${escapeHtml(eventItem.eventDate || 'TBA')}</div>
                <div class="event-card-detail-item"><strong>Time:</strong> ${escapeHtml(eventItem.eventTime || '10:00 AM')}</div>
                <div class="event-card-detail-item"><strong>Venue:</strong> ${escapeHtml(eventItem.venue || 'Online')}</div>
                <div class="event-card-detail-item"><strong>Organizer:</strong> ${escapeHtml(eventItem.organizer || 'Organizer pending')}</div>
                <div class="event-card-detail-item"><strong>Audience:</strong> ${escapeHtml(eventItem.targetAudience || 'All')}</div>
                <div class="event-card-detail-item"><strong>Duration:</strong> ${escapeHtml(eventItem.duration || '1 Day')}</div>
                <div class="event-card-detail-item"><strong>Seats Left:</strong> ${escapeHtml(String(eventItem.availableSeats ?? 0))}</div>
            </div>
            <div class="event-card-footer">
                <span class="event-card-price">${escapeHtml(feeFormatted)}</span>
                <div class="event-card-actions">
                    <button type="button" class="event-card-link" data-action="details">View Details</button>
                    <button type="button" class="event-card-btn ${isRegistered ? 'registered' : ''}" ${isRegistered || isFull ? 'disabled' : ''}>
                        ${isRegistered ? 'Registered' : (isFull ? 'Sold Out' : 'Register')}
                    </button>
                </div>
            </div>
        `;

        const registerButton = card.querySelector('.event-card-btn');
        const detailsButton = card.querySelector('.event-card-link');

        if (!isRegistered && !isFull) {
            registerButton.addEventListener('click', () => {
                showRegistrationModal(eventItem, registerButton);
            });
        }

        detailsButton.addEventListener('click', () => {
            showEventDetailsModal(eventItem, registerButton);
        });

        return card;
    }

    function openAssistant(mode, options = {}) {
        activeAssistantMode = mode;

        if (mode === 'organize') {
            assistantContextLabel.textContent = 'Organizer AI Assistant';
            assistantTitle.textContent = 'Generate event details for your institution or organization';
            assistantDescription.textContent = 'Describe your event idea, institution, audience, or venue needs. The AI will suggest details and auto-fill the organizer form.';
            assistantRunBtn.textContent = 'Auto-fill Event Form';
        } else {
            assistantContextLabel.textContent = 'Registration AI Assistant';
            assistantTitle.textContent = 'Find the right event to register for';
            assistantDescription.textContent = 'Tell the AI what kind of events you want, and it will recommend available events from the live list.';
            assistantRunBtn.textContent = 'Get Event Suggestions';
        }

        assistantPromptInput.value = options.prompt || '';
        assistantStatus.textContent = '';
        assistantStatus.className = 'assistant-status';
        assistantResult.innerHTML = '<p>Suggestions will appear here after you click the assistant.</p>';

        assistantDrawer.classList.add('open');
        assistantDrawer.setAttribute('aria-hidden', 'false');

        window.setTimeout(() => {
            assistantPromptInput.focus();
            assistantPromptInput.setSelectionRange(assistantPromptInput.value.length, assistantPromptInput.value.length);
        }, 50);

        if (options.autoRun) {
            runAssistant(mode);
        }
    }

    function closeAssistant() {
        assistantDrawer.classList.remove('open');
        assistantDrawer.setAttribute('aria-hidden', 'true');
    }

    async function runAssistant(mode) {
        const prompt = assistantPromptInput.value.trim();

        assistantRunBtn.disabled = true;
        assistantStatus.textContent = 'AI assistant is working...';
        assistantStatus.className = 'assistant-status loading';

        try {
            if (mode === 'organize') {
                const response = await fetch(SUGGEST_FORM_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formEventNameInput.value.trim(),
                        description: formDescriptionInput.value.trim(),
                        prompt
                    })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to generate organizer suggestions.');
                }

                fillOrganizeForm(data);
                assistantResult.innerHTML = renderOrganizerSuggestionSummary(data);
                assistantStatus.textContent = 'Suggestions added to the organizer form.';
                assistantStatus.className = 'assistant-status success';
                await switchTab('organize');
            } else {
                const message = prompt || buildRegistrationPrompt();
                const data = await postChatMessage(message);
                assistantResult.innerHTML = formatMarkdown(data.response);
                assistantStatus.textContent = 'Suggestions are ready.';
                assistantStatus.className = 'assistant-status success';

                if (data.historyId && typeof window.refreshHistorySidebar === 'function') {
                    window.refreshHistorySidebar();
                }
            }
        } catch (error) {
            console.error('Assistant error:', error);
            assistantStatus.textContent = error.message || 'The assistant could not complete that request.';
            assistantStatus.className = 'assistant-status error';
            assistantResult.innerHTML = '<p>Please try again with a little more detail.</p>';
        } finally {
            assistantRunBtn.disabled = false;
        }
    }

    function fillOrganizeForm(data) {
        if (data.name && !formEventNameInput.value.trim()) formEventNameInput.value = data.name;
        if (data.category) {
            const knownCategories = ['Technology', 'Software Engineering', 'Education', 'Management', 'Networking'];
            if (knownCategories.includes(data.category)) {
                formCategoryInput.value = data.category;
                formCategoryCustomInput.value = '';
            } else {
                formCategoryInput.value = 'Other';
                formCategoryCustomInput.value = data.category;
            }
            toggleCustomCategoryInput();
        }
        if (data.organizer) formOrganizerInput.value = data.organizer;
        if (data.description) formDescriptionInput.value = data.description;
        if (data.eventDate) formDateInput.value = data.eventDate;
        if (data.eventTime) formTimeInput.value = data.eventTime;
        if (data.venue) formVenueInput.value = data.venue;
        if (data.duration) formDurationInput.value = data.duration;
        if (data.registrationFee !== undefined) formFeeInput.value = data.registrationFee;
        if (data.availableSeats !== undefined) formSeatsInput.value = data.availableSeats;
        if (data.targetAudience) formAudienceInput.value = data.targetAudience;
    }

    function renderOrganizerSuggestionSummary(data) {
        return `
            <div class="assistant-summary-card">
                <h3>${escapeHtml(data.name || formEventNameInput.value || 'Event plan')}</h3>
                <p>${escapeHtml(data.description || 'Suggestions generated successfully.')}</p>
                <div class="assistant-summary-grid">
                    <span><strong>Category:</strong> ${escapeHtml(data.category || '')}</span>
                    <span><strong>Organizer:</strong> ${escapeHtml(data.organizer || '')}</span>
                    <span><strong>Date:</strong> ${escapeHtml(data.eventDate || '')}</span>
                    <span><strong>Time:</strong> ${escapeHtml(data.eventTime || '')}</span>
                    <span><strong>Venue:</strong> ${escapeHtml(data.venue || '')}</span>
                    <span><strong>Audience:</strong> ${escapeHtml(data.targetAudience || '')}</span>
                    <span><strong>Duration:</strong> ${escapeHtml(data.duration || '')}</span>
                    <span><strong>Fee:</strong> ${escapeHtml(String(data.registrationFee ?? '0'))}</span>
                    <span><strong>Seats:</strong> ${escapeHtml(String(data.availableSeats ?? '50'))}</span>
                </div>
            </div>
        `;
    }

    function buildOrganizerPrompt() {
        const parts = [
            formEventNameInput.value.trim(),
            formOrganizerInput.value.trim(),
            formDescriptionInput.value.trim(),
            formAudienceInput.value.trim()
        ].filter(Boolean);

        if (parts.length > 0) {
            return `Create event suggestions based on this draft: ${parts.join(' | ')}`;
        }

        return `Suggest event details for a ${user.industry || 'general'} institution or organization that wants to host a new event.`;
    }

    function buildRegistrationPrompt() {
        return `Suggest available events for a user in the ${user.industry || 'general'} industry. Recommend the best events to register for and explain why.`;
    }

    function collectFormEventData() {
        const categoryValue = formCategoryInput.value === 'Other'
            ? (formCategoryCustomInput.value.trim() || 'Other')
            : formCategoryInput.value;

        return {
            name: formEventNameInput.value.trim(),
            category: categoryValue,
            organizer: formOrganizerInput.value.trim(),
            description: formDescriptionInput.value.trim(),
            eventDate: formDateInput.value,
            eventTime: formTimeInput.value.trim(),
            venue: formVenueInput.value.trim(),
            duration: formDurationInput.value.trim(),
            registrationFee: parseFloat(formFeeInput.value) || 0.0,
            availableSeats: parseInt(formSeatsInput.value, 10) || 50,
            targetAudience: formAudienceInput.value.trim()
        };
    }

    function parseTicketMarkdown(markdown) {
        if (!markdown) return null;
        const eventMatch = markdown.match(/\*\*Event\*\*:\s*([^\n\r*]+)/i);
        const regIdMatch = markdown.match(/\*\*Registration ID\*\*:\s*([^\n\r*]+)/i);
        const attendeeMatch = markdown.match(/\*\*Attendee\*\*:\s*([^\n\r*]+)/i);
        
        if (eventMatch && regIdMatch && attendeeMatch) {
            return {
                eventName: eventMatch[1].trim(),
                registrationId: regIdMatch[1].trim(),
                attendeeName: attendeeMatch[1].trim(),
                ticketCount: 1,
                paymentMode: 'UPI',
                referenceId: 'N/A',
                eventDate: 'TBA',
                eventTime: '10:00 AM',
                venue: 'Online',
                organizer: 'Organizer pending'
            };
        }
        return null;
    }

    async function handleTicketGenerationFromChat(markdown) {
        const ticketInfo = parseTicketMarkdown(markdown);
        if (!ticketInfo) {
            return;
        }

        try {
            const eventsResponse = await fetch(EVENTS_API);
            if (eventsResponse.ok) {
                const events = await eventsResponse.json();
                const matched = events.find(e => e.name.toLowerCase() === ticketInfo.eventName.toLowerCase() || 
                                                 ticketInfo.eventName.toLowerCase().includes(e.name.toLowerCase()) ||
                                                 e.name.toLowerCase().includes(ticketInfo.eventName.toLowerCase()));
                if (matched) {
                    ticketInfo.eventDate = matched.eventDate || 'TBA';
                    ticketInfo.eventTime = matched.eventTime || '10:00 AM';
                    ticketInfo.venue = matched.venue || 'Online';
                    ticketInfo.organizer = matched.organizer || 'Organizer pending';
                }
            }
        } catch (err) {
            console.error("Failed to enrich ticket details from events API:", err);
        }

        try {
            const ticketDataUrl = await createTicketImage(ticketInfo);
            
            // Render inline in the chat
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'chat-ticket-preview-wrapper';
            imgWrapper.style.margin = '15px 0';
            imgWrapper.style.display = 'flex';
            imgWrapper.style.justifyContent = 'center';
            imgWrapper.style.width = '100%';

            const img = document.createElement('img');
            img.src = ticketDataUrl;
            img.alt = 'Event Ticket';
            img.className = 'ticket-preview-image';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '14px';
            img.style.boxShadow = 'var(--shadow-md)';

            imgWrapper.appendChild(img);
            chatContainer.appendChild(imgWrapper);
            chatContainer.scrollTop = chatContainer.scrollHeight;

            // Trigger auto download
            const downloadLink = document.createElement('a');
            downloadLink.href = ticketDataUrl;
            downloadLink.download = `${ticketInfo.eventName.replace(/\s+/g, '_')}_ticket.png`;
            downloadLink.click();

            // Refresh events grid in background if we registered
            if (typeof window.loadEventsGrid === 'function') {
                await window.loadEventsGrid();
            }
            
            // Refresh notification badge
            if (typeof window.updateNotificationCenter === 'function') {
                await window.updateNotificationCenter();
            }
        } catch (err) {
            console.error("Failed to generate and download ticket image from chat:", err);
        }
    }

    // Notification Center Logic
    async function initNotificationCenter() {
        const notifBtn = document.getElementById('notification-btn');
        const notifDropdown = document.getElementById('notification-dropdown');
        const notifBadge = document.getElementById('notification-badge');
        const notifList = document.getElementById('notification-list');
        const clearNotifBtn = document.getElementById('clear-notifications-btn');

        if (!notifBtn || !notifDropdown || !notifBadge || !notifList || !clearNotifBtn) {
            return;
        }

        // Toggle dropdown on click
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('active');
            
            // When opened, mark notifications as read
            if (notifDropdown.classList.contains('active')) {
                markAllNotificationsAsRead();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
                notifDropdown.classList.remove('active');
            }
        });

        // Clear button
        clearNotifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            markAllNotificationsAsRead();
            notifDropdown.classList.remove('active');
        });

        // Expose function globally to update dynamically after tickets are booked
        window.updateNotificationCenter = updateNotificationCenter;

        // Run initial load
        await updateNotificationCenter();

        async function updateNotificationCenter() {
            if (!userId) return;

            try {
                // 1. Fetch registered event IDs
                const regResponse = await fetch(`${API_BASE}/registrations/${userId}`);
                if (!regResponse.ok) throw new Error("Failed to load registrations");
                const registeredIds = await regResponse.json();

                // 2. Fetch all events
                const eventsResponse = await fetch(EVENTS_API);
                if (!eventsResponse.ok) throw new Error("Failed to load events");
                const events = await eventsResponse.json();

                // 3. Filter to match registered events and filter for upcoming/today events
                const today = new Date();
                today.setHours(0,0,0,0);

                const registeredEvents = events.filter(e => registeredIds.includes(e.id))
                    .map(e => {
                        const eventDate = new Date(e.eventDate);
                        eventDate.setHours(0,0,0,0);
                        const timeDiff = eventDate.getTime() - today.getTime();
                        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
                        return { ...e, daysLeft, eventDateObj: eventDate };
                    })
                    .filter(e => e.daysLeft >= 0) // upcoming or today
                    .sort((a, b) => a.daysLeft - b.daysLeft); // soonest first

                // 4. Update Badge
                const readIds = JSON.parse(localStorage.getItem(`read_notifs_${userId}`) || '[]');
                const unreadEvents = registeredEvents.filter(e => !readIds.includes(e.id));
                
                if (unreadEvents.length > 0) {
                    notifBadge.textContent = unreadEvents.length;
                    notifBadge.style.display = 'flex';
                } else {
                    notifBadge.style.display = 'none';
                }

                // 5. Render Notifications
                notifList.innerHTML = '';
                if (registeredEvents.length === 0) {
                    notifList.innerHTML = '<div class="notification-empty">No upcoming event reminders.</div>';
                    return;
                }

                registeredEvents.forEach(e => {
                    const isRead = readIds.includes(e.id);
                    const isToday = e.daysLeft === 0;
                    
                    const item = document.createElement('div');
                    item.className = 'notification-item';
                    
                    let statusClass = isRead ? 'read' : '';
                    if (isToday) statusClass += ' today';
                    
                    let timeText = '';
                    if (e.daysLeft === 0) {
                        timeText = 'Happening Today!';
                    } else if (e.daysLeft === 1) {
                        timeText = 'Tomorrow';
                    } else {
                        timeText = `In ${e.daysLeft} days`;
                    }

                    item.innerHTML = `
                        <div class="notification-status-dot ${statusClass}"></div>
                        <div class="notification-info">
                            <div class="notification-title">Reminder: <strong>${escapeHtml(e.name)}</strong></div>
                            <div class="notification-desc">Venue: ${escapeHtml(e.venue || 'Online')} at ${escapeHtml(e.eventTime || '10:00 AM')}</div>
                            <div class="notification-time">${timeText}</div>
                        </div>
                    `;

                    // Click notification to switch tab to register and view details
                    item.addEventListener('click', () => {
                        notifDropdown.classList.remove('active');
                        // Navigate to register view
                        if (typeof window.switchDashboardTab === 'function') {
                            window.switchDashboardTab('register');
                        }
                    });

                    notifList.appendChild(item);
                });

            } catch (err) {
                console.error("Error updating notification center:", err);
                notifList.innerHTML = '<div class="notification-empty">Error loading reminders.</div>';
            }
        }

        function markAllNotificationsAsRead() {
            if (!userId) return;
            
            // Get current unread registered events and save their IDs as read
            fetch(`${API_BASE}/registrations/${userId}`)
                .then(res => res.json())
                .then(registeredIds => {
                    localStorage.setItem(`read_notifs_${userId}`, JSON.stringify(registeredIds));
                    notifBadge.style.display = 'none';
                    
                    // Toggle dot styles immediately
                    const dots = notifList.querySelectorAll('.notification-status-dot');
                    dots.forEach(dot => {
                        dot.className = dot.className.replace('today', '').trim();
                        dot.classList.add('read');
                    });
                })
                .catch(err => console.error("Failed to mark notifications read:", err));
        }
    }
});

function showEventDetailsModal(eventItem, triggerButton) {
    if (activeRegistrationModal) {
        activeRegistrationModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'ticket-modal-overlay';
    modal.innerHTML = `
        <div class="ticket-modal-card" role="dialog" aria-modal="true" aria-label="Event details for ${escapeHtml(eventItem.name)}">
            <button type="button" class="ticket-modal-close" id="ticket-modal-close">×</button>
            <div class="ticket-modal-header">
                <h3>${escapeHtml(eventItem.name)}</h3>
                <p>${escapeHtml(eventItem.description || 'Explore the full event information below before you register.')}</p>
            </div>
            <div class="ticket-modal-body">
                <div class="event-details-grid">
                    <div><strong>Date</strong><span>${escapeHtml(eventItem.eventDate || 'TBA')}</span></div>
                    <div><strong>Time</strong><span>${escapeHtml(eventItem.eventTime || '10:00 AM')}</span></div>
                    <div><strong>Venue</strong><span>${escapeHtml(eventItem.venue || 'Online')}</span></div>
                    <div><strong>Organizer</strong><span>${escapeHtml(eventItem.organizer || 'Organizer pending')}</span></div>
                    <div><strong>Audience</strong><span>${escapeHtml(eventItem.targetAudience || 'All')}</span></div>
                    <div><strong>Duration</strong><span>${escapeHtml(eventItem.duration || '1 Day')}</span></div>
                    <div><strong>Seats Left</strong><span>${escapeHtml(String(eventItem.availableSeats ?? 0))}</span></div>
                    <div><strong>Fee</strong><span>${escapeHtml(Number(eventItem.registrationFee) === 0 ? 'Free' : `INR ${eventItem.registrationFee}`)}</span></div>
                    <div><strong>Rating</strong><span>${escapeHtml(eventItem.rating || 'Top rated')}</span></div>
                </div>
                <div class="ticket-modal-actions">
                    <button type="button" class="ticket-modal-cancel" id="ticket-modal-cancel">Close</button>
                    <button type="button" class="ticket-modal-submit" id="ticket-modal-register">Register</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    activeRegistrationModal = modal;

    const closeBtn = modal.querySelector('#ticket-modal-close');
    const cancelBtn = modal.querySelector('#ticket-modal-cancel');
    const registerBtn = modal.querySelector('#ticket-modal-register');

    const closeModal = () => {
        modal.remove();
        activeRegistrationModal = null;
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    registerBtn.addEventListener('click', () => {
        closeModal();
        showRegistrationModal(eventItem, triggerButton);
    });
}

function showRegistrationModal(eventItem, triggerButton) {
    if (activeRegistrationModal) {
        activeRegistrationModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'ticket-modal-overlay';
    modal.innerHTML = `
        <div class="ticket-modal-card" role="dialog" aria-modal="true" aria-label="Register for ${escapeHtml(eventItem.name)}">
            <button type="button" class="ticket-modal-close" id="ticket-modal-close">×</button>
            <div class="ticket-modal-header">
                <h3>Register for ${escapeHtml(eventItem.name)}</h3>
                <p>${escapeHtml(eventItem.description || 'Secure your place and receive a beautiful ticket image.')}</p>
            </div>
            <div class="ticket-modal-body">
                <div class="ticket-modal-summary">
                    <span><strong>Date:</strong> ${escapeHtml(eventItem.eventDate || 'TBA')}</span>
                    <span><strong>Time:</strong> ${escapeHtml(eventItem.eventTime || '10:00 AM')}</span>
                    <span><strong>Venue:</strong> ${escapeHtml(eventItem.venue || 'Online')}</span>
                    <span><strong>Tickets Left:</strong> ${escapeHtml(String(eventItem.availableSeats ?? 0))}</span>
                </div>
                <form id="registration-ticket-form" class="ticket-modal-form">
                    <label>
                        Full Name
                        <input type="text" id="ticket-attendee-name" required placeholder="Enter your full name">
                    </label>
                    <label>
                        Number of Tickets
                        <input type="number" id="ticket-count" required min="1" max="${Math.max(1, eventItem.availableSeats ?? 1)}" value="1">
                    </label>
                    <label>
                        Payment Mode
                        <select id="ticket-payment-mode">
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                    </label>
                    <label id="ticket-reference-label">
                        Reference ID
                        <input type="text" id="ticket-reference-id" placeholder="Enter payment/reference ID">
                    </label>
                    <div class="ticket-modal-actions">
                        <button type="button" class="ticket-modal-cancel" id="ticket-modal-cancel">Cancel</button>
                        <button type="submit" class="ticket-modal-submit" id="ticket-modal-submit">Generate Ticket</button>
                    </div>
                </form>
                <div class="ticket-modal-status" id="ticket-modal-status"></div>
                <div class="ticket-modal-preview" id="ticket-modal-preview"></div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    activeRegistrationModal = modal;

    const closeBtn = modal.querySelector('#ticket-modal-close');
    const cancelBtn = modal.querySelector('#ticket-modal-cancel');
    const form = modal.querySelector('#registration-ticket-form');
    const status = modal.querySelector('#ticket-modal-status');
    const preview = modal.querySelector('#ticket-modal-preview');
    const paymentModeSelect = modal.querySelector('#ticket-payment-mode');
    const referenceInput = modal.querySelector('#ticket-reference-id');
    const referenceLabel = modal.querySelector('#ticket-reference-label');

    const updateReferenceVisibility = () => {
        const requiresReference = ['Card', 'Bank Transfer'].includes(paymentModeSelect.value);
        referenceInput.required = requiresReference;
        referenceInput.placeholder = requiresReference ? 'Enter payment/reference ID *' : 'Enter reference ID (optional)';
    };

    paymentModeSelect.addEventListener('change', updateReferenceVisibility);
    updateReferenceVisibility();

    const closeModal = () => {
        modal.remove();
        activeRegistrationModal = null;
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = modal.querySelector('#ticket-modal-submit');
        const attendeeName = modal.querySelector('#ticket-attendee-name').value.trim();
        const ticketCount = Number(modal.querySelector('#ticket-count').value);
        const paymentMode = modal.querySelector('#ticket-payment-mode').value;
        const referenceId = modal.querySelector('#ticket-reference-id').value.trim();

        if (!attendeeName) {
            status.textContent = 'Please enter your full name.';
            status.className = 'ticket-modal-status error';
            return;
        }

        if (['Card', 'Bank Transfer'].includes(paymentMode) && !referenceId) {
            status.textContent = 'Please enter a reference ID for the selected payment method.';
            status.className = 'ticket-modal-status error';
            return;
        }

        if (ticketCount > (eventItem.availableSeats ?? 0)) {
            status.textContent = 'The number of tickets exceeds the seats left.';
            status.className = 'ticket-modal-status error';
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Creating Ticket...';
        status.className = 'ticket-modal-status';
        status.textContent = 'Registering your booking...';

        try {
            const registerResponse = await fetch(`${API_BASE}/register-id/${eventItem.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': String(currentUserId || 0)
                },
                body: JSON.stringify({ ticketCount })
            });
            const result = await registerResponse.json();

            if (!registerResponse.ok) {
                throw new Error(result.message || 'Registration failed.');
            }

            const registrationId = extractRegistrationId(result.message || '');
            const ticketDataUrl = await createTicketImage({
                eventName: eventItem.name,
                attendeeName,
                ticketCount,
                paymentMode,
                referenceId,
                registrationId,
                eventDate: eventItem.eventDate || 'TBA',
                eventTime: eventItem.eventTime || '10:00 AM',
                venue: eventItem.venue || 'Online',
                organizer: eventItem.organizer || 'Organizer pending'
            });

            preview.innerHTML = `<img src="${ticketDataUrl}" alt="Event ticket preview" class="ticket-preview-image">`;
            const downloadLink = document.createElement('a');
            downloadLink.href = ticketDataUrl;
            downloadLink.download = `${eventItem.name.replace(/\s+/g, '_')}_ticket.png`;
            downloadLink.click();

            eventItem.availableSeats = Math.max(0, (eventItem.availableSeats ?? 0) - ticketCount);
            status.className = 'ticket-modal-status success';
            status.textContent = 'Registration Successful! Ticket generated and downloaded.';
            triggerButton.disabled = true;
            triggerButton.textContent = 'Booked';
            if (typeof window.loadEventsGrid === 'function') {
                await window.loadEventsGrid();
            }
            if (typeof window.updateNotificationCenter === 'function') {
                await window.updateNotificationCenter();
            }
            setTimeout(closeModal, 1200);
        } catch (error) {
            console.error('Registration error:', error);
            status.className = 'ticket-modal-status error';
            status.textContent = error.message || 'Failed to create your ticket. Please try again.';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Generate Ticket';
        }
    });
}

function extractRegistrationId(message) {
    const match = message.match(/EVT-[0-9A-Z-]+/i);
    return match ? match[0] : `EVT-2026-${Math.floor(10000 + Math.random() * 90000)}`;
}

function createTicketImage({ eventName, attendeeName, ticketCount, paymentMode, referenceId, registrationId, eventDate, eventTime, venue, organizer }) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 620;
        const ctx = canvas.getContext('2d');

        const background = ctx.createLinearGradient(0, 0, 1000, 620);
        background.addColorStop(0, '#f7faff');
        background.addColorStop(1, '#e6ecff');
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, 1000, 620);

        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 16;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, 42, 42, 916, 536, 28);
        ctx.fill();
        ctx.restore();

        const header = ctx.createLinearGradient(42, 42, 958, 160);
        header.addColorStop(0, '#4f46e5');
        header.addColorStop(1, '#7c3aed');
        ctx.fillStyle = header;
        roundRect(ctx, 42, 42, 916, 160, 28);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Segoe UI';
        ctx.fillText('EVENT TICKET', 78, 105);
        ctx.font = 'bold 24px Segoe UI';
        ctx.fillText('AI Event Agent', 78, 142);

        ctx.fillStyle = '#f8fafc';
        roundRect(ctx, 72, 222, 856, 266, 24);
        ctx.fill();

        ctx.fillStyle = '#111827';
        ctx.font = 'bold 30px Segoe UI';
        const title = eventName.length > 50 ? `${eventName.slice(0, 47)}...` : eventName;
        ctx.fillText(title, 100, 275);

        ctx.font = '19px Segoe UI';
        ctx.fillStyle = '#475569';
        
        // Left Column (Booking info)
        const leftLines = [
            `Attendee: ${attendeeName}`,
            `Tickets: ${ticketCount} seat(s)`,
            `Payment: ${paymentMode}`,
            `Ref ID: ${referenceId || 'N/A'}`,
            `Reg ID: ${registrationId}`
        ];
        
        // Right Column (Event logistics)
        const rightLines = [
            `Date: ${eventDate}`,
            `Time: ${eventTime}`,
            `Venue: ${venue}`,
            `Organizer: ${organizer}`
        ];

        leftLines.forEach((line, index) => {
            ctx.fillText(line, 100, 320 + index * 34);
        });

        rightLines.forEach((line, index) => {
            ctx.fillText(line, 520, 320 + index * 34);
        });

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(100, 512);
        ctx.lineTo(900, 512);
        ctx.stroke();

        ctx.fillStyle = '#4f46e5';
        ctx.font = 'bold 21px Segoe UI';
        ctx.fillText('Thank you for joining the event!', 100, 554);

        ctx.fillStyle = '#6366f1';
        ctx.font = '17px Segoe UI';
        ctx.fillText('Generated by AI Event Agent', 694, 554);

        resolve(canvas.toDataURL('image/png'));
    });
}

function roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
}

function appendMessage(sender, content, className) {
    const chatContainer = document.getElementById('chat-container');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${className}`;

    const senderDiv = document.createElement('div');
    senderDiv.className = 'bubble-sender';
    senderDiv.textContent = sender;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'bubble-content';
    contentDiv.innerHTML = className === 'ai' ? formatMarkdown(content) : escapeHtml(content);

    bubble.appendChild(senderDiv);
    bubble.appendChild(contentDiv);
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendLoaderBubble() {
    const chatContainer = document.getElementById('chat-container');
    const id = `loader-${Date.now()}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ai';
    bubble.id = id;

    const senderDiv = document.createElement('div');
    senderDiv.className = 'bubble-sender';
    senderDiv.textContent = 'AI Assistant';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'bubble-content';
    contentDiv.innerHTML = '<span style="color: var(--text-secondary); font-style: italic;">AI is thinking...</span>';

    bubble.appendChild(senderDiv);
    bubble.appendChild(contentDiv);
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return id;
}

function removeLoaderBubble(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

function appendDownloadButtons(container, data) {
    if (!data.type) {
        return;
    }

    const upperType = data.type.toUpperCase();
    if (upperType !== 'QUOTATION' && upperType !== 'CHECKLIST' && upperType !== 'TICKET' && upperType !== 'FORM') {
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'quotation-download-wrapper';

    const button = document.createElement('button');
    button.className = 'download-quotation-btn';
    button.textContent = upperType === 'QUOTATION'
        ? 'Download Quotation'
        : upperType === 'CHECKLIST'
            ? 'Download Checklist'
            : upperType === 'TICKET'
                ? 'Download Ticket'
                : 'Download Organizer Form';
    button.title = upperType === 'QUOTATION'
        ? 'Download this quotation as a markdown file'
        : upperType === 'CHECKLIST'
            ? 'Download this checklist as a markdown file'
            : upperType === 'TICKET'
                ? 'Download this registration ticket as a markdown file'
                : 'Download this organizer form as a markdown file';

    button.addEventListener('click', () => {
        const payload = data.response || '';
        const blob = new Blob([payload], { type: 'text/markdown;charset=utf-8' });
        const fallbackName = upperType === 'QUOTATION' ? 'quotation' : upperType === 'CHECKLIST' ? 'checklist' : upperType === 'TICKET' ? 'ticket' : 'organizer_form';
        const fileName = `${(data.title || fallbackName).replace(/\s+/g, '_')}.md`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    });

    wrapper.appendChild(button);
    container.appendChild(wrapper);
}

function buildRegistrationTicketContent(eventName, message) {
    return `# 🎫 Registration Ticket\n\n**Event**: ${eventName}\n**Status**: Confirmed\n\n${message}`;
}

function buildOrganizerFormContent(eventData) {
    return `# 📝 Event Organizer Form\n\n**Event Name**: ${eventData.name}\n**Category**: ${eventData.category}\n**Organizer**: ${eventData.organizer}\n**Date**: ${eventData.eventDate}\n**Time**: ${eventData.eventTime}\n**Venue**: ${eventData.venue}\n**Duration**: ${eventData.duration}\n**Fee**: ${eventData.registrationFee}\n**Seats**: ${eventData.availableSeats}\n**Audience**: ${eventData.targetAudience}\n`;
}

function downloadTextFile(content, fileName) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

function formatMarkdown(text) {
    if (!text) {
        return '';
    }

    let html = escapeHtml(text);

    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^\s*-\s*\[\s*\]\s*(.*$)/gim, '<li><input type="checkbox"> $1</li>');
    html = html.replace(/^\s*-\s*\[x\]\s*(.*$)/gim, '<li><input type="checkbox" checked> $1</li>');
    html = html.replace(/^\s*-\s*(?!\s*<input)(.*$)/gim, '<li>$1</li>');

    const lines = html.split('\n');
    let inTable = false;
    let tableLines = [];

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index].trim();
        if (line.startsWith('|') && line.endsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableLines = [];
            }
            tableLines.push(line);
        } else if (inTable) {
            const tableHtml = buildHtmlTable(tableLines);
            const startIndex = index - tableLines.length;
            lines.splice(startIndex, tableLines.length, tableHtml);
            index = startIndex;
            inTable = false;
        }
    }

    if (inTable) {
        const tableHtml = buildHtmlTable(tableLines);
        lines.splice(lines.length - tableLines.length, tableLines.length, tableHtml);
    }

    html = lines.join('\n');
    html = html.replace(/\n\n/g, '<br><br>');

    return html;
}

function buildHtmlTable(lines) {
    let html = '<table>';
    const cleanLines = lines.filter((line) => !line.match(/^[|\s:-]+$/));

    cleanLines.forEach((line, index) => {
        const cells = line
            .split('|')
            .map((cell) => cell.trim())
            .filter((cell, cellIndex, arr) => cellIndex > 0 && cellIndex < arr.length - 1);

        if (index === 0) {
            html += '<thead><tr>';
            cells.forEach((cell) => {
                html += `<th>${cell}</th>`;
            });
            html += '</tr></thead><tbody>';
        } else {
            html += '<tr>';
            cells.forEach((cell) => {
                html += `<td>${cell}</td>`;
            });
            html += '</tr>';
        }
    });

    html += '</tbody></table>';
    return html;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
