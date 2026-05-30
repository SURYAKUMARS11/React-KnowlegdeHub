KMS (MERN)

Overview
A Knowledge Management System for creating, sharing, and searching knowledge articles.

Key features
- JWT-based user authentication
- Article CRUD with Markdown content, categories, and tags
- Search across articles
- Admin dashboard to manage users

Primary use cases
- Capture internal runbooks and SOPs
- Publish product and API documentation
- Organize knowledge by categories and tags
- Discover content with search and filters
- Track activity and keep content current

Roles
- Admin: full access, user oversight
- Editor: create and update own articles
- Viewer/User: read and search articles

Structure
- client: React front end
- server: Express API
- .github: Workspace instructions

Core workflows
1) Register or sign in
2) Browse or search articles
3) Create or edit articles with Markdown
4) Review details and share internally
5) Admin reviews users and usage insights

Quick start
1) Install dependencies in each workspace:
	- npm install
	- npm install --prefix client
	- npm install --prefix server
2) Configure the server environment:
	- Copy server/.env.example to server/.env
	- Set MONGODB_URI to your MongoDB Atlas connection string
	- Set JWT_SECRET to a strong secret
3) Start both client and server:
	- npm run dev

Environment variables
- MONGODB_URI: MongoDB connection string
- JWT_SECRET: secret for signing auth tokens
- PORT: API port (default 5000)
- VITE_API_URL: client API base URL (default /api)

Scripts
- npm run dev --prefix client
- npm run dev --prefix server
- npm test --prefix client
- npm test --prefix server

API overview
- GET /health
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET /api/articles
- GET /api/articles/search
- GET /api/articles/meta
- GET /api/articles/:id
- POST /api/articles
- PUT /api/articles/:id
- DELETE /api/articles/:id
- GET /api/dashboard/summary
- GET /api/dashboard/activity
- GET /api/dashboard/categories
- GET /api/dashboard/tags
- GET /api/dashboard/contributors
- GET /api/users

Data model (high level)
- User: name, email, passwordHash, role, isActive
- Article: title, content, category, tags, author, timestamps

Auth flow
1) Client posts credentials to /api/auth/login
2) API returns JWT token
3) Client stores token and sends Authorization: Bearer <token>
4) Protected endpoints validate token and role

Testing
1) Run server unit and functional tests:
	- npm test --prefix server
2) Run client unit tests:
	- npm test --prefix client
