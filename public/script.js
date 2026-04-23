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
});
