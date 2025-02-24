// import notify from '/script/notify.js';
const socket = io();
const roomId = new URLSearchParams(window.location.search).get('id');
const messagesContainer = document.getElementById('messages');
let username = localStorage.getItem('username');
let lastTypingTime;
let typingTimeout;
let unreadMessages = 0;
let isPageVisible = true;
const scrollBottom = document.getElementById('scroll-bottom');
let isAtBottom = true;

// Scroll handling
messagesContainer.addEventListener('scroll', () => {
    const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100;
    isAtBottom = isNearBottom;
    scrollBottom.classList.toggle('visible', !isNearBottom);
});

scrollBottom.addEventListener('click', () => {
    messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
    });
});


// Join room on page load
if (!username) {
    window.location.href = `/index.html?id=${roomId}`;
}

function updateUsersList(users) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    let username = localStorage.getItem('username');

    users.forEach(user => {
        
        const userDiv = document.createElement('div');
        if (user.name===username) {
            userDiv.style.backgroundColor = '#000';
            userDiv.style.color = '#fff';
        }
        userDiv.className = 'user-item';
        userDiv.innerHTML = `
            <div class="user-status ${user.online ? 'online' : 'offline'}"></div>
            <i class="fas fa-user"></i>
            <span>${user.name}</span>
        `;
        usersList.appendChild(userDiv);
    });

    document.getElementById('userCount').textContent = users.length;
}

function addMessage(data, type = 'received') {
    const messages = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const time = new Date(data.timestamp).toLocaleTimeString();

    messageDiv.innerHTML = `
        <div class="username">${data.username}</div>
        <div class="content">${data.message}</div>
        <div class="message-time">${time}</div>
    `;

    messages.appendChild(messageDiv);

    // Handle unread messages
    if (!isPageVisible && type === 'received') {
        unreadMessages++;
        // updateUnreadBadge();
        (new Audio('/tone/swift.mp3')).play();
        notify(localStorage.getItem('username'), data.message);
    } else if (type === 'received') {
        (new Audio('/tone/received.mp3')).play();
    }

    // Auto scroll if user is at bottom
    const isAtBottom = messages.scrollHeight - messages.scrollTop === messages.clientHeight;
    messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// function updateUnreadBadge() {
//     document.title = unreadMessages > 0 ? `(${unreadMessages}) Anymo Chat` : 'Anymo Chat';
// }

// function showNewMessageIndicator() {
//     const indicator = document.getElementById('newMessagesIndicator');
//     indicator.style.display = 'block';
// }

function handleVisibilityChange() {
    isPageVisible = !document.hidden;
    if (isPageVisible) {
        unreadMessages = 0;
        // updateUnreadBadge();
    }
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (message) {
        socket.emit('message', { message });
        input.value = '';
        stopTyping();
    }
}

// Send message on Enter key press
document.getElementById('messageInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
function handleTyping() {
    if (!lastTypingTime) {
        socket.emit('typing', { roomId });
    }
    lastTypingTime = new Date().getTime();

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        const timeNow = new Date().getTime();
        const timeDiff = timeNow - lastTypingTime;
        if (timeDiff >= 3000) {
            socket.emit('stopTyping', { roomId });
            lastTypingTime = null;
        }
    }, 3000);
}

function stopTyping() {
    lastTypingTime = null;
    socket.emit('stopTyping', { roomId });
}

// Mobile sidebar toggle
document.querySelector('.mobile-toggle-users').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('show');
});

// Event listeners
document.addEventListener('visibilitychange', handleVisibilityChange);

socket.on('typing', (data) => {
    const typingDiv = document.getElementById('typingIndicator');
    typingDiv.textContent = `${data.username} is typing...`;
    typingDiv.style.display = 'block';
});

socket.on('stopTyping', () => {
    document.getElementById('typingIndicator').style.display = 'none';
});

socket.on('joined', (data) => {
    document.getElementById('roomName').textContent = data.roomName;
    document.title = `(${data.roomName}) Anymo Space | Skytup`;

    // Display previous messages
    data.messages.forEach(msg => {
        addMessage(msg, msg.username === username ? 'sent' : 'received');
    });
});

socket.on('message', (data) => {
    addMessage(data, data.username === username ? 'sent' : 'received');
});

socket.on('userList', (data) => {
    updateUsersList(data.users);
});

socket.on('userJoined', (data) => {
    addSystemMessage(`${data.username} joined the chat`);
    console.log(data.username + ' joined the chat');
    new Audio('/tone/join.mp3').play();
});

socket.on('userLeft', (data) => {
    addSystemMessage(`${data.username} left the chat`);
    console.log(data.username + ' left the chat');
});

function addSystemMessage(message) {
    const systemMessage = document.createElement('div');
    systemMessage.classList.add('system-message'); // Add a class to style the message
    systemMessage.textContent = message;

    messagesContainer.appendChild(systemMessage);
}

// Handle page unload
window.onbeforeunload = () => {
    socket.disconnect();
};

// Initialize
// updateUnreadBadge();

// Check if we have the required data
function initializeRoom() {
    if (!roomId) {
        window.location.href = '/index.html';
        return;
    }

    // Get saved room data
    const recentRooms = JSON.parse(localStorage.getItem('recentRooms') || '[]');
    const currentRoom = recentRooms.find(room => room.roomId === roomId);

    if (!currentRoom) {
        window.location.href = `/index.html?id=${roomId}`;
        return;
    }

    // Join room with saved credentials
    socket.emit('joinRoom', {
        roomId: currentRoom.roomId,
        username: currentRoom.username,
        password: currentRoom.password
    });
}

// Socket event listeners
socket.on('joined', (data) => {
    // Update room name
    document.getElementById('roomName').textContent = data.roomName;
    document.getElementById('modalRoomName').textContent = data.roomName;

    // Display previous messages
    // data.messages.forEach(msg => {
    //     const messageType = msg.username === localStorage.getItem('username') ? 'sent' : 'received';
    //     addMessage(msg, messageType);
    // });

    // Update user list
    updateUsersList(data.users);
});

socket.on('error', (data) => {
    alert(data.message);
    // removing recent rooms when getting error
    localStorage.removeItem('recentRooms');
    window.location.href = '/index.html';
});

// Initialize the room when page loads
initializeRoom();

function leaveRoom() {
    if (window.confirm('Are you sure you want to leave the room?')) {
        socket.emit('leaveRoom', { roomId });
        window.location.href = '/index.html';

    }
}

// Send message on Enter key press
document.getElementById('messageInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});