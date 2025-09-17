# ChatSphere Backend

## Description

ChatSphere is a real-time messaging application inspired by WhatsApp, built using the MERN stack (MongoDB, Express.js, React, Node.js). This repository contains the backend API that handles authentication, messaging, status updates, video calls, and real-time communication via WebSockets.

The backend provides RESTful APIs for user management, chat functionality, and integrates with third-party services for media uploads, SMS notifications, and email services.

## Features

- **User Authentication**: OTP-based registration and login using phone numbers
- **Real-time Messaging**: Send and receive messages with support for text, images, and files
- **Message Reactions**: Add reactions to messages
- **Status Updates**: Create, view, and manage user status updates
- **Video Calls**: Integrated video calling functionality
- **File Uploads**: Cloud storage for images and media files using Cloudinary
- **Real-time Notifications**: WebSocket-based real-time updates
- **Message Management**: Mark messages as read, delete messages
- **Profile Management**: Update user profiles with avatar uploads

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: Socket.io
- **Authentication**: JSON Web Tokens (JWT)
- **File Storage**: Cloudinary
- **SMS Service**: Twilio
- **Email Service**: Nodemailer
- **Other Libraries**:
  - `body-parser`: Parse incoming request bodies
  - `cookie-parser`: Parse cookies
  - `cors`: Enable Cross-Origin Resource Sharing
  - `dotenv`: Load environment variables
  - `multer`: Handle file uploads

## Installation

1. **Clone the repository**:
   ```bash 
   git clone https://github.com/Ankitbhagat2062/WhatsAppClone.git
   ````
   
   ````
   cd backend
   ````

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add the following variables:
   ```
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   MONGODB_URI=mongodb://localhost:27017/chatsphere
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **For production**:
   ```bash
   npm start
   ```

## Usage

The server will start on the port specified in your `.env` file (default: 5000). The API endpoints are available under `/api`.

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/send-otp` - Send OTP for registration/login
- `POST /api/auth/verify-otp` - Verify OTP and authenticate user
- `GET /api/auth/logout` - Logout user
- `GET /api/auth/check-auth` - Check if user is authenticated (requires auth)
- `GET /api/auth/get-all-users` - Get all users (requires auth)
- `PUT /api/auth/update-profile` - Update user profile (requires auth, supports file upload)

#### Chat (`/api/chats`)
- `POST /api/chats/send-message` - Send a message (requires auth, supports file upload)
- `POST /api/chats/add-reactions` - Add reaction to a message (requires auth)
- `GET /api/chats/conversations` - Get user conversations (requires auth)
- `GET /api/chats/conversations/:conversationId/messages` - Get messages for a conversation (requires auth)
- `PUT /api/chats/messages/read` - Mark messages as read (requires auth)
- `DELETE /api/chats/messages/:messageId` - Delete a message (requires auth)

#### Status (`/api/status`)
- `POST /api/status` - Create a status update (requires auth, supports file upload)
- `GET /api/status` - Get all status updates (requires auth)
- `PUT /api/status/:statusId/view` - View a status update (requires auth)
- `DELETE /api/status/:statusId` - Delete a status update (requires auth)

### Real-time Events

The backend uses Socket.io for real-time communication. Connect to the server and listen for events such as:
- `message`: New message received
- `status`: Status update
- `user_online`: User came online
- `user_offline`: User went offline

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `FRONTEND_URL` | Frontend application URL | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Yes |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | Yes |
| `EMAIL_USER` | Email service username | Yes |
| `EMAIL_PASS` | Email service password | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
