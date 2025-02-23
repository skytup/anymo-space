
function notify(title, summary) {
    // Check if the browser supports notifications
    if (!("Notification" in window)) {
        console.error("This browser does not support desktop notifications.");
        return;
    }

    // Request permission if not already granted
    if (Notification.permission === "granted") {
        // If it's okay, create a notification
        showNotification(title, summary);
    } else if (Notification.permission !== "denied") {
        // Otherwise, ask the user for permission
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                showNotification(title, summary);
            }
        });
    }
}

function showNotification(title, summary) {
    // Create and display the notification
    const notification = new Notification(title, {
        body: summary,
        icon: '/anymo.png' // Optional: Add an icon for the notification
    });

    // Optional: Add event listeners for the notification
    notification.onclick = () => {
        window.focus();
    };
}

export default notify;
// Example usage
// notify("New Message", "You have received a new message.");
