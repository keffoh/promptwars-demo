document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tabs = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.tab-pane');
    
    const generalInfoText = document.getElementById('general-info-text');
    const timelinesList = document.getElementById('timelines-list');
    const registrationList = document.getElementById('registration-list');
    const methodsList = document.getElementById('methods-list');

    // Tab Navigation Logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active classes
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding pane
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            document.getElementById(target).classList.add('active');
        });
    });

    // Fetch and populate data
    fetch('/api/election-data')
        .then(response => response.json())
        .then(data => {
            // Populate General Info
            generalInfoText.textContent = data.generalInfo;

            // Populate Timelines
            data.timelines.forEach((item, index) => {
                const delay = index * 0.1;
                const timelineHtml = `
                    <div class="timeline-item" style="animation-delay: ${delay}s">
                        <span class="timeline-date">${item.date}</span>
                        <h3>${item.event}</h3>
                        <p>${item.description}</p>
                    </div>
                `;
                timelinesList.insertAdjacentHTML('beforeend', timelineHtml);
            });

            // Populate Registration Steps
            // Assuming data.registrationSteps are strings like "1. Check your eligibility..."
            // We'll strip the leading number since CSS handles it
            data.registrationSteps.forEach((step, index) => {
                const cleanText = step.replace(/^\d+\.\s*/, '');
                const li = document.createElement('li');
                li.textContent = cleanText;
                li.style.animationDelay = `${index * 0.1}s`;
                registrationList.appendChild(li);
            });

            // Populate Voting Methods
            const icons = ['🗳️', '🏢', '✉️']; // Mapping icons to methods manually for visual flair
            data.votingMethods.forEach((method, index) => {
                const icon = icons[index % icons.length];
                const methodHtml = `
                    <div class="method-card" style="animation-delay: ${index * 0.1}s">
                        <span class="method-icon">${icon}</span>
                        <h3>${method.method}</h3>
                        <p>${method.details}</p>
                    </div>
                `;
                methodsList.insertAdjacentHTML('beforeend', methodHtml);
            });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            generalInfoText.textContent = "Failed to load election data. Please try again later.";
        });

    // Chatbot Logic
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatWindow = document.getElementById('chat-window');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');

    // Toggle chat window
    chatToggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            chatInput.focus();
        }
    });

    closeChatBtn.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });

    // Handle sending message
    const sendMessage = async () => {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        // Add user message
        appendMessage('user', messageText);
        chatInput.value = '';

        // Add typing indicator
        const typingId = showTypingIndicator();

        try {
            // Send to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText })
            });

            const data = await response.json();
            
            // Remove typing indicator and add bot response
            removeMessage(typingId);
            if (data.reply) {
                appendMessage('bot', data.reply);
            } else {
                appendMessage('bot', 'Sorry, I encountered an error.');
            }
        } catch (error) {
            console.error('Chat error:', error);
            removeMessage(typingId);
            appendMessage('bot', 'Sorry, I am currently offline.');
        }
    };

    sendChatBtn.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Helpers
    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const indicatorHtml = `
            <div id="${id}" class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', indicatorHtml);
        scrollToBottom();
        return id;
    }

    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Voter Registration Form Logic
    const voterForm = document.getElementById('voter-form');
    const formMessage = document.getElementById('form-message');

    if (voterForm) {
        voterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = voterForm.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            const formData = {
                fullName: document.getElementById('fullName').value,
                dob: document.getElementById('dob').value,
                level: document.getElementById('level').value,
                email: document.getElementById('email').value,
                address: document.getElementById('address').value
            };

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                formMessage.textContent = result.message || 'Registration submitted successfully!';
                formMessage.className = 'form-message success';
                
                if (result.success) {
                    voterForm.reset();
                }
            } catch (error) {
                console.error('Form submission error:', error);
                formMessage.textContent = 'An error occurred. Please try again.';
                formMessage.className = 'form-message error';
            } finally {
                formMessage.classList.remove('hidden');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    formMessage.classList.add('hidden');
                }, 5000);
            }
        });
    }
});
