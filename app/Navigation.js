const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const FALLBACK_IMG = "https://placehold.co/200x300?text=No+Image";
let currentSearchResults = [];
let mySwiper;

const getApiKey = () => localStorage.getItem('tmdb_api_key') || '';

let initial_movies = [
    { tmdbId: 499772, title: "Superlópez", director: "Javier Ruiz Caldera", thumbnail: "https://image.tmdb.org/t/p/w500/8A2M1aC1R6iB3z4k2b9l5m8n7o.jpg" },
    { tmdbId: 329, title: "Jurassic Park", director: "Steven Spielberg", thumbnail: "https://image.tmdb.org/t/p/w500/oU7Oq2kFAAlGqbU4VoAE36g4hoI.jpg" },
    { tmdbId: 157336, title: "Interstellar", director: "Christopher Nolan", thumbnail: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" }
];

localStorage.my_movies = localStorage.my_movies || JSON.stringify(initial_movies);
localStorage.my_keywords = localStorage.my_keywords || JSON.stringify([]);

// --- ANIMATION ANIME.JS (ACTIVE SUR TOUTES LES SLIDES) ---
const playSlideAnimation = () => {
    if (typeof anime === 'undefined') return;

    // On récupère les éléments de la slide active (ou la première slide par défaut au démarrage)
    const activeSlide = document.querySelector('.swiper-slide-active') || document.querySelector('.swiper-slide');
    if (!activeSlide) return;

    const targets = activeSlide.querySelectorAll('.content-box > *');
    if (targets.length === 0) return;

    anime.remove(targets);
    anime({
        targets: targets,
        translateY: [25, 0],
        opacity: [0, 1],
        delay: anime.stagger(80),
        duration: 800,
        easing: 'easeOutExpo'
    });
};

// --- NETTOYAGE DES KEYWORDS ---
const cleanKeyword = (keyword) => {
    return keyword.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase();
};

const processKeywords = (rawKeywords) => {
    const processedList = [];
    if (!Array.isArray(rawKeywords)) return processedList;

    for (let i = 0; i < rawKeywords.length; i++) {
        const rawName = rawKeywords[i].name || "";
        const cleaned = cleanKeyword(rawName);
        if (cleaned.length > 0 && !processedList.includes(cleaned)) {
            processedList.push(cleaned);
        }
    }
    return processedList;
};

// --- AFFICHAGE DYNAMIQUE (VUES) ---

const renderMoviesView = (results, titleText = "Popular Movies") => {
    const container = document.getElementById('movies-content');
    if (!results || results.length === 0) {
        container.innerHTML = `<p class="alert">No movies to display.</p>`;
        return;
    }

    let html = `<h3 style="margin-bottom: 15px;">${titleText}</h3><div class="grid-container">`;
    results.forEach((movie) => {
        const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : FALLBACK_IMG;
        const director = movie.director || "Unknown Director";

        html += `
            <div class="movie-card">
                <img src="${posterUrl}" alt="${movie.title}" onerror="this.onerror=null; this.src='${FALLBACK_IMG}';">
                <div class="info">
                    <div class="title">${movie.title}</div>
                    <div class="director">Dir: ${director}</div>
                </div>
                <div class="card-actions">
                    <button class="add-from-api" data-tmdb-id="${movie.id}">Add</button>
                    <button class="keywords" data-tmdb-id="${movie.id}" data-movie-title="${movie.title.replace(/"/g, '&quot;')}">Keywords</button>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
};

const renderProfileView = () => {
    const movies = JSON.parse(localStorage.my_movies);
    let cardsHtml = "";

    movies.forEach((movie, i) => {
        cardsHtml += `
            <div class="draggable-item movie-fav-card" data-index="${i}">
                <img src="${movie.thumbnail}" alt="${movie.title}" onerror="this.onerror=null; this.src='${FALLBACK_IMG}';">
                <div class="fav-info">
                    <div class="title">${movie.title || "<em>No title</em>"}</div>
                    <div class="director">${movie.director || "Unknown"}</div>
                </div>
                <div class="actions">
                    <button class="show" data-my-id="${i}">Show</button>
                    <button class="edit" data-my-id="${i}">Edit</button>
                    <button class="delete" data-my-id="${i}">Delete</button>
                </div>
            </div>
        `;
    });

    document.getElementById('profile-content').innerHTML = cardsHtml;
    initInteract();
};

// --- MODALES ---
const openModal = (htmlContent) => {
    document.getElementById('modal-content').innerHTML = htmlContent;
    document.getElementById('modal-overlay').classList.remove('hidden');
};

const closeModal = () => {
    document.getElementById('modal-overlay').classList.add('hidden');
};

const editView = (i, movie) => `
    <h2>Edit Movie</h2>
    <div class="field">Title<input type="text" id="title" value="${movie.title}"></div>
    <div class="field">Director<input type="text" id="director" value="${movie.director}"></div>
    <div class="field">Thumbnail URL<input type="text" id="thumbnail" value="${movie.thumbnail}"></div>
    <div class="actions">
        <button class="update" data-my-id="${i}">Update</button>
        <button class="close-modal">Cancel</button>
    </div>
`;

const showView = (movie) => {
    const kwBtn = movie.tmdbId 
        ? `<button class="keywords" data-tmdb-id="${movie.tmdbId}" data-movie-title="${movie.title}">View Keywords</button>` 
        : '';
    return `
        <h2>${movie.title}</h2>
        <img src="${movie.thumbnail}" width="160" style="border-radius: 8px; margin: 10px 0;" onerror="this.onerror=null; this.src='${FALLBACK_IMG}';">
        <p><strong>Director:</strong> ${movie.director || "Unknown"}</p>
        <div class="actions">
            ${kwBtn}
            <button class="close-modal">Close</button>
        </div>
    `;
};

const newView = () => `
    <h2>Add Custom Movie</h2>
    <div class="field">Title<input type="text" id="title" placeholder="Movie title"></div>
    <div class="field">Director<input type="text" id="director" placeholder="Director name"></div>
    <div class="field">Thumbnail URL<input type="text" id="thumbnail" placeholder="https://..."></div>
    <div class="actions">
        <button class="create">Create</button>
        <button class="close-modal">Cancel</button>
    </div>
`;

const keywordsView = (movieTitle, cleanedKeywords) => {
    const savedKeywords = JSON.parse(localStorage.my_keywords || "[]");
    let content = cleanedKeywords.length === 0 
        ? `<p>No keywords found for this movie.</p>`
        : `<div class="keyword-list">` + cleanedKeywords.map(kw => {
            const isSaved = savedKeywords.includes(kw);
            return `
                <div class="keyword-badge">
                    <span>#${kw}</span>
                    <button class="add-keyword" data-keyword="${kw}" ${isSaved ? 'disabled' : ''}>
                        ${isSaved ? 'Saved' : 'Add to favorites'}
                    </button>
                </div>
            `;
        }).join('') + `</div>`;

    return `
        <h2>Keywords: "${movieTitle}"</h2>
        ${content}
        <div class="actions">
            <button class="my-keywords">All My Keywords (${savedKeywords.length})</button>
            <button class="close-modal">Close</button>
        </div>
    `;
};

const myKeywordsView = () => {
    const savedKeywords = JSON.parse(localStorage.my_keywords || "[]");
    let content = savedKeywords.length === 0
        ? `<p>Your keywords list is empty.</p>`
        : `<div class="keyword-list">` + savedKeywords.map((kw, idx) => `
            <div class="keyword-badge">
                <span>#${kw}</span>
                <button class="search-by-kw" data-keyword="${kw}">Search</button>
                <button class="remove-keyword danger" data-kw-index="${idx}">Delete</button>
            </div>
        `).join('') + `</div>`;

    return `
        <h2>My Saved Keywords</h2>
        ${content}
        <div class="actions">
            <button class="close-modal">Close</button>
        </div>
    `;
};

// --- CONTROLLERS ---

const saveKeyContr = () => {
    const key = document.getElementById('api_key_input').value.trim();
    localStorage.setItem('tmdb_api_key', key);
    alert("API Key saved!");
    loadPopularMovies();
};

const loadPopularMovies = async () => {
    const token = getApiKey();
    if (!token) return;

    try {
        const res = await fetch('https://api.themoviedb.org/3/movie/popular', {
            headers: { accept: 'application/json', Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            currentSearchResults = await attachDirectors(data.results.slice(0, 8), token);
            renderMoviesView(currentSearchResults, "Popular Movies");
        }
    } catch (err) {
        console.error(err);
    }
};

const attachDirectors = async (movies, token) => {
    return Promise.all(movies.map(async (movie) => {
        try {
            const res = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/credits`, {
                headers: { accept: 'application/json', Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const credits = await res.json();
                const dir = credits.crew?.find(p => p.job === "Director");
                movie.director = dir ? dir.name : "Unknown";
            }
        } catch {
            movie.director = "Unknown";
        }
        return movie;
    }));
};

const searchContr = async (query) => {
    const token = getApiKey();
    if (!query || !query.trim()) return alert("Please enter a movie title.");
    if (!token) return alert("Please save your TMDb API Token first on the Home tab.");

    mySwiper.slideTo(1);
    document.getElementById('movies-content').innerHTML = `<p>Searching "${query}"...</p>`;

    try {
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query.trim())}`, {
            headers: { accept: 'application/json', Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            document.getElementById('movies-content').innerHTML = `
                <div style="padding: 20px; color: #ffffff; background: #1d2a44; border-radius: 8px; text-align: center;">
                    <h3>Erreur de connexion TMDb</h3>
                    <p>Code d'erreur : ${res.status} (Vérifie ton Jeton Bearer sur la page Home).</p>
                </div>`;
            return;
        }

        const data = await res.json();
        const topResults = (data.results || []).slice(0, 8);

        if (topResults.length === 0) {
            document.getElementById('movies-content').innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h3>Aucun résultat</h3>
                    <p>Aucun film trouvé pour "${query}". Essaie un autre titre.</p>
                </div>`;
            return;
        }

        currentSearchResults = await attachDirectors(topResults, token);
        renderMoviesView(currentSearchResults, `Results for "${query}"`);
        playSlideAnimation();

    } catch (err) {
        console.error(err);
        document.getElementById('movies-content').innerHTML = `<p class="alert">Erreur réseau ou problème de connexion.</p>`;
    }
};

const addFromAPIContr = (tmdbId, buttonEl) => {
    const selectedMovie = currentSearchResults.find(m => m.id === tmdbId);
    if (!selectedMovie) return;

    let my_movies = JSON.parse(localStorage.my_movies);
    if (my_movies.some(m => m.tmdbId === tmdbId)) {
        return alert(`"${selectedMovie.title}" is already in your favorites!`);
    }

    my_movies.push({
        tmdbId: selectedMovie.id,
        title: selectedMovie.title,
        director: selectedMovie.director || "Unknown",
        thumbnail: selectedMovie.poster_path ? `${TMDB_IMAGE_BASE}${selectedMovie.poster_path}` : FALLBACK_IMG
    });

    localStorage.my_movies = JSON.stringify(my_movies);
    renderProfileView();

    buttonEl.innerText = "Added!";
    buttonEl.disabled = true;
    setTimeout(() => {
        buttonEl.innerText = "Add";
        buttonEl.disabled = false;
    }, 1500);
};

const keywordsContr = async (movieId, movieTitle) => {
    const token = getApiKey();
    if (!token) return alert("Please enter your API Token on the Home slide first.");

    openModal(`<p>Loading keywords for ${movieTitle}...</p>`);

    try {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/keywords`, {
            headers: { accept: 'application/json', Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const cleaned = processKeywords(data.keywords || []);
        openModal(keywordsView(movieTitle, cleaned));
    } catch (err) {
        openModal(`<p>Error loading keywords.</p><button class="close-modal">Close</button>`);
    }
};

const addKeywordToList = (keyword, buttonEl) => {
    let my_keywords = JSON.parse(localStorage.my_keywords || "[]");
    const normalized = cleanKeyword(keyword);
    if (!my_keywords.includes(normalized)) {
        my_keywords.push(normalized);
        localStorage.my_keywords = JSON.stringify(my_keywords);
        buttonEl.disabled = true;
        buttonEl.innerText = "Saved";
    }
};

const createContr = () => {
    let my_movies = JSON.parse(localStorage.my_movies);
    my_movies.push({
        title: document.getElementById('title').value || "Untitled",
        director: document.getElementById('director').value || "Unknown",
        thumbnail: document.getElementById('thumbnail').value || FALLBACK_IMG
    });
    localStorage.my_movies = JSON.stringify(my_movies);
    closeModal();
    renderProfileView();
};

const updateContr = (i) => {
    let my_movies = JSON.parse(localStorage.my_movies);
    my_movies[i].title = document.getElementById('title').value;
    my_movies[i].director = document.getElementById('director').value;
    my_movies[i].thumbnail = document.getElementById('thumbnail').value || FALLBACK_IMG;
    localStorage.my_movies = JSON.stringify(my_movies);
    closeModal();
    renderProfileView();
};

const deleteContr = (i) => {
    if (confirm("Remove this movie from your favorites?")) {
        let my_movies = JSON.parse(localStorage.my_movies);
        my_movies.splice(i, 1);
        localStorage.my_movies = JSON.stringify(my_movies);
        renderProfileView();
    }
};

const resetContr = () => {
    localStorage.my_movies = JSON.stringify(initial_movies);
    renderProfileView();
};

// --- INTERACT.JS (DRAG & DROP) ---
const initInteract = () => {
    if (typeof interact === 'undefined') return;
    interact('.draggable-item').draggable({
        inertia: true,
        autoScroll: true,
        listeners: {
            move(event) {
                const target = event.target;
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
            }
        }
    });
};

// --- ROUTEUR D'ÉVÉNEMENTS ---
const matchEvent = (ev, sel) => ev.target.closest(sel);
const myId = (ev) => Number(ev.target.closest('[data-my-id]').dataset.myId);

document.addEventListener('click', ev => {
    const navLink = matchEvent(ev, 'nav a');
    if (navLink) {
        ev.preventDefault();
        mySwiper.slideTo(Number(navLink.dataset.slide));
    }
    else if (matchEvent(ev, '.save-key')) saveKeyContr();
    else if (matchEvent(ev, '.search')) {
        const queryInput = document.getElementById('search_query');
        if (queryInput) searchContr(queryInput.value);
    }
    else if (matchEvent(ev, '.add-from-api')) {
        const btn = matchEvent(ev, '.add-from-api');
        addFromAPIContr(Number(btn.dataset.tmdbId), btn);
    }
    else if (matchEvent(ev, '.keywords')) {
        const btn = matchEvent(ev, '.keywords');
        keywordsContr(Number(btn.dataset.tmdbId), btn.dataset.movieTitle);
    }
    else if (matchEvent(ev, '.show')) openModal(showView(JSON.parse(localStorage.my_movies)[myId(ev)]));
    else if (matchEvent(ev, '.edit')) openModal(editView(myId(ev), JSON.parse(localStorage.my_movies)[myId(ev)]));
    else if (matchEvent(ev, '.update')) updateContr(myId(ev));
    else if (matchEvent(ev, '.delete')) deleteContr(myId(ev));
    else if (matchEvent(ev, '.new')) openModal(newView());
    else if (matchEvent(ev, '.create')) createContr();
    else if (matchEvent(ev, '.reset')) resetContr();
    else if (matchEvent(ev, '.add-keyword')) {
        const btn = matchEvent(ev, '.add-keyword');
        addKeywordToList(btn.dataset.keyword, btn);
    }
    else if (matchEvent(ev, '.my-keywords')) openModal(myKeywordsView());
    else if (matchEvent(ev, '.remove-keyword')) {
        const btn = matchEvent(ev, '.remove-keyword');
        let kw = JSON.parse(localStorage.my_keywords || "[]");
        kw.splice(Number(btn.dataset.kwIndex), 1);
        localStorage.my_keywords = JSON.stringify(kw);
        openModal(myKeywordsView());
    }
    else if (matchEvent(ev, '.search-by-kw')) {
        const btn = matchEvent(ev, '.search-by-kw');
        const kw = btn.dataset.keyword;
        closeModal();
        document.getElementById('search_query').value = kw;
        searchContr(kw);
    }
    else if (matchEvent(ev, '.close-modal') || ev.target.id === 'modal-overlay') closeModal();
});

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    mySwiper = new Swiper('.swiper', {
        direction: 'horizontal',
        loop: false,
        simulateTouch: true,
        noSwipingClass: 'draggable-item',
        pagination: { 
            el: '.swiper-pagination', 
            clickable: true 
        },
        navigation: { 
            nextEl: '.swiper-button-next', 
            prevEl: '.swiper-button-prev' 
        },
        on: {
            slideChangeTransitionStart: function () {
                playSlideAnimation();
            }
        }
    });

    const savedKey = getApiKey();
    if (savedKey) {
        document.getElementById('api_key_input').value = savedKey;
        loadPopularMovies();
    }

    renderProfileView();

    const searchInput = document.getElementById('search_query');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchContr(searchInput.value);
            }
        });
    }

    // Lancement de l'animation sur la première page au démarrage
    playSlideAnimation();
});