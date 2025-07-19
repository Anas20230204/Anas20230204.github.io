document.addEventListener('DOMContentLoaded', function() {


    const dreamForm = document.getElementById('dream-form');
    if (dreamForm) {
        dreamForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const dreamInput = document.getElementById('dream-input');
            const dream = dreamInput.value;
            const languageSelect = document.getElementById('language-select');
            const language = languageSelect.value;
            const tagsInput = document.getElementById('tags-input');
            const tags = tagsInput.value;
            const moodSelect = document.getElementById('mood-select');
            const mood = moodSelect.value;
            const interpretationDiv = document.getElementById('interpretation');
            
            interpretationDiv.innerHTML = 'Interpreting...';

            const response = await fetch('/interpret', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `dream=${encodeURIComponent(dream)}&language=${encodeURIComponent(language)}&tags=${encodeURIComponent(tags)}&mood=${encodeURIComponent(mood)}`
            });

            const data = await response.json();

            if (data.error) {
                interpretationDiv.innerHTML = `<p style="color: red;">${data.error}</p>`;
            } else {
                interpretationDiv.innerHTML = `<p>${data.interpretation}</p>`;
                dreamInput.value = '';
                updateHistory(data.history);
            }
        });
    }

    if (window.location.pathname === '/dashboard') {
        loadInitialHistory();
    }

    const historyDiv = document.getElementById('history');
    if (historyDiv) {
        historyDiv.addEventListener('click', async function(e) {
            const shareButton = e.target.closest('.share-btn');
            const deleteButton = e.target.closest('.delete-btn');

            if (shareButton) {
                const dreamText = shareButton.dataset.dreamText;
                const interpretation = shareButton.dataset.interpretation;
                const text = `I had a dream: "${dreamText}" and the interpretation was: "${interpretation}"`;

                if (shareButton.classList.contains('twitter')) {
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                    window.open(twitterUrl, '_blank');
                } else if (shareButton.classList.contains('facebook')) {
                    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`;
                    window.open(facebookUrl, '_blank');
                }
            } else if (deleteButton) {
                const dreamId = deleteButton.dataset.dreamId;
                if (confirm('Are you sure you want to delete this dream?')) {
                    const response = await fetch(`/delete_dream/${dreamId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    const data = await response.json();

                    if (data.result === 'success') {
                        const dreamElement = document.getElementById(`dream-${dreamId}`);
                        if (dreamElement) {
                            dreamElement.remove();
                        }
                    } else {
                        alert('Failed to delete dream: ' + (data.error || 'Unknown error'));
                    }
                }
            }
        });
    }
});

function updateHistory(history) {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = '';
    history.slice().reverse().forEach(item => {
        const entry = document.createElement('div');
        entry.classList.add('history-item');
        entry.id = `dream-${item.id}`;
        entry.innerHTML = `<p><strong>Dream:</strong> ${item.dream_text}</p><p><strong>Interpretation:</strong> ${item.interpretation}</p><p><strong>Tags:</strong> ${item.tags.map(tag => `<span class="tag">${tag.name}</span>`).join(' ')}</p><p><strong>Mood:</strong> ${item.mood ? item.mood.name : ''}</p><button class="delete-btn" data-dream-id="${item.id}">Delete</button><a href="#" class="share-btn twitter" data-dream-text="${item.dream_text}" data-interpretation="${item.interpretation}"><i class="fab fa-twitter"></i></a><a href="#" class="share-btn facebook" data-dream-text="${item.dream_text}" data-interpretation="${item.interpretation}"><img src="/static/uploads/facebook.svg" alt="Share on Facebook" style="width: 24px; height: 24px;"></a>`;
        historyDiv.appendChild(entry);
    });
}

async function loadInitialHistory() {
    try {
        const response = await fetch('/api/history');
        if (!response.ok) {
            throw new Error('Failed to load history');
        }
        const history = await response.json();
        updateHistory(history);
    } catch (error) {
        console.error('Error loading history:', error);
    }
}