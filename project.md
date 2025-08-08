# Excalidraw Clone Project Summary

This document summarizes the context, code, and discussions shared about your Excalidraw clone project. It includes an overview of the project structure, key code snippets, my understanding of the current state, identified issues, suggested improvements, and must-have features to make the application production-ready. This is based on our iterative conversations, where you've shared backend code (HTTP and WebSocket), database schema, types, and project goals. The focus has been on building end-to-end authentication, with plans to expand to other features like rate limiting, caching, and local storage.

The project aims to create a collaborative whiteboard app similar to Excalidraw, supporting real-time drawing, rooms, chat, and shape persistence. You're using a Turbo repo for monorepo management, with separate packages for shared types and utilities.

## Project Overview

- **Name**: Excalidraw Clone Web App
- **Tech Stack**:
  - **Frontend**: Next.js (for UI, landing page, and routing) with Next-Auth for authentication.
  - **Backend**:
    - HTTP Server: Node.js/Express for API endpoints (e.g., user signup/signin, room creation, chats).
    - WebSocket Server: Node.js with `ws` library for real-time features (e.g., drawing sync, chat broadcasting, room joining).
  - **Database**: PostgreSQL managed via Prisma ORM.
  - **Monorepo**: Turbo repo with folders like `apps/excalidraw-frontend`, `apps/http-backend`, `apps/ws-backend`, and `packages/common` for shared types (e.g., Zod schemas, WebSocket message types).
  - **Authentication**: Custom JWT-based auth with httpOnly cookies; partial integration with Next-Auth.
  - **Other Tools**: bcrypt for password hashing, JWT for tokens, UUID for IDs, Zod for input validation.
- **Current Status**:
  - Landing page implemented.
  - Basic auth (signup/signin) via HTTP backend.
  - Room creation and joining.
  - Real-time chat and shape streaming via WebSockets with ACK mechanisms for reliability.
  - Shapes stored in DB (via Chat model, which seems to double as shape storage).
  - Pending: Full E2E auth integration, rate limiting, caching, local storage for shapes, advanced drawing features.
- **Goals**:
  - Achieve MVP with real-time collaboration.
  - Make it production-ready: Secure, scalable, performant, with features like persistence, undo/redo, and exports.

## Architecture and Key Components

### Project Structure (Based on Shared Description)

- **Turbo Repo Layout**:
  - `apps/excalidraw-frontend`: Next.js app (landing page, auth routes, canvas UI).
  - `apps/http-backend`: Node.js/Express server for HTTP APIs.
  - `apps/ws-backend`: Node.js WebSocket server for real-time sync.
  - `packages/common`: Shared types, schemas (e.g., Zod validations, WebSocket enums/interfaces).
  - Root `.env` file for shared secrets (e.g., `JWT_SECRET`, `DATABASE_URL`).

### Database Schema (from `schema.prisma`)

- **User**: ID (UUID), name, email (unique), password, photo (optional). Relations: Rooms (admin), Chats.
- **Room**: ID (autoincrement), slug (unique), createdAt, adminId. Relations: Admin (User), Chats.
- **Chat**: ID (autoincrement), roomId, message (string, used for chat or shapes like `{type: 'rect', x:1, y:1...}`), userId. Relations: Room, User.
  - Note: Chat model is overloaded for both messages and shapes; consider a dedicated Shapes model for clarity.

### HTTP Backend (Key Files)

- **authMiddleware.ts**: Verifies JWT from `access_token` cookie, sets `req.userId`. Issues: No try/catch on `jwt.verify`, assumes decoded is string (should be object).
- **user.ts**: Routes for `/signup`, `/signin` (with bcrypt hashing), `/room` (create room, auth protected), `/chats/:roomId` (get messages), `/room/:slug` (get room).
  - Signin sets httpOnly cookie with JWT (payload: user.id as string; should be object `{id: user.id}`).
- **index.ts**: Express app with CORS, cookie-parser, loads `.env`, listens on port 3001.

### WebSocket Backend (from `index.ts` in ws-backend)

- Uses `ws` library on port 8081.
- Auth: Extracts `token` from query param (`?token=...`), verifies with hardcoded secret `"lal32i"` (should use `process.env.JWT_SECRET`).
- User Management: In-memory `users` array with connectionId, userId, rooms, pendingAcks (for message retries).
- Message Handling: Switch on `WsDataType` (e.g., JOIN, LEAVE, CHAT, STREAM_SHAPE).
  - CHAT: Saves to DB, broadcasts with ACK/retry mechanism.
  - ACK System: Sends messages with messageId, tracks pending ACKs, retries on timeout (up to 3 times).
  - Broadcast: To users in the same room using `sendWithAck`.
- Issues: Hardcoded secret, assumes decoded token is string, no username storage, incomplete cases (e.g., STREAM_UPDATE empty).

### Shared Types (from `types.ts` in packages/common)

- Zod Schemas: CreateUserSchema, SigninSchema, CreateRoomSchema.
- WsDataType Enum: JOIN, LEAVE, CHAT, STREAM_SHAPE, ACKNOWLEDGE, etc.
- Interfaces: WebSocketMessage (with type, roomId, userId, messageId), WebSocketChatMessage.

## My Understanding of the Project

From our discussions:

- This is a collaborative drawing app where users create/join rooms, draw shapes in real-time, chat, and persist data.
- Real-time sync is handled via WebSockets (broadcasting actions like drawing or cursor moves).
- Auth is partially custom (JWT cookies via HTTP) but you mentioned Next-Auth integration in frontend.
- Data Flow: Shapes/chats stored in DB, fetched via HTTP, synced via WS.
- Reliability: ACKs and retries in WS to handle flaky co nnections.
- Pain Points: Inconsistent JWT handling (payload as string vs. object, secrets mismatched), incomplete auth in WS, no frontend code shared yet for token passing.
- Overall Progress: Core backend is functional but needs polishing for security and consistency. Frontend has landing page and auth setup, but E2E integration is the current focus.

The app is in early stages but has a solid foundation for real-time features. It's not yet production-ready due to security gaps, lack of persistence optimizations, and missing features like undo/redo.

## Key Issues and Suggested Improvements

### Issues

- **Auth Inconsistencies**: JWT payload varies (string vs. object), secrets mismatched (hardcoded in WS), no expiration/refresh handling.
- **Security**: No rate limiting, potential for spam (e.g., unlimited drawing actions), httpOnly cookies but WS uses query params (exposes tokens in URLs).
- **Performance**: In-memory user/room storage in WS (not scalable; crashes lose state). No caching for DB fetches.
- **Code Quality**: Redundant checks (e.g., multiple null/undefined checks for connection), incomplete WS cases, overloaded Chat model for shapes.
- **Reliability**: ACK system is good but lacks handling for disconnected users (e.g., queue messages).
- **Frontend Gaps**: No shared code yet, but assuming Next-Auth needs bridging to custom JWT.

### Improvements

- **Auth**: Standardize JWT payload to `{id, name, email}`, use env secret everywhere, add token refresh.
- **WS Security**: Pass tokens via headers (not query) if possible, or use secure channels (wss://).
- **Scalability**: Use Redis for in-memory WS state (pub/sub for broadcasts across instances).
- **Error Handling**: Add try/catch everywhere, centralized logging (e.g., Winston).
- **Testing**: Add unit tests (Jest) for auth, integration tests for WS flows.
- **Deployment**: Use PM2/Docker for Node servers, Vercel for Next.js, ensure WS support (e.g., via Socket.IO for better fallbacks).

## Must-Have Features for Production Readiness

To make this app production-ready, implement these features on top of the MVP. Prioritize security, usability, and scalability.

### 1. **Security and Authentication**

- Full E2E Auth: Integrate Next-Auth with custom JWT backend; verify tokens on all HTTP/WS requests.
- Role-Based Access: Admins can kick users or delete rooms; check ownership for actions.
- Rate Limiting: Use `express-rate-limit` for APIs, custom limits for WS messages (e.g., 10 draws/sec).
- Secure Tokens: Add expiration (e.g., 1h), refresh tokens, CSRF protection for cookies.
- Input Sanitization: Validate all messages/shapes with Zod to prevent injection.

### 2. **Real-Time Collaboration**

- Drawing Tools: Implement basic Excalidraw-like tools (line, rect, text, eraser) with rough.js or Konva.js.
- Live Cursors: Broadcast cursor positions (using CURSOR_MOVE type).
- Conflict Resolution: Optimistic updates with reconciliation (e.g., last-write-wins).
- Undo/Redo: Store action history per room, broadcast undo events.

### 3. **Persistence and Performance**

- Local Storage: Cache shapes locally (localStorage or IndexedDB) for offline access/fast loading.
- Caching: Use Redis for frequent DB reads (e.g., room shapes).
- Shape Model: Separate from Chat; create a dedicated Shapes table with JSONB for properties.
- Pagination: For chats/shapes in large rooms.

### 4. **User Experience**

- Room Management: Public/private rooms, invites, shareable links.
- Export/Import: PNG/SVG/JSON exports of boards.
- Themes and Customization: Dark mode, tool palettes.
- Notifications: In-app alerts for joins/leaves, errors.

### 5. **Monitoring and Reliability**

- Logging/Monitoring: Integrate Sentry or ELK stack for errors.
- Graceful Shutdown: Handle WS disconnects, persist unsent messages.
- Scalability: Horizontal scaling for WS (e.g., via Redis pub/sub).
- CI/CD: GitHub Actions for tests/deployments.

### 6. **Deployment and Ops**

- HTTPS/WSS: Enforce secure connections.
- Environment Config: Separate dev/prod envs.
- Backup: Regular DB backups.

## Roadmap/Next Steps

1. **Immediate**: Fix JWT consistency, integrate Next-Auth with backends (based on upcoming `route.ts` share).
2. **Short-Term**: Implement rate limiting, local storage, and basic drawing canvas.
3. **Medium-Term**: Add advanced features (undo, exports), tests.
4. **Long-Term**: Deploy, monitor, iterate based on user feedback.

This summary captures everything discussed—feel free to iterate or provide more code for deeper refinements!
