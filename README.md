# Anymo Space

Anymo Space is a **100% anonymous** chat room application built with **Node.js**. It allows users to join a space and communicate with others without the need for registration or personal data storage. The app is designed with privacy in mind — no data is saved, and users are free to chat without concerns about personal information being stored.

## Features

- **Completely Anonymous**: No personal data is stored or required.
- **Real-time Chat**: Instant communication between users.
- **Simple Interface**: Minimalistic and user-friendly interface.
- **No Registration**: Simply join and chat — no sign-up needed.
![image](https://github.com/user-attachments/assets/fb765387-4f34-4a29-8bc5-ccf4749a1803)

## Tech Stack

- **Backend**: Node.js
- **WebSocket**: For real-time communication
- **Frontend**: HTML, CSS (lightweight)

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Steps to Run the Application

1. Clone this repository:

   ```bash
   git clone https://github.com/skytup/anymo-space.git
   ```

2. Navigate into the project directory:

   ```bash
   cd anymo-space
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Run the app:

   ```bash
   npm start
   ```

The application will now be running on [http://localhost:3000](http://localhost:3000).

## How It Works

- **Join the Room**: Upon visiting the app, users will be instantly connected to a chat room without any login or authentication process.
- **Real-Time Chat**: Users can send and receive messages in real-time using WebSocket.
- **Anonymous Communication**: Every message sent is anonymous — no user profiles or personal identifiers are collected.

## Contributing

Feel free to fork the repository and submit pull requests if you have suggestions or improvements.

1. Fork the repository.
2. Create a branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-name`).
5. Open a pull request.

## Credits

Developed by Akash Vishwakarma  
Visit [akash.skytup.com](https://akash.skytup.com) for more information.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Notes

- **Privacy**: No user data is stored on the server. Messages are not retained beyond the current chat session.
- **Security**: The app does not track user actions, and each session is independent.
