const BACKEND_URL = "https://ripeness-uncoated-primarily.ngrok-free.dev/api/upload.php";

let currentTab = 'dedica';
let selectedCategory = 'prima_del_matrimonio'; 
let currentGalleryMedia = []; 
let activeGalleryFilter = 'all';

// Mappa delle categorie
const categoryLabels = {
    'prima_del_matrimonio': '💍 Përpara dasmës',
    'attesa_sposi': '⏳ Pritja e dasmorëve',
    'sposi': '👩‍❤️‍👨 Çifti',
    'foto_invitati': '🥳 Foto me të ftuarit',
    'taglio_torta': '🎂 Prerja e tortës',
    'musica': '🎵 Atmosfera',
    'cazzate': '🤪 Të qeshura / Momente qesharake'
};

function enterSite() {
    const overlay = document.getElementById('welcome-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 600);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generateStars();

    const categoryCards = document.querySelectorAll('#section-media .category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            categoryCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedCategory = card.getAttribute('data-value');
        });
    });
});

function generateStars() {
    const container = document.getElementById('starsContainer');
    if (!container) return;
    const starCount = 30;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        const duration = 2 + Math.random() * 3;
        const delay = Math.random() * 5;
        star.style.animationDuration = `${duration}s`;
        star.style.animationDelay = `${delay}s`;

        container.appendChild(star);
    }
}

function switchTab(tab) {
    currentTab = tab;
    const tabs = document.querySelectorAll('.tabs .tab-btn');
    const btnDedica = tabs[0];
    const btnMedia = tabs[1];
    const btnGallery = tabs[2];

    const secDedica = document.getElementById('section-dedica');
    const secMedia = document.getElementById('section-media');
    const secGallery = document.getElementById('section-gallery');
    const authorGroup = document.getElementById('author-name-group');

    btnDedica.classList.remove('active');
    btnMedia.classList.remove('active');
    btnGallery.classList.remove('active');

    secDedica.style.display = 'none';
    secMedia.style.display = 'none';
    secGallery.style.display = 'none';

    if (tab === 'dedica') {
        btnDedica.classList.add('active');
        secDedica.style.display = 'block';
        if (authorGroup) authorGroup.style.display = 'block';
    } else if (tab === 'media') {
        btnMedia.classList.add('active');
        secMedia.style.display = 'block';
        if (authorGroup) authorGroup.style.display = 'block';
    } else if (tab === 'gallery') {
        btnGallery.classList.add('active');
        secGallery.style.display = 'block';
        if (authorGroup) authorGroup.style.display = 'none';
    }
}

async function sendData() {
    const authorName = document.getElementById('author_name').value.trim();
    const statusMsg = document.getElementById('statusMessage');

    if (!authorName) {
        alert("Shkruaj emrin para se të dergosh");
        return;
    }

    const formData = new FormData();
    formData.append('author_name', authorName);
    formData.append('main_type', currentTab);

    if (currentTab === 'dedica') {
        const message = document.getElementById('message').value.trim();
        if (!message) {
            alert("Shkruaj nje urim per ciftin!");
            return;
        }
        formData.append('message', message);
    } else {
        const fileInput = document.getElementById('media_file');

        if (fileInput.files.length === 0) {
            alert("Zgjidh një Foto ose Video!");
            return;
        }

        let file = fileInput.files[0];

        if (file.name.toLowerCase().endsWith('.heic')) {
            statusMsg.style.color = 'orange';
            statusMsg.innerText = "Po kryhet konvertimi i fotos së iPhone...";
            try {
                const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg" });
                file = new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
            } catch (e) {
                console.error("Gabim konvertimi HEIC:", e);
            }
        }

        formData.append('file', file);
        formData.append('category', selectedCategory);
    }

    statusMsg.style.color = 'blue';
    statusMsg.innerText = "Duke u dërguar...";

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 
                'ngrok-skip-browser-warning': 'true' // Aggiornato per evitare il blocco di Ngrok in modo pulito
            },
            body: formData
        });

        const result = await response.json();

        if (result.status === 'success') {
            statusMsg.style.color = 'green';
            statusMsg.innerText = result.message;
            if (currentTab === 'dedica') {
                document.getElementById('message').value = '';
            } else {
                document.getElementById('media_file').value = '';
            }
        } else {
            statusMsg.style.color = 'red';
            statusMsg.innerText = "Gabim: " + result.message;
        }
    } catch (error) {
        console.error(error);
        statusMsg.style.color = 'red';
        statusMsg.innerText = "Gabim lidhjeje me serverin.";
    }
}

// Sblocco della Galleria
async function unlockGallery() {
    const code = document.getElementById('access_code').value.trim().toUpperCase();
    const statusMsg = document.getElementById('galleryAuthStatus');
    
    if (!code) {
        statusMsg.innerText = "Ju lutem vendosni kodin!";
        return;
    }

    statusMsg.style.color = 'blue';
    statusMsg.innerText = "Verifikimi...";

    try {
        const response = await fetch(`${BACKEND_URL}?code=${encodeURIComponent(code)}`, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const result = await response.json();

        if (result.status === 'success') {
            statusMsg.innerText = "";
            document.getElementById('gallery-auth-box').style.display = 'none';
            document.getElementById('gallery-content').style.display = 'block';

            if (result.role === 'guest') {
                document.getElementById('spouse-subtabs').style.display = 'none';
                currentGalleryMedia = result.data || [];
            } else if (result.role === 'spouse') {
                document.getElementById('spouse-subtabs').style.display = 'flex';
                currentGalleryMedia = result.media || [];
                renderNotesList(result.notes);
            }

            renderMediaGrid(currentGalleryMedia);

        } else {
            statusMsg.style.color = 'red';
            statusMsg.innerText = result.message;
        }
    } catch (e) {
        console.error(e);
        statusMsg.style.color = 'red';
        statusMsg.innerText = "Gabim lidhjeje me serverin.";
    }
}

// --- APERTURA E CHIUSURA MODAL POPUP ---
function openFilterModal() {
    const modal = document.getElementById('filterModal');
    const grid = document.getElementById('modalCategoryGrid');

    grid.innerHTML = `
        <div class="category-card ${activeGalleryFilter === 'all' ? 'selected' : ''}" data-filter="all">🌟 Të gjitha (Tutte)</div>
        ${Object.keys(categoryLabels).map(catKey => `
            <div class="category-card ${activeGalleryFilter === catKey ? 'selected' : ''}" data-filter="${catKey}">${categoryLabels[catKey]}</div>
        `).join('')}
    `;

    const cards = grid.querySelectorAll('.category-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            activeGalleryFilter = card.getAttribute('data-filter');
            
            const labelSpan = document.getElementById('current-filter-label');
            labelSpan.innerText = activeGalleryFilter === 'all' ? '🌟 Të gjitha' : categoryLabels[activeGalleryFilter];

            if (activeGalleryFilter === 'all') {
                renderMediaGrid(currentGalleryMedia);
            } else {
                const filtered = currentGalleryMedia.filter(item => item.category === activeGalleryFilter);
                renderMediaGrid(filtered);
            }

            closeFilterModal();
        });
    });

    modal.classList.add('open');
}

function closeFilterModal() {
    const modal = document.getElementById('filterModal');
    modal.classList.remove('open');
}

// Render Foto/Video
function renderMediaGrid(items) {
    const container = document.getElementById('gallery-media-container');
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; color: #777; padding: 20px;">Nuk ka foto ose video për këtë kategori.</p>';
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'gallery-item';

        const isVideo = item.filepath.match(/\.(mp4|webm|ogg|mov)$/i);

        if (isVideo) {
            div.innerHTML = `
                <video src="${item.filepath}" controls></video>
                <div class="gallery-author">👤 ${item.author_name}</div>
            `;
        } else {
            div.innerHTML = `
                <a href="${item.filepath}" target="_blank">
                    <img src="${item.filepath}" alt="Foto" loading="lazy">
                </a>
                <div class="gallery-author">👤 ${item.author_name}</div>
            `;
        }
        container.appendChild(div);
    });
}

// Render Dediche (Sposi)
function renderNotesList(notes) {
    const container = document.getElementById('gallery-notes-container');
    container.innerHTML = '';

    if (!notes || notes.length === 0) {
        container.innerHTML = '<p style="color: #777;">Nuk ka ende dedikime.</p>';
        return;
    }

    notes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'dedica-card';
        card.innerHTML = `
            <div class="dedica-author">✍️ ${note.author_name}</div>
            <div class="dedica-text">${note.message}</div>
        `;
        container.appendChild(card);
    });
}

// Sotto-schede per gli Sposi
function switchSpouseSubtab(type) {
    const mediaBtn = document.getElementById('subtab-media-btn');
    const notesBtn = document.getElementById('subtab-notes-btn');
    const mediaContainer = document.getElementById('gallery-media-container');
    const headerBar = document.getElementById('gallery-header-bar');
    const notesContainer = document.getElementById('gallery-notes-container');

    if (type === 'media') {
        mediaBtn.classList.add('active');
        notesBtn.classList.remove('active');
        mediaContainer.style.display = 'grid';
        if (headerBar) headerBar.style.display = 'flex';
        notesContainer.style.display = 'none';
    } else {
        notesBtn.classList.add('active');
        mediaBtn.classList.remove('active');
        mediaContainer.style.display = 'none';
        if (headerBar) headerBar.style.display = 'none';
        notesContainer.style.display = 'block';
    }
}