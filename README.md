# Plinth

**The spatial code canvas — your newest (and favorite) code editor.**

Plinth reimagines the IDE as an infinite 2D workspace. Instead of jumping between tabs, you can map your logic spatially using interactive nodes all while backed by a persistent Dockerized sandbox.

---

## Core Features
- **Spatial Mapping:** Visualize your directory structure as interactive nodes on an infinite canvas via React Flow.
- **Dockerized Sandboxes:** Every user gets a secure, isolated Node.js container with custom resource limits (RAM/CPU).
- **Persistent Volumes:** Files are stored in Docker volumes, ensuring your work survives container restarts.
- **Ghost Cleanup:** Automated janitor logic that terminates abandoned containers and prevents resource leakage.
- **The Archive:** Clear your visual canvas without losing your underlying terminal files.

## Tech Stack
- **Frontend:** React, React Flow, Redux Toolkit (State Management), Tailwind CSS
- **Backend:** Node.js, Express, Socket.io (Real-time Terminal), Dockerode (Docker API)
- **Database:** MongoDB (via Mongoose) for node positions and user metadata.
- **Testing:** Playwright for End-to-End browser testing.

## Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Must be running)
- Node.js (v18 or higher)
- MongoDB instance (Local or Atlas)

### 1. Setup Environment
Create a `.env` file in `apps/server`:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
DOCKER_SOCKET_PATH=/var/run/docker.sock 
```

### 2. Run backend
```
cd apps/server
npm install
npm run dev
```

### 3. Run frontend
```
cd apps/client
npm install
npm run dev
```

### 4. Testing 
Run the Playwright suite to ensure the canvas and terminal are communicating:
```
cd apps/client
npx playwright test --ui
```

## To-do
- Add multiple terminals/delete terminal window
- Open/close terminal button
- Download terminal files back onto computer 
- Scroll bar in terminal
- Settings page see their storage usage and how many days they have left until their workspace expires?
- Duplicate node on canvas
- Delete individual files/nodes from the canvas
- Remove display of upload in terminal
- Adjustable terminal size 
- Adjustable node sizes 
- Text and drawing capability on canvas (implement layering?)
- Add password protection 
- Add localhost from within docker to different ports for each user if deployed
