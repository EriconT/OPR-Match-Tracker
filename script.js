// Dummy Data for the table
const initialMatches = [
    { id: 'M-1024', tournament: 'VEX Worlds 2026', alliance: 'Red', score: 215, opr: 85.5, status: 'Win' },
    { id: 'M-1023', tournament: 'State Championship', alliance: 'Blue', score: 180, opr: 72.0, status: 'Loss' },
    { id: 'M-1022', tournament: 'State Championship', alliance: 'Red', score: 195, opr: 88.2, status: 'Win' },
    { id: 'M-1021', tournament: 'Regional Qualifiers', alliance: 'Red', score: 165, opr: 65.4, status: 'Win' },
    { id: 'M-1020', tournament: 'Regional Qualifiers', alliance: 'Blue', score: 190, opr: 75.1, status: 'Win' }
];

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('matchesTableBody');
    const addMatchBtn = document.getElementById('addMatchBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const addMatchModal = document.getElementById('addMatchModal');
    const addMatchForm = document.getElementById('addMatchForm');

    // Function to render matches to the table
    const renderMatches = (matches) => {
        tableBody.innerHTML = ''; // Clear table
        matches.forEach(match => {
            const tr = document.createElement('tr');
            
            // Determine badge class
            const badgeClass = match.status === 'Win' ? 'badge-win' : 'badge-loss';
            
            // Alliance Color Style
            const allianceStyle = match.alliance === 'Red' ? 'color: #ef4444; font-weight: 600;' : 'color: #3b82f6; font-weight: 600;';

            tr.innerHTML = `
                <td><strong>${match.id}</strong></td>
                <td>${match.tournament}</td>
                <td style="${allianceStyle}">${match.alliance}</td>
                <td><i class="fa-solid fa-flag-checkered" style="color: var(--text-muted); margin-right: 6px;"></i> ${match.score}</td>
                <td><strong>${match.opr.toFixed(1)}</strong></td>
                <td><span class="badge-status ${badgeClass}">${match.status}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    };

    // Initial render
    renderMatches(initialMatches);

    // Modal Interactions
    const openModal = () => addMatchModal.classList.add('active');
    const closeModal = () => {
        addMatchModal.classList.remove('active');
        addMatchForm.reset();
    };

    addMatchBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    // Close modal on clicking outside
    addMatchModal.addEventListener('click', (e) => {
        if (e.target === addMatchModal) {
            closeModal();
        }
    });

    // Handle Form Submit
    addMatchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get values
        const tournament = document.getElementById('matchTournament').value;
        const alliance = document.getElementById('allianceColor').value;
        const score = parseInt(document.getElementById('matchScore').value);
        const opr = parseFloat(document.getElementById('oprContribution').value);
        
        // Mock Status Calculation for demo (Win if score > 180)
        const status = score > 180 ? 'Win' : 'Loss';

        const newMatch = {
            id: `M-${1024 + initialMatches.length}`,
            tournament,
            alliance,
            score,
            opr,
            status
        };

        // Add to array and re-render
        initialMatches.unshift(newMatch); // Add to top
        if(initialMatches.length > 8) initialMatches.pop(); // keep it small
        renderMatches(initialMatches);
        
        // Close modal
        closeModal();
    });
});
