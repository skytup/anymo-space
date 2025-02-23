const socket = io();

// Local Storage Management
function saveToLocalStorage(roomData) {
    let rooms = JSON.parse(localStorage.getItem('recentRooms') || '[]');
    rooms = rooms.filter(room => room.roomId !== roomData.roomId);
    rooms.unshift({
        ...roomData,
        timestamp: Date.now()
    });
    rooms = rooms.slice(0, 5); // Keep only 5 most recent rooms
    localStorage.setItem('recentRooms', JSON.stringify(rooms));
    displayRecentRooms();
}
function displayRecentRooms() {
    const recentRooms = JSON.parse(localStorage.getItem('recentRooms') || '[]');
    const container = document.getElementById('recentRooms');

    if (recentRooms.length > 0) {
        container.style.display = 'block';
        container.innerHTML = '<h3>Recent Rooms</h3>';

        recentRooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = 'recent-room-item';
            roomElement.innerHTML = `
                <div>
                    <strong>${room.roomName}</strong>
                    <div style="font-size: 0.8rem; color: #667781;">ID: ${room.roomId}</div>
                </div>
                <button class="btn btn-secondary" onclick="rejoinRoom('${room.roomId}', '${room.roomName}', '${room.password}')">
                    <i class="fas fa-sign-in-alt"></i>
                </button>
            `;
            container.appendChild(roomElement);
        });
    } else {
        container.style.display = 'none';
    }
}

function clearLocalStorage() {
    if (confirm('Are you sure you want to clear all recent room data?')) {
        localStorage.removeItem('recentRooms');
        displayRecentRooms();
    }
}

function showCreateRoom() {
    document.getElementById('createRoomModal').style.display = 'flex';
}

function showJoinRoom() {
    document.getElementById('joinRoomModal').style.display = 'flex';
}

function hideModals() {
    document.getElementById('createRoomModal').style.display = 'none';
    document.getElementById('joinRoomModal').style.display = 'none';
    // Clear error messages
    document.getElementById('joinError').style.display = 'none';
    document.getElementById('createSuccess').style.display = 'none';
}

function createRoom() {
    const roomName = document.getElementById('roomName').value.trim();
    const password = document.getElementById('roomPassword').value.trim();

    if (!roomName || !password) {
        alert('Please fill in all fields');
        return;
    }

    socket.emit('createRoom', { roomName, password });
}

function verifyAndJoin() {
    const roomId = document.getElementById('roomId').value.trim();
    const password = document.getElementById('joinPassword').value.trim();
    const username = document.getElementById('username').value.trim();

    if (!roomId || !password || !username) {
        showError('Please fill in all fields');
        return;
    }

    // Store username in localStorage
    localStorage.setItem('username', username);

    // First verify the password
    socket.emit('verifyPassword', {
        roomId,
        password,
        username // Include username in verification
    });
}

function rejoinRoom(roomId, roomName) {
    window.location.href = `/room.html?id=${roomId}`;
}

function showError(message) {
    const errorAlert = document.getElementById('joinError');
    errorAlert.style.display = 'block';
    errorAlert.textContent = message;
    setTimeout(() => {
        errorAlert.style.display = 'none';
    }, 5000);
}

// Socket event listeners
socket.on('roomCreated', (data) => {
    const successAlert = document.getElementById('createSuccess');
    successAlert.style.display = 'block';
    successAlert.innerHTML = `
        Room created successfully!<br>
        Room ID: ${data.roomId}<br>
        (Copied to clipboard)
    `;

    // Save to local storage
    saveToLocalStorage({
        roomId: data.roomId,
        roomName: data.roomName,
        password: document.getElementById('roomPassword').value
    });

    // Copy room ID to clipboard
    navigator.clipboard.writeText(data.roomId);

    setTimeout(() => {
        hideModals();
        window.location.href = `/room.html?id=${data.roomId}`;
    }, 2000);
});

socket.on('passwordValid', (data) => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('joinPassword').value;

    // Save room data to localStorage
    saveToLocalStorage({
        roomId: data.roomId,
        roomName: data.roomName,
        password: password,
        username: username
    });

    // Redirect to chat room
    window.location.href = `/room.html?id=${data.roomId}`;
});

socket.on('passwordError', (data) => {
    showError(data.message);
});

socket.on('joined', (data) => {
    const roomId = new URLSearchParams(window.location.search).get('id');
    window.location.href = `/room.html?id=${roomId}`;
});

socket.on('error', (data) => {
    showError(data.message);
    clearLocalStorage();
});

// Initialize
displayRecentRooms();

// Check for room ID in URL
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('id');
if (roomId) {
    document.getElementById('roomId').value = roomId;
    showJoinRoom();
}