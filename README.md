# ChatSphere Frontend

ChatSphere is a WhatsApp clone built with the MERN stack. This repository contains the **frontend** part of the project, developed using React, Vite, and Tailwind CSS.

## Project Overview

ChatSphere aims to provide a real-time chat application experience similar to WhatsApp, including features like messaging, video calls, status updates, and user settings.

## Features

- Real-time messaging with chat lists and chat windows
- Video call support using WebRTC (simple-peer)
- User status updates and previews
- User settings and support modal
- Emoji picker and message reactions
- Responsive and modern UI with Tailwind CSS and DaisyUI
- State management with Zustand
- Form handling with React Hook Form and validation with Yup
- Notifications with React Toastify
- Socket.io client for real-time communication

## Tech Stack

- React 19
- Vite (build tool)
- Tailwind CSS with DaisyUI
- Zustand for state management
- React Router DOM for routing
- Socket.io-client for real-time events
- Simple-peer for WebRTC video calls
- Axios for HTTP requests
- Date-fns for date/time utilities
- React Hook Form and Yup for form validation
- Framer Motion for animations
- Various MUI icons and React Icons

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Ankitbhagat2062/WhatsAppClone.git
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root if needed for environment variables (e.g., API URLs).

## Running the Development Server

Start the development server with:

```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or the port Vite assigns).

## Building for Production

To build the optimized production bundle:

```bash
npm run build
```

## Preview Production Build

To locally preview the production build:

```bash
npm run preview
```

## Project Structure

- `src/` - React components, pages, hooks, services, store, and utilities
- `public/` - Static assets like favicon and images
- `package.json` - Project dependencies and scripts
- `vite.config.js` - Vite configuration

## Live Demo

Check out the live demo of ChatSphere: [ChatSphere Demo](https://demo-link.com)

![ChatSphere Screenshot](https://via.placeholder.com/800x600.png?text=ChatSphere+Screenshot)

## Backend

The backend for ChatSphere is a separate MERN stack application that handles authentication, data persistence, and real-time socket communication. Ensure the backend server is running and accessible for the frontend to function properly.

## Contributing

Contributions are welcome! Please open issues or pull requests for bug fixes and new features.

## License

This project is licensed under the MIT License.

---

Made with ❤️ by ChatSphere Team
