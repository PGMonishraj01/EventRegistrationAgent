// history.js
const HISTORY_API_BASE = 'http://localhost:8081/api/history';

document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('history-list');
    const emptyState = document.getElementById('history-empty-state');

    // Retrieve current user metadata
    const userData = localStorage.getItem('user');
    if (!userData) return;
    const user = JSON.parse(userData);
    const userId = user.id;

    // Fetch and populate sidebar
    async function loadHistory() {
        try {
            const response = await fetch(`${HISTORY_API_BASE}/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to retrieve history logs.');
            }

            const data = await response.json();

            // Clear existing items but preserve empty state placeholder
            const cards = historyList.querySelectorAll('.history-card');
            cards.forEach(card => card.remove());

            if (data && data.length > 0) {
                emptyState.style.display = 'none';

                data.forEach(item => {
                    const card = createHistoryCard(item);
                    historyList.appendChild(card);
                });
            } else {
                emptyState.style.display = 'flex';
            }
        } catch (error) {
            console.error('History Fetch Error:', error);
            // Don't override HTML unless it fails completely, keep it friendly
        }
    }

    function createHistoryCard(item) {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.dataset.id = item.id;

        const header = document.createElement('div');
        header.className = 'history-card-header';

        const title = document.createElement('div');
        title.className = 'history-card-title';
        title.textContent = item.title || 'Untitled Session';

        const category = document.createElement('span');
        const typeStr = item.type || 'RECOMMENDATION';
        category.className = `history-card-category category-${typeStr.toLowerCase()}`;
        category.textContent = typeStr;

        header.appendChild(title);
        header.appendChild(category);

        const dateDiv = document.createElement('div');
        dateDiv.className = 'history-card-date';
        dateDiv.textContent = formatDate(item.createdAt);

        card.appendChild(header);
        card.appendChild(dateDiv);

        // Click event listener
        card.addEventListener('click', () => {
            // Remove active class from all cards
            const allCards = historyList.querySelectorAll('.history-card');
            allCards.forEach(c => c.classList.remove('active'));

            // Mark this card as active
            card.classList.add('active');

            // Load and display card details
            fetchCardDetails(item.id, item.title, typeStr);
        });

        return card;
    }

    async function fetchCardDetails(historyId, title, category) {
        try {
            const response = await fetch(`${HISTORY_API_BASE}/details/${historyId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch details');
            }
            const data = await response.json();

            // Render details using the globally exported function in chat.js
            if (typeof window.displayHistoricalChat === 'function') {
                window.displayHistoricalChat(title, data.content, category);
            }
        } catch (error) {
            console.error('Fetch Card Details Error:', error);
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            // Format options: "Jul 4, 2026, 10:15 PM"
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return dateStr;
        }
    }

    // Expose reload function globally so chat.js can trigger refreshes
    window.refreshHistorySidebar = loadHistory;

    // Run initial load
    loadHistory();
});
