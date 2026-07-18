// 1) Add your OMDb API key here.
const API_KEY = "10051002";
const API_URL = "https://www.omdbapi.com/";
const FALLBACK_POSTER = "https://placehold.co/300x450/eeeeee/555555?text=No+Poster";

// 2) State — remember the current search so Prev/Next can reuse it.
let currentQuery = "";
let currentType = "";
let currentPage = 1;
let totalResults = 0;

// 3) Grab page elements.
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const typeSelect = document.getElementById("type-select");
const message = document.getElementById("message");
const results = document.getElementById("results");
const pagination = document.getElementById("pagination");
const modalOverlay = document.getElementById("modal-overlay");
const modalContent = document.getElementById("modal-content");
const modalClose = document.getElementById("modal-close");

// Close modal when ✕ is clicked or the dark overlay is clicked.
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
	if (e.target === modalOverlay) closeModal();
});

// One click listener on the results grid — registered once, handles all cards.
results.addEventListener("click", async (e) => {
	const card = e.target.closest(".movie-card");
	if (!card) return;
	await openModal(card.dataset.id);
});

function closeModal() {
	modalOverlay.classList.add("hidden");
	modalContent.innerHTML = "";
}

// 4) Handle form submit — save state and kick off page 1.
form.addEventListener("submit", async (event) => {
	event.preventDefault();

	const query = input.value.trim();
	const type = typeSelect.value;

	if (!query) {
		message.textContent = "Type a movie title first.";
		results.innerHTML = "";
		pagination.innerHTML = "";
		return;
	}

	if (API_KEY === "PASTE_YOUR_OMDB_API_KEY_HERE") {
		message.textContent = "Add your OMDb API key in index.js.";
		results.innerHTML = "";
		return;
	}

	// Save the search so Prev/Next can reuse it.
	currentQuery = query;
	currentType = type;
	currentPage = 1;

	await fetchMovies();
});

// 5) Fetch movies using saved state (called by form submit AND pagination buttons).
async function fetchMovies() {
	message.textContent = "Searching...";
	renderSkeletons();
	pagination.innerHTML = "";

	try {
		const url = `${API_URL}?apikey=${API_KEY}&s=${encodeURIComponent(currentQuery)}&page=${currentPage}${currentType ? `&type=${currentType}` : ""}`;
		const response = await fetch(url);
		const data = await response.json();

		if (data.Response === "False") {
			message.textContent = data.Error;
			return;
		}

		totalResults = parseInt(data.totalResults, 10);
		message.textContent = `Found ${totalResults} result(s) — page ${currentPage} of ${Math.ceil(totalResults / 10)}.`;
		renderMovies(data.Search);
		renderPagination();
	} catch (error) {
		message.textContent = "Network error. Try again.";
	}
}

// 6) Show Prev / Next buttons.
function renderPagination() {
	const totalPages = Math.ceil(totalResults / 10);
	if (totalPages <= 1) return; // No buttons needed for a single page.

	if (currentPage > 1) {
		const prev = document.createElement("button");
		prev.textContent = "← Prev";
		prev.addEventListener("click", () => {
			currentPage--;
			fetchMovies();
		});
		pagination.appendChild(prev);
	}

	const pageLabel = document.createElement("span");
	pageLabel.textContent = ` Page ${currentPage} of ${totalPages} `;
	pagination.appendChild(pageLabel);

	if (currentPage < totalPages) {
		const next = document.createElement("button");
		next.textContent = "Next →";
		next.addEventListener("click", () => {
			currentPage++;
			fetchMovies();
		});
		pagination.appendChild(next);
	}
}

// 7) Show 10 placeholder cards while the API call is in flight.
function renderSkeletons() {
	results.innerHTML = Array.from({ length: 10 })
		.map(() => `
			<div class="movie-card skeleton-card">
				<div class="skeleton skeleton-poster"></div>
				<div class="skeleton skeleton-title"></div>
				<div class="skeleton skeleton-year"></div>
			</div>
		`)
		.join("");
}

// 8) Show movie cards — each card has a data-id for the click handler above.
function renderMovies(movieList) {
	results.innerHTML = movieList
		.map((movie) => {
			const safeTitle = String(movie.Title).replaceAll('"', "&quot;");
			const posterHtml =
				movie.Poster && movie.Poster !== "N/A"
					? `<img src="${movie.Poster}" alt="Poster for ${safeTitle}" class="movie-poster" onerror="this.onerror=null;this.src='${FALLBACK_POSTER}'" />`
					: `<div class="no-poster">No poster</div>`;

			// data-id stores the IMDb ID so the click handler knows what to fetch.
			return `
				<div class="movie-card" data-id="${movie.imdbID}" style="cursor:pointer;">
					${posterHtml}
					<h3>${movie.Title}</h3>
					<p>${movie.Year}</p>
				</div>
			`;
		})
		.join("");
}

// 8) Fetch full movie details and show the modal.
async function openModal(imdbID) {
	modalContent.innerHTML = "<p>Loading...</p>";
	modalOverlay.classList.remove("hidden"); // Show the modal.

	try {
		const response = await fetch(`${API_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
		const movie = await response.json();

		const poster = movie.Poster && movie.Poster !== "N/A"
			? `<img src="${movie.Poster}" alt="${movie.Title}" class="modal-poster" />`
			: "";

		modalContent.innerHTML = `
			${poster}
			<div class="modal-info">
				<h2>${movie.Title} (${movie.Year})</h2>
				<p><strong>Rating:</strong> ${movie.imdbRating} / 10</p>
				<p><strong>Genre:</strong> ${movie.Genre}</p>
				<p><strong>Director:</strong> ${movie.Director}</p>
				<p><strong>Cast:</strong> ${movie.Actors}</p>
				<p><strong>Plot:</strong> ${movie.Plot}</p>
			</div>
		`;
	} catch (error) {
		modalContent.innerHTML = "<p>Could not load details.</p>";
	}
}
