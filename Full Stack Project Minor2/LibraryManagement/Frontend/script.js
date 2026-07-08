const API_BASE = 'http://127.0.0.1:8000';

// DOM Elements
const bookForm = document.getElementById('book-form');
const inputBookId = document.getElementById('book-id');
const inputTitle = document.getElementById('title');
const inputAuthor = document.getElementById('author');
const inputCategory = document.getElementById('category');
const inputPrice = document.getElementById('price');
const inputQuantity = document.getElementById('quantity');
const inputPublisher = document.getElementById('publisher');

const submitBtn = document.getElementById('submit-btn');
const submitBtnText = submitBtn.querySelector('.btn-text');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');

const booksListContainer = document.getElementById('books-list');
const emptyState = document.getElementById('empty-state');
const loadingState = document.getElementById('loading');
const bookCountBadge = document.getElementById('book-count');
const toastContainer = document.getElementById('toast-container');

// State Variables
let isEditMode = false;
let editingBookId = null;
let currentBooksList = [];

// Pre-defined Test Books from prompt
const TEST_BOOKS = [
    { book_id: 101, title: "Python Programming", author: "Guido Rossum", category: "Programming", price: 799, quantity: 25, publisher: "Tech Books" },
    { book_id: 102, title: "Learning Django", author: "William Vincent", category: "Web Development", price: 950, quantity: 15, publisher: "Code Publications" },
    { book_id: 103, title: "MongoDB Basics", author: "John Smith", category: "Database", price: 650, quantity: 20, publisher: "Database World" },
    { book_id: 104, title: "JavaScript Essentials", author: "David Green", category: "Programming", price: 550, quantity: 18, publisher: "Web Tech" },
    { book_id: 105, title: "HTML & CSS Complete Guide", author: "Sarah Johnson", category: "Frontend", price: 450, quantity: 30, publisher: "Frontend Academy" }
];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    fetchBooks();
    
    // Add event listeners
    bookForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', exitEditMode);
    
    // Clear errors on input
    [inputBookId, inputTitle, inputAuthor, inputCategory, inputPrice, inputQuantity, inputPublisher].forEach(input => {
        input.addEventListener('input', () => clearError(input.id));
    });
});

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Select Icon based on type
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    } else {
        iconSvg = `<svg class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Fade out and remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
}

/**
 * Show error for a specific input field
 */
function showError(inputId, message) {
    const errorSpan = document.getElementById(`error-${inputId}`);
    if (errorSpan) {
        errorSpan.textContent = message;
    }
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
        inputElement.style.borderColor = 'var(--accent-danger)';
    }
}

/**
 * Clear error for a specific input field
 */
function clearError(inputId) {
    const errorSpan = document.getElementById(`error-${inputId}`);
    if (errorSpan) {
        errorSpan.textContent = '';
    }
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
        inputElement.style.borderColor = '';
    }
}

/**
 * Reset all error messages
 */
function clearAllErrors() {
    ['book-id', 'title', 'author', 'category', 'price', 'quantity', 'publisher'].forEach(clearError);
}

/**
 * Form Input Validation
 */
function validateForm() {
    clearAllErrors();
    let isValid = true;

    // Check empty fields
    const fields = [
        { id: 'book-id', name: 'Book ID' },
        { id: 'title', name: 'Title' },
        { id: 'author', name: 'Author' },
        { id: 'category', name: 'Category' },
        { id: 'price', name: 'Price' },
        { id: 'quantity', name: 'Quantity' },
        { id: 'publisher', name: 'Publisher' }
    ];

    fields.forEach(field => {
        const value = document.getElementById(field.id).value.trim();
        if (!value) {
            showError(field.id, `${field.name} is required.`);
            isValid = false;
        }
    });

    if (!isValid) return false;

    // Validate Numbers
    const bookIdVal = parseInt(inputBookId.value);
    if (isNaN(bookIdVal) || bookIdVal <= 0) {
        showError('book-id', 'Book ID must be a positive integer.');
        isValid = false;
    }

    // If adding a new book, ensure ID is unique
    if (!isEditMode) {
        const idExists = currentBooksList.some(b => b.book_id === bookIdVal);
        if (idExists) {
            showError('book-id', `A book with ID ${bookIdVal} already exists in the catalog.`);
            isValid = false;
        }
    }

    const priceVal = parseFloat(inputPrice.value);
    if (isNaN(priceVal) || priceVal < 0) {
        showError('price', 'Price must be a valid positive number.');
        isValid = false;
    }

    const qtyVal = parseInt(inputQuantity.value);
    if (isNaN(qtyVal) || qtyVal < 0) {
        showError('quantity', 'Quantity must be a positive integer.');
        isValid = false;
    }

    return isValid;
}

/**
 * Fetch all books from Django server
 */
async function fetchBooks() {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    booksListContainer.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE}/books/`);
        if (!response.ok) {
            throw new Error(`Server returned code: ${response.status}`);
        }
        const data = await response.json();
        currentBooksList = data;
        renderBooks(data);
    } catch (error) {
        console.error('Fetch error:', error);
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        // Update empty state text to show database issue
        emptyState.querySelector('h3').textContent = 'Server Connection Error';
        emptyState.querySelector('p').innerHTML = `Could not connect to Django backend at <strong>${API_BASE}</strong>.<br>Please check if the backend server is running and database configuration is correct.`;
        showToast('Could not fetch books from server.', 'error');
    }
}

/**
 * Render Book List in Grid
 */
function renderBooks(books) {
    loadingState.classList.add('hidden');
    booksListContainer.innerHTML = '';
    
    // Update badge count
    bookCountBadge.textContent = `${books.length} Book${books.length !== 1 ? 's' : ''}`;

    if (books.length === 0) {
        emptyState.classList.remove('hidden');
        // Restore standard empty state text
        emptyState.querySelector('h3').textContent = 'No books cataloged yet';
        emptyState.querySelector('p').innerHTML = `Add books using the registration form, or <a href="#" id="load-test-data" class="demo-link">load test data</a>.`;
        
        // Wire up the load test data link
        const testDataLink = document.getElementById('load-test-data');
        if (testDataLink) {
            testDataLink.addEventListener('click', (e) => {
                e.preventDefault();
                seedTestData();
            });
        }
        
        booksListContainer.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    booksListContainer.classList.remove('hidden');

    books.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.id = `book-${book.book_id}`;

        // Stock quantity status pill style
        let qtyClass = '';
        let qtyText = `${book.quantity} left`;
        if (book.quantity === 0) {
            qtyClass = 'qty-out';
            qtyText = 'Out of Stock';
        } else if (book.quantity <= 5) {
            qtyClass = 'qty-low';
            qtyText = `${book.quantity} low stock`;
        }

        card.innerHTML = `
            <div class="book-id-badge">ID: ${book.book_id}</div>
            <div class="book-card-main">
                <h3 class="book-title">${escapeHTML(book.title)}</h3>
                <div class="book-author">
                    <svg class="book-author-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>${escapeHTML(book.author)}</span>
                </div>
                <span class="badge badge-category">${escapeHTML(book.category)}</span>
                
                <div class="book-meta-details">
                    <div class="book-meta-item">
                        <svg class="meta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>${escapeHTML(book.publisher)}</span>
                    </div>
                </div>
            </div>

            <div class="book-status-row">
                <div class="book-price">₹${parseFloat(book.price).toLocaleString('en-IN')}</div>
                <div class="book-qty">
                    <span class="qty-pill ${qtyClass}"></span>
                    <span>${qtyText}</span>
                </div>
            </div>

            <div class="card-actions">
                <button class="card-btn card-btn-edit" onclick="enterEditMode(${book.book_id})">
                    <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Update</span>
                </button>
                <button class="card-btn card-btn-delete" onclick="deleteBook(${book.book_id})">
                    <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                </button>
            </div>
        `;
        booksListContainer.appendChild(card);
    });
}

/**
 * Handle form submit (Add or Update)
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        showToast('Please correct form errors.', 'error');
        return;
    }

    // Disable buttons during request
    submitBtn.disabled = true;
    submitBtnText.textContent = isEditMode ? 'Updating...' : 'Adding...';

    const bookPayload = {
        book_id: parseInt(inputBookId.value),
        title: inputTitle.value.trim(),
        author: inputAuthor.value.trim(),
        category: inputCategory.value.trim(),
        price: parseFloat(inputPrice.value),
        quantity: parseInt(inputQuantity.value),
        publisher: inputPublisher.value.trim()
    };

    let url = `${API_BASE}/books/add/`;
    let method = 'POST';

    if (isEditMode) {
        url = `${API_BASE}/books/update/${editingBookId}/`;
        method = 'PUT';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookPayload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Server error occurred.');
        }

        showToast(data.message || 'Operation successful!', 'success');
        
        // Reset form and reload book list
        bookForm.reset();
        if (isEditMode) {
            exitEditMode();
        }
        
        fetchBooks();
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Submit error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtnText.textContent = isEditMode ? 'Update Book' : 'Add Book';
    }
}

/**
 * Load Book Details into Form and enter Edit Mode
 */
window.enterEditMode = function(bookId) {
    const book = currentBooksList.find(b => b.book_id === bookId);
    if (!book) return;

    isEditMode = true;
    editingBookId = bookId;
    clearAllErrors();

    // Populate fields
    inputBookId.value = book.book_id;
    inputBookId.disabled = true; // Book ID cannot be updated
    
    inputTitle.value = book.title;
    inputAuthor.value = book.author;
    inputCategory.value = book.category;
    inputPrice.value = book.price;
    inputQuantity.value = book.quantity;
    inputPublisher.value = book.publisher;

    // Update UI elements
    formTitle.textContent = 'Update Book Details';
    formSubtitle.textContent = `Modifying record for Book ID: ${bookId}`;
    submitBtnText.textContent = 'Update Book';
    
    // Change plus icon in button to check icon
    submitBtn.querySelector('.btn-icon').innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />`;
    cancelBtn.classList.remove('hidden');

    // Smooth scroll to form on mobile/tablet
    bookForm.scrollIntoView({ behavior: 'smooth' });
};

/**
 * Exit Edit Mode and restore Form to Add State
 */
function exitEditMode() {
    isEditMode = false;
    editingBookId = null;
    clearAllErrors();

    bookForm.reset();
    inputBookId.disabled = false;

    // Restore UI elements
    formTitle.textContent = 'Add a New Book';
    formSubtitle.textContent = 'Enter details to catalog a book in the library system';
    submitBtnText.textContent = 'Add Book';
    
    // Restore plus icon in button
    submitBtn.querySelector('.btn-icon').innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />`;
    cancelBtn.classList.add('hidden');
}

/**
 * Delete Book Record
 */
window.deleteBook = async function(bookId) {
    if (!confirm(`Are you sure you want to delete book ID ${bookId}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/books/delete/${bookId}/`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete book.');
        }

        showToast(data.message || 'Book deleted successfully.', 'success');
        
        // If we are currently editing the deleted book, exit edit mode
        if (isEditMode && editingBookId === bookId) {
            exitEditMode();
        }

        fetchBooks();
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Delete error:', error);
    }
};

/**
 * Seed MongoDB database with test data from instructions
 */
async function seedTestData() {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    showToast('Loading testing books...', 'info');

    let successCount = 0;
    for (const book of TEST_BOOKS) {
        try {
            const response = await fetch(`${API_BASE}/books/add/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(book)
            });
            if (response.ok) {
                successCount++;
            }
        } catch (e) {
            console.error(`Failed to add seed book ${book.book_id}:`, e);
        }
    }

    if (successCount > 0) {
        showToast(`Successfully added ${successCount} testing books.`, 'success');
    } else {
        showToast('Could not load test data. Check connection.', 'error');
    }
    
    fetchBooks();
}

/**
 * Escape HTML utilities to prevent XSS
 */
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
