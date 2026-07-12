const API_BASE = 'http://127.0.0.1:8080';

// Global state variables
let currentUser = null;
let allUsers = [];
let activeChatPartner = null;
let chatMessages = [];
let pollingInterval = null;
let editingChatId = null;

// ==================== Avatar Mapping ====================
function getAvatarSVG(avatarName) {
    const avatars = {
        'profile.png': { bg: '#673ab7', fg: '#ede7f6' },
        'avatar2.png': { bg: '#00bcd4', fg: '#e0f7fa' },
        'avatar3.png': { bg: '#e91e63', fg: '#fce4ec' },
        'avatar4.png': { bg: '#4caf50', fg: '#e8f5e9' }
    };
    
    const config = avatars[avatarName] || avatars['profile.png'];
    return `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; display:block;">
            <circle cx="50" cy="50" r="50" fill="${config.bg}"/>
            <circle cx="50" cy="40" r="20" fill="${config.fg}"/>
            <path d="M50 65c-20 0-35 10-35 20v5h70v-5c0-10-15-20-35-20z" fill="${config.fg}"/>
        </svg>
    `;
}

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
    // Determine current page
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    
    if (page === 'dashboard.html') {
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = JSON.parse(storedUser);
        initDashboard();
    }
});

// ==================== Avatar Picker (Registration) ====================
function selectAvatar(element) {
    // Clear selections
    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
    // Select clicked
    element.classList.add('selected');
    // Set value in hidden input
    document.getElementById('profile-image').value = element.getAttribute('data-avatar');
}

// ==================== Authentication Handlers ====================

async function handleRegister(event) {
    event.preventDefault();
    const alertBox = document.getElementById('alert-box');
    alertBox.className = 'alert-message';
    alertBox.innerText = '';

    const fullName = document.getElementById('full-name').value.trim();
    const username = document.getElementById('username').value.trim().toLowerCase();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const profileImage = document.getElementById('profile-image').value;

    try {
        const response = await fetch(`${API_BASE}/users/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: fullName,
                username: username,
                email: email,
                password: password,
                profile_image: profileImage
            })
        });

        const data = await response.json();

        if (response.ok) {
            alertBox.className = 'alert-message success';
            alertBox.innerText = 'Registration successful! Redirecting to login...';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            alertBox.className = 'alert-message error';
            alertBox.innerText = data.error || 'Registration failed. Please try again.';
        }
    } catch (err) {
        alertBox.className = 'alert-message error';
        alertBox.innerText = 'Network error. Make sure the backend server is running.';
        console.error(err);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const alertBox = document.getElementById('alert-box');
    alertBox.className = 'alert-message';
    alertBox.innerText = '';

    const username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/users/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('currentUser', JSON.stringify(data));
            window.location.href = 'dashboard.html';
        } else {
            alertBox.className = 'alert-message error';
            alertBox.innerText = data.error || 'Invalid credentials.';
        }
    } catch (err) {
        alertBox.className = 'alert-message error';
        alertBox.innerText = 'Network error. Make sure the backend server is running.';
        console.error(err);
    }
}

function handleLogout() {
    if (pollingInterval) clearInterval(pollingInterval);
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// ==================== Dashboard Handlers ====================

function initDashboard() {
    // Setup current user profile in sidebar header
    const avatarPlaceholder = document.getElementById('current-user-avatar-placeholder');
    avatarPlaceholder.innerHTML = getAvatarSVG(currentUser.profile_image);
    
    document.getElementById('current-user-name').innerText = currentUser.full_name;
    document.getElementById('current-user-username').innerText = `@${currentUser.username}`;
    
    // Load lists
    loadAllUsers();
    loadConversations();
    
    // Refresh conversation lists every 5 seconds
    setInterval(() => {
        loadConversations();
    }, 5000);
}

async function loadAllUsers() {
    try {
        const response = await fetch(`${API_BASE}/users/`);
        if (response.ok) {
            const users = await response.json();
            allUsers = users.filter(u => u.username !== currentUser.username);
            renderUsersList(allUsers);
        }
    } catch (err) {
        console.error("Failed to load users:", err);
    }
}

async function loadConversations() {
    try {
        const response = await fetch(`${API_BASE}/conversation/?sender=${currentUser.username}`);
        if (response.ok) {
            const conversations = await response.json();
            renderConversationsList(conversations);
        }
    } catch (err) {
        console.error("Failed to load conversations:", err);
    }
}

function renderUsersList(users) {
    const listElement = document.getElementById('users-list');
    listElement.innerHTML = '';
    
    if (users.length === 0) {
        listElement.innerHTML = `<div style="padding: 10px 24px; color: var(--text-muted); font-size: 0.9rem;">No other users found.</div>`;
        return;
    }
    
    users.forEach(user => {
        const isActive = activeChatPartner === user.username ? 'active' : '';
        const item = document.createElement('div');
        item.className = `user-list-item ${isActive}`;
        item.setAttribute('data-username', user.username);
        item.onclick = () => startChat(user.username);
        
        item.innerHTML = `
            <div class="avatar-wrapper">
                <div class="avatar-img">${getAvatarSVG(user.profile_image)}</div>
                <div class="status-dot online"></div>
            </div>
            <div class="item-details">
                <div class="item-name">${user.full_name}</div>
                <div class="item-meta">@${user.username}</div>
            </div>
        `;
        listElement.appendChild(item);
    });
}

function renderConversationsList(conversations) {
    const listElement = document.getElementById('conversations-list');
    listElement.innerHTML = '';
    
    if (conversations.length === 0) {
        listElement.innerHTML = `<div style="padding: 10px 24px; color: var(--text-muted); font-size: 0.9rem;">No chats started yet.</div>`;
        return;
    }
    
    conversations.forEach(conv => {
        const isActive = activeChatPartner === conv.username ? 'active' : '';
        const item = document.createElement('div');
        item.className = `user-list-item ${isActive}`;
        item.onclick = () => startChat(conv.username);
        
        let lastMsgText = '';
        if (conv.last_message) {
            const isMe = conv.last_message.sender === currentUser.username;
            lastMsgText = `${isMe ? 'You: ' : ''}${conv.last_message.message}`;
        }
        
        item.innerHTML = `
            <div class="avatar-wrapper">
                <div class="avatar-img">${getAvatarSVG(conv.profile_image)}</div>
                <div class="status-dot online"></div>
            </div>
            <div class="item-details">
                <div class="item-name">${conv.full_name}</div>
                <div class="item-meta" style="color: var(--text-muted); font-size: 0.82rem;">${escapeHTML(lastMsgText)}</div>
            </div>
        `;
        listElement.appendChild(item);
    });
}

function filterUsers() {
    const searchVal = document.getElementById('user-search-input').value.toLowerCase();
    
    const filteredUsers = allUsers.filter(user => 
        user.full_name.toLowerCase().includes(searchVal) || 
        user.username.toLowerCase().includes(searchVal)
    );
    renderUsersList(filteredUsers);
}

// ==================== Chat Messaging Handlers ====================

function startChat(partnerUsername) {
    activeChatPartner = partnerUsername;
    
    // Highlight item in list
    document.querySelectorAll('.user-list-item').forEach(item => {
        const itemUser = item.getAttribute('data-username');
        if (itemUser === partnerUsername) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Get full partner details
    const partner = allUsers.find(u => u.username === partnerUsername) || { 
        username: partnerUsername, 
        full_name: partnerUsername.charAt(0).toUpperCase() + partnerUsername.slice(1), 
        profile_image: 'profile.png' 
    };
    
    // Show active state, hide empty state
    document.getElementById('chat-empty-state').style.display = 'none';
    document.getElementById('chat-active-state').style.display = 'flex';
    
    // Set active header
    const headerElement = document.getElementById('active-chat-user-header');
    headerElement.innerHTML = `
        <div class="avatar-wrapper" style="width: 44px; height: 44px;">
            <div class="avatar-img">${getAvatarSVG(partner.profile_image)}</div>
        </div>
        <div class="user-info">
            <span class="user-info-name">${partner.full_name}</span>
            <span class="user-info-username" style="font-size: 0.8rem; color: var(--success-color);">Active Now</span>
        </div>
    `;
    
    // Immediately load chats
    loadChatMessages(true);
    
    // Start Polling loop (every 2.5 seconds)
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(() => {
        loadChatMessages(false);
    }, 2500);
}

async function loadChatMessages(shouldScroll = false) {
    if (!activeChatPartner) return;
    
    try {
        const response = await fetch(`${API_BASE}/conversation/${activeChatPartner}/?sender=${currentUser.username}`);
        if (response.ok) {
            const data = await response.json();
            
            // Check if messages list changed (to avoid unnecessary DOM re-renders)
            const isDifferent = JSON.stringify(data) !== JSON.stringify(chatMessages);
            if (isDifferent || shouldScroll) {
                chatMessages = data;
                renderChatMessages();
                scrollToBottom();
            }
        }
    } catch (err) {
        console.error("Failed to load chat messages:", err);
    }
}

function renderChatMessages() {
    const box = document.getElementById('chat-messages-box');
    box.innerHTML = '';
    
    if (chatMessages.length === 0) {
        box.innerHTML = `
            <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; color: var(--text-muted);">
                <span>No messages yet. Send a message to start the conversation!</span>
            </div>
        `;
        return;
    }
    
    chatMessages.forEach(msg => {
        const isOutgoing = msg.sender === currentUser.username;
        const wrapper = document.createElement('div');
        wrapper.className = `message-bubble-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}`;
        
        let actionsHTML = '';
        if (isOutgoing) {
            actionsHTML = `
                <div class="message-actions-overlay">
                    <button class="msg-action-btn" onclick="openEditModal(${msg.chat_id}, '${escapeQuote(msg.message)}')">Edit</button>
                    <button class="msg-action-btn delete" onclick="deleteChatMessage(${msg.chat_id})">Delete</button>
                </div>
            `;
        }
        
        const senderName = isOutgoing ? currentUser.full_name : (allUsers.find(u => u.username === msg.sender)?.full_name || msg.sender);
        
        wrapper.innerHTML = `
            <span class="message-sender-name">${senderName}</span>
            <div class="message-bubble">
                ${escapeHTML(msg.message)}
                ${actionsHTML}
            </div>
            <div class="message-meta">
                <span>${formatTime(msg.sent_at)}</span>
            </div>
        `;
        box.appendChild(wrapper);
    });
}

async function sendChatMessage() {
    const input = document.getElementById('message-text-input');
    const msgText = input.value.trim();
    if (!msgText || !activeChatPartner) return;
    
    input.value = '';
    
    try {
        const response = await fetch(`${API_BASE}/chats/send/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender: currentUser.username,
                receiver: activeChatPartner,
                message: msgText
            })
        });
        
        if (response.ok) {
            loadChatMessages(true);
            loadConversations();
        }
    } catch (err) {
        console.error("Failed to send message:", err);
    }
}

function handleInputKeydown(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// ==================== Edit Message ====================

function openEditModal(chatId, messageText) {
    editingChatId = chatId;
    document.getElementById('edit-message-input').value = messageText;
    document.getElementById('edit-message-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-message-modal').style.display = 'none';
    editingChatId = null;
}

async function saveEditedMessage() {
    if (!editingChatId) return;
    
    const newText = document.getElementById('edit-message-input').value.trim();
    if (!newText) return;
    
    try {
        const response = await fetch(`${API_BASE}/chats/update/${editingChatId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: newText
            })
        });
        
        if (response.ok) {
            closeEditModal();
            loadChatMessages(false);
            loadConversations();
        }
    } catch (err) {
        console.error("Failed to edit message:", err);
    }
}

// ==================== Delete Message ====================

async function deleteChatMessage(chatId) {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    try {
        const response = await fetch(`${API_BASE}/chats/delete/${chatId}/`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadChatMessages(false);
            loadConversations();
        }
    } catch (err) {
        console.error("Failed to delete message:", err);
    }
}

// ==================== Utility Functions ====================

function scrollToBottom() {
    const box = document.getElementById('chat-messages-box');
    box.scrollTop = box.scrollHeight;
}

function formatTime(dateTimeStr) {
    try {
        // Formats YYYY-MM-DD HH:MM:SS to short readable time e.g., "10:30 AM" or "Jul 10, 10:30"
        const dt = new Date(dateTimeStr.replace(' ', 'T'));
        if (isNaN(dt.getTime())) return dateTimeStr;
        return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return dateTimeStr;
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function escapeQuote(str) {
    return str.replace(/'/g, "\\'");
}
