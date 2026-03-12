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
    const addMatchForm = document.getElementById('addMatchForm');
    
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
    const STORAGE_KEY = 'opr_matches';
    let matches = [];

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
    
    const loadMatches = () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                matches = JSON.parse(saved);
                // Sort chronologically (newest first)
                matches.sort((a, b) => new Date(b.date) - new Date(a.date));
            } catch (e) {
                console.error("Failed to parse matches from local storage");
                matches = [];
            }
        }
        renderJournal();
    };

    const saveMatches = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
        renderJournal();
    };

    const renderJournal = () => {
        // Clear current feed except empty state
        const entries = journalFeed.querySelectorAll('.journal-entry');
        entries.forEach(e => e.remove());

        if (matches.length === 0) {
            emptyState.style.display = 'block';
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
    
    const openModal = () => {
        addMatchModal.classList.add('active');
        // Set today as default date
        document.getElementById('matchDate').valueAsDate = new Date();
    };
    
    const closeModal = () => {
        addMatchModal.classList.remove('active');
        addMatchForm.reset();
    };

    addMatchBtn.addEventListener('click', openModal);
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

    // --- Form Submission ---
    
    addMatchForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newMatch = {
            id: Date.now().toString(),
            date: document.getElementById('matchDate').value,
            location: document.getElementById('matchLocation').value,
            opponent: document.getElementById('opponentName').value,
            myFaction: document.getElementById('myFaction').value,
            opponentFaction: document.getElementById('oppFaction').value,
            winner: document.getElementById('matchWinner').value,
            notes: document.getElementById('matchNotes').value
        };

        matches.push(newMatch);
        saveMatches();
        closeModal();
        showToast("Match saved to Journal!");
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
        reader.onload = (event) => {
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
                if (confirm(`Found ${newMatches.length} matches. Replace current journal entirely? (Cancel to append instead)`)) {
                    matches = newMatches;
                } else {
                    matches = [...matches, ...newMatches];
                }
                saveMatches();
                showToast("CSV Imported Successfully!");
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    });

    // --- Init ---
    loadMatches();

});
