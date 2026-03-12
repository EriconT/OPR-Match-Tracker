document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const csvFileInput = document.getElementById('csvFileInput');
    const addMatchBtn = document.getElementById('addMatchBtn');
    
    // Modal Elements
    const addMatchModal = document.getElementById('addMatchModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const deleteMatchBtn = document.getElementById('deleteMatchBtn');
    const addMatchForm = document.getElementById('addMatchForm');
    const modalTitle = document.querySelector('#addMatchModal .modal-header h2');
    
    // Content Elements
    const journalFeed = document.getElementById('journalFeed');
    const emptyState = document.getElementById('emptyState');
    
    // Stats Elements
    const totalGamesStat = document.getElementById('totalGamesStat');
    const gamesWonStat = document.getElementById('gamesWonStat');
    const locationsStat = document.getElementById('locationsStat');
    const opponentsStat = document.getElementById('opponentsStat');

    // Toast
    const toast = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');

    // --- State Management ---
    const API_URL = 'https://script.google.com/macros/s/AKfycbyNoh1WSrgfLZs9bwCOe4eWDVuc8MJS6j_91Ik_vAE_llY-NFUHeZLiAxudTOLePLJS/exec';
    let matches = [];
    let editingMatchId = null;

    // --- Theme Handling ---
    const currentTheme = localStorage.getItem('opr_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('opr_theme', next);
    });

    // --- Data Management & Rendering ---
    
    const loadMatches = async () => {
        // Show loading state in feed
        emptyState.style.display = 'block';
        emptyState.innerHTML = '<div class="empty-icon"><i class="fa-solid fa-spinner fa-spin"></i></div><h2>Loading Journals...</h2><p>Connecting to database.</p>';

        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Network response was not ok");
            
            const data = await response.json();
            matches = Array.isArray(data) ? data : [];
            
            // Sort chronologically (newest first)
            matches.sort((a, b) => new Date(b.date) - new Date(a.date));
            renderJournal();
        } catch (error) {
            console.error("Failed to load matches from API:", error);
            emptyState.innerHTML = '<div class="empty-icon" style="color:var(--brand-primary)"><i class="fa-solid fa-triangle-exclamation"></i></div><h2>Failed to load</h2><p>Could not connect to the database. Trying locally.</p>';
        }
    };

    // Replace the old saveMatches logic that wrote to local storage.
    // Syncing to the API now happens upon form submission directly via fetch.

    const renderJournal = () => {
        // Clear current feed except empty state
        const entries = journalFeed.querySelectorAll('.journal-entry');
        entries.forEach(e => e.remove());

        if (matches.length === 0) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div class="empty-icon">
                    <i class="fa-solid fa-ghost"></i>
                </div>
                <h2>No matches recorded yet</h2>
                <p>Start your journal by logging your first OnePageRules game!</p>
                <button class="btn-primary mt-3" onclick="document.getElementById('addMatchBtn').click()">
                    Log First Match
                </button>`;
            updateStats();
            return;
        }

        emptyState.style.display = 'none';

        matches.forEach((match, index) => {
            const entry = document.createElement('div');
            entry.className = 'journal-entry';
            // Stagger animation delay
            entry.style.animationDelay = `${index * 0.1}s`;

            // Format Date safely
            let displayDate = match.date;
            try {
                const d = new Date(match.date);
                displayDate = d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            } catch(e) {}

            let winnerHtmlMe = match.winner === 'me' ? ' <i class="fa-solid fa-crown" style="color: #fbbf24;" title="Winner"></i>' : '';
            let winnerHtmlOpp = match.winner === 'opponent' ? ' <i class="fa-solid fa-crown" style="color: #fbbf24;" title="Winner"></i>' : '';

            entry.innerHTML = `
                <div class="entry-timeline">
                    <div class="timeline-dot"></div>
                </div>
                <div class="entry-card">
                    <button class="icon-btn edit-entry-btn" aria-label="Edit Match" title="Edit Match">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <div class="entry-header">
                        <div class="entry-date"><i class="fa-regular fa-calendar-days"></i> ${displayDate}</div>
                        <div class="entry-location"><i class="fa-solid fa-location-arrow"></i> ${match.location}</div>
                    </div>
                    
                    <div class="entry-matchup">
                        <div class="faction-side">
                            <span class="player-name">Me${winnerHtmlMe}</span>
                            <span class="faction-name text-primary">${match.myFaction}</span>
                        </div>
                        <div class="vs-circle">VS</div>
                        <div class="faction-side">
                            <span class="player-name">${match.opponent}${winnerHtmlOpp}</span>
                            <span class="faction-name text-secondary">${match.opponentFaction}</span>
                        </div>
                    </div>
                    
                    ${match.notes ? `<div class="entry-notes">${match.notes.replace(/\n/g, '<br>')}</div>` : ''}
                </div>
            `;
            
            const editBtn = entry.querySelector('.edit-entry-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    openModal(match);
                });
            }

            journalFeed.appendChild(entry);
        });

        updateStats();
    };

    const updateStats = () => {
        totalGamesStat.textContent = matches.length;
        
        // Count games won
        const gamesWon = matches.filter(m => m.winner === 'me').length;
        if (gamesWonStat) gamesWonStat.textContent = gamesWon;
        
        // Count unique locations
        const uniqueLocations = new Set(matches.map(m => m.location.trim().toLowerCase())).size;
        locationsStat.textContent = uniqueLocations;

        // Count unique opponents
        const uniqueOpponents = new Set(matches.map(m => m.opponent.trim().toLowerCase())).size;
        opponentsStat.textContent = uniqueOpponents;
    };

    // --- Modal Handling ---
    
    const openModal = (matchToEdit = null) => {
        addMatchModal.classList.add('active');
        if (matchToEdit && matchToEdit.id) {
            editingMatchId = matchToEdit.id;
            modalTitle.textContent = "Edit Match";
            document.getElementById('matchDate').value = matchToEdit.date || '';
            document.getElementById('matchLocation').value = matchToEdit.location || '';
            document.getElementById('opponentName').value = matchToEdit.opponent || '';
            document.getElementById('myFaction').value = matchToEdit.myFaction || '';
            document.getElementById('oppFaction').value = matchToEdit.opponentFaction || '';
            document.getElementById('matchWinner').value = matchToEdit.winner || '';
            document.getElementById('matchNotes').value = matchToEdit.notes || '';
            deleteMatchBtn.style.display = 'inline-flex';
        } else {
            editingMatchId = null;
            modalTitle.textContent = "Log a New Match";
            document.getElementById('matchDate').valueAsDate = new Date();
            deleteMatchBtn.style.display = 'none';
        }
    };
    
    const closeModal = () => {
        addMatchModal.classList.remove('active');
        addMatchForm.reset();
        editingMatchId = null;
    };

    addMatchBtn.addEventListener('click', () => openModal(null));
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    // Close on overlay click
    addMatchModal.addEventListener('click', (e) => {
        if (e.target === addMatchModal) {
            closeModal();
        }
    });

    const showToast = (message) => {
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    // Delete Match Logic
    deleteMatchBtn.addEventListener('click', async () => {
        if (!editingMatchId) return;
        
        if (confirm("Are you sure you want to delete this match? This action cannot be undone.")) {
            const submitBtn = addMatchForm.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';
            submitBtn.disabled = true;
            deleteMatchBtn.disabled = true;

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ action: 'delete', id: editingMatchId })
                });

                const result = await response.json();
                
                if (result.result === 'success') {
                    matches = matches.filter(m => m.id !== editingMatchId);
                    showToast("Match deleted safely!");
                    renderJournal();
                    closeModal();
                } else {
                    throw new Error("Failed to delete from database");
                }
            } catch (error) {
                console.error(error);
                showToast("Error deleting match. Try again.");
            } finally {
                submitBtn.innerHTML = originalBtnHtml;
                submitBtn.disabled = false;
                deleteMatchBtn.disabled = false;
            }
        }
    });

    // --- Form Submission ---
    
    addMatchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = addMatchForm.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        const matchData = {
            id: editingMatchId ? editingMatchId : Date.now().toString(),
            date: document.getElementById('matchDate').value,
            location: document.getElementById('matchLocation').value,
            opponent: document.getElementById('opponentName').value,
            myFaction: document.getElementById('myFaction').value,
            opponentFaction: document.getElementById('oppFaction').value,
            winner: document.getElementById('matchWinner').value,
            notes: document.getElementById('matchNotes').value
        };

        try {
            // Post data to API
            const response = await fetch(API_URL, {
                method: 'POST',
                // Avoid preflight CORS by sending plain text
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(matchData)
            });

            const result = await response.json();

            if (result.result === 'success') {
                if (editingMatchId) {
                    const index = matches.findIndex(m => m.id === editingMatchId);
                    if (index !== -1) {
                        matches[index] = { ...matches[index], ...matchData };
                        showToast("Match updated safely!");
                    }
                } else {
                    matches.push(matchData);
                    showToast("Match saved to Google Sheets!");
                }
                
                // Sort chronologically handles new pushes natively prior to rendering
                matches.sort((a, b) => new Date(b.date) - new Date(a.date));
                renderJournal();
                closeModal();
            } else {
                throw new Error("Failed to save to database");
            }
        } catch (error) {
            console.error(error);
            showToast("Error saving match. Try again.");
        } finally {
            submitBtn.innerHTML = originalBtnHtml;
            submitBtn.disabled = false;
        }
    });


    // --- CSV Import / Export feature ---

    const convertToCSV = (objArray) => {
        const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
        if (array.length === 0) return '';
        
        // Define headers matching our data structure
        const headers = ['date', 'location', 'opponent', 'myFaction', 'opponentFaction', 'winner', 'notes'];
        
        let str = headers.join(',') + '\r\n';

        for (let i = 0; i < array.length; i++) {
            let line = '';
            for (let index in headers) {
                if (line != '') line += ','

                // Add quotes around fields to handle commas in notes or locations
                let field = array[i][headers[index]] || '';
                // Escape inner double quotes
                field = field.replace(/"/g, '""');
                line += '"' + field + '"';
            }
            str += line + '\r\n';
        }
        return str;
    };

    exportBtn.addEventListener('click', () => {
        if (matches.length === 0) {
            alert("No matches to export!");
            return;
        }

        const csvData = convertToCSV(matches);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `opr_matches_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Import Trigger
    importBtn.addEventListener('click', () => {
        csvFileInput.click();
    });

    // Simple CSV Parser (handles basic quoted CSV strings)
    const parseCSV = (text) => {
        const result = [];
        let row = [];
        let inQuotes = false;
        let currentField = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (char === '"') {
                if (inQuotes && text[i+1] === '"') {
                    // Escaped quote
                    currentField += '"';
                    i++; 
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                row.push(currentField);
                currentField = '';
            } else if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && text[i+1] === '\n') {
                    i++; // skip \n
                }
                if (currentField || row.length > 0) {
                    row.push(currentField);
                    result.push(row);
                    row = [];
                    currentField = '';
                }
            } else {
                currentField += char;
            }
        }
        // Push last row if exists
        if (currentField || row.length > 0) {
            row.push(currentField);
            result.push(row);
        }
        return result;
    };


    csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const csvText = event.target.result;
            const parsedData = parseCSV(csvText);
            
            if (parsedData.length < 2) {
                alert("CSV appears empty or invalid.");
                return;
            }
            
            // Assume first row is headers
            const headers = parsedData[0].map(h => h.trim());
            const newMatches = [];

            for (let i = 1; i < parsedData.length; i++) {
                const row = parsedData[i];
                if (row.length === 1 && row[0] === "") continue; // skip empty line
                
                const matchObj = { id: Date.now().toString() + i };
                
                // Map columns based on our expected headers array from Export logic
                const expectedHeaders = ['date', 'location', 'opponent', 'myFaction', 'opponentFaction', 'winner', 'notes'];
                
                // Attempt to map by index if header matches
                expectedHeaders.forEach((expectedKey, idx) => {
                    // Try to find if the header existed in the CSV, otherwise fallback to column index
                    let colIdx = headers.indexOf(expectedKey);
                    if (colIdx === -1) colIdx = idx; // fallback
                    
                    matchObj[expectedKey] = (colIdx < row.length) ? row[colIdx] : '';
                });

                newMatches.push(matchObj);
            }

            if (newMatches.length > 0) {
                if (!confirm(`Found ${newMatches.length} matches. Would you like to sync these imports to your Google Sheets database? This may take a moment depending on the number of matches.`)) {
                    return;
                }

                showToast(`Syncing ${newMatches.length} matches to Database...`);
                let successCount = 0;

                // Sync sequentially to avoid hitting Apps Script rate limits too hard
                for (const newMatch of newMatches) {
                    try {
                        const response = await fetch(API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify(newMatch)
                        });
                        const result = await response.json();
                        if (result.result === 'success') {
                            successCount++;
                        }
                    } catch (error) {
                        console.error("Failed to sync match", newMatch, error);
                    }
                }

                showToast(`Import Complete: ${successCount} matches saved to Google Sheets.`);
                // Reload feed to ensure view matches database truth
                loadMatches();
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    });

    // --- Init ---
    loadMatches();

});
