# REST API Documentation

Base URL: `http://localhost:3000/api` (local) or `https://<your-deployment>/api` (production).

## Conventions

**Authentication.** Every protected endpoint accepts a JWT in either place:

- `Authorization: Bearer <token>` header (Postman, curl, mobile clients)
- `cms_token` httpOnly cookie, set automatically by `/auth/login` and `/auth/register` (browser)

Tokens are HS256-signed, expire after `JWT_EXPIRES_IN` (default 7 days), and carry `sub` (user id), `name`, `email` and `role`.

**Roles.** There are two roles: `student` and `admin`. Each endpoint below lists who can call it.

**Response envelope.** Every response is JSON in one of two shapes:

```json
{ "success": true, "data": { } }
```

```json
{ "success": false, "error": { "message": "Validation failed", "details": { "email": "Enter a valid email address" } } }
```

`details` is only present on validation errors and maps field paths (e.g. `lessons.0.title`) to messages.

**Status codes**

| Code | Meaning |
| --- | --- |
| 200 / 201 | Success / resource created |
| 400 | Malformed JSON or a disallowed action (e.g. changing your own role) |
| 401 | Missing, invalid or expired token; wrong credentials |
| 403 | Authenticated but the role is not allowed |
| 404 | Resource not found, or not visible to the caller |
| 409 | Conflict (email already registered, already enrolled) |
| 422 | Request body or query failed validation |
| 500 | Unexpected server error |

**Pagination.** List endpoints return `{ items: [...], meta: { page, limit, total, totalPages } }`.

---

## Auth

### POST `/auth/register`
Public. Creates a **student** account and logs the user in. Admin accounts come from the seed script, or an admin can promote a user.

Body:

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 2–100 chars |
| `email` | string | valid email, unique |
| `password` | string | 8–72 chars, at least one letter and one number |
| `confirmPassword` | string | must match `password` |

`201` response:

```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com", "role": "student", "createdAt": "2026-10-04T10:00:00.000Z" },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

Errors: `409` if the email is taken, `422` for validation errors.

### POST `/auth/login`
Public. Body: `{ "email": string, "password": string }`. Returns the same `{ user, token }` shape and sets the cookie. A wrong email or password returns `401 Invalid email or password`.

### POST `/auth/logout`
Public. Clears the auth cookie. Returns `{ "message": "Logged out" }`.

### GET `/auth/me`
Any authenticated user. Returns `{ user }` for the token holder.

---

## Courses

### GET `/courses`
Public. Visitors and students only see **published** courses. Admins see all courses unless they filter by `status`.

Query parameters (all optional):

| Param | Values | Default |
| --- | --- | --- |
| `q` | Matches title, description or instructor (case-insensitive) | — |
| `category` | `Web Development`, `Data Science`, `Design`, `Cloud & DevOps`, `Mobile Development`, `Business` | — |
| `level` | `beginner`, `intermediate`, `advanced` | — |
| `status` | `published`, `draft`, `all` (admin only) | `all` for admin |
| `sort` | `newest`, `oldest`, `title`, `popular` | `newest` |
| `page` | ≥ 1 | 1 |
| `limit` | 1–50 | 9 |

Example: `GET /api/courses?q=react&level=intermediate&sort=popular&page=1&limit=9`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Modern React & Next.js",
        "description": "Build production-ready web apps...",
        "category": "Web Development",
        "level": "intermediate",
        "instructor": "Sarah Mitchell",
        "thumbnailUrl": "https://images.unsplash.com/...",
        "durationHours": 14,
        "isPublished": true,
        "createdAt": "2026-09-10T08:00:00.000Z",
        "updatedAt": "2026-09-10T08:00:00.000Z",
        "enrollmentCount": 4,
        "lessonCount": 6
      }
    ],
    "meta": { "page": 1, "limit": 9, "total": 1, "totalPages": 1 }
  }
}
```

### GET `/courses/:id`
Public, but draft courses return `404` unless the caller is an admin. Returns the course with its ordered `lessons`. For a logged-in student it also includes `enrollment` (`{ id, status, progress }`, or `null` if not enrolled).

### POST `/courses`
**Admin.** Creates a course and its lessons in one transaction.

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | 3–150 chars |
| `description` | string | 20–5000 chars |
| `category` | enum | one of the categories above |
| `level` | enum | `beginner` / `intermediate` / `advanced` |
| `instructor` | string | 2–100 chars |
| `thumbnailUrl` | string? | `https://` URL or empty |
| `durationHours` | integer | 1–500 |
| `isPublished` | boolean | default `false` |
| `lessons` | array | 1–100 items, in order |
| `lessons[].title` | string | 3–150 chars |
| `lessons[].content` | string | ≥ 10 chars |
| `lessons[].videoUrl` | string? | URL or empty (YouTube links are embedded in the player) |
| `lessons[].durationMinutes` | integer | 1–600 |

```json
{
  "title": "Intro to SQL",
  "description": "Learn to query relational databases with confidence.",
  "category": "Data Science",
  "level": "beginner",
  "instructor": "Ada Lovelace",
  "thumbnailUrl": "",
  "durationHours": 5,
  "isPublished": true,
  "lessons": [
    { "title": "SELECT basics", "content": "Selecting columns and rows...", "durationMinutes": 12 },
    { "title": "Filtering with WHERE", "content": "Narrowing results...", "durationMinutes": 15 }
  ]
}
```

Returns `201` with the created course, including lessons.

### PATCH `/courses/:id`
**Admin.** Partial update: send only the fields you want to change, e.g. `{ "isPublished": false }`.

If you send `lessons`, it replaces the full ordered list:

- items with an existing `id` are updated and re-ordered
- items without an `id` are created
- existing lessons left out of the list are deleted

When lessons are added or removed, progress for every enrollment in the course is recalculated.

### DELETE `/courses/:id`
**Admin.** Deletes the course. Its lessons, enrollments and progress are removed by cascade. Returns `{ id, deleted: true }`.

---

## Enrollments

### GET `/enrollments`
Authenticated. **Students** only ever get their own enrollments. **Admins** get all enrollments and can filter them.

| Param | Description |
| --- | --- |
| `q` | Matches course title, student name or email |
| `status` | `active` or `completed` |
| `courseId` | Filter by course |
| `userId` | Filter by student (admin only) |
| `page`, `limit` | Pagination (limit ≤ 100, default 20) |

Each item:

```json
{
  "id": "uuid",
  "status": "active",
  "progress": 50,
  "enrolledAt": "2026-10-01T09:00:00.000Z",
  "completedAt": null,
  "lastAccessedAt": "2026-10-03T18:20:00.000Z",
  "user": { "id": "uuid", "name": "Demo Student", "email": "student@learnhub.dev" },
  "course": {
    "id": "uuid", "title": "Modern React & Next.js", "category": "Web Development", "level": "intermediate",
    "instructor": "Sarah Mitchell", "thumbnailUrl": "https://...", "durationHours": 14, "lessonCount": 6
  }
}
```

Items are ordered by `lastAccessedAt` descending, so the most recently opened course comes first.

### POST `/enrollments`
**Student.** Body: `{ "courseId": "uuid" }`. Enrolls the caller in a published course. Returns `201` with the enrollment detail (see below). Returns `409` if the student is already enrolled, or `404` if the course doesn't exist or is a draft.

### GET `/enrollments/:id`
The owning student or an admin. Returns the enrollment plus the course's ordered `lessons` and `completedLessonIds`. When a student calls it, `lastAccessedAt` is also updated. Another student's enrollment returns `404`.

### PATCH `/enrollments/:id/progress`
**Owning student.** Marks one lesson as complete or incomplete.

```json
{ "lessonId": "uuid", "completed": true }
```

The server then recalculates `progress` as `completed lessons / total lessons × 100`. At 100% the `status` becomes `completed` and `completedAt` is set. Unchecking a lesson sets the status back to `active`. Returns the updated enrollment detail.

### DELETE `/enrollments/:id`
The owning student (to unenroll) or an admin (to remove a student). Returns `{ id, deleted: true }`.

---

## Users (admin)

### GET `/users`
**Admin.** Query: `q` (name or email), `role` (`student` / `admin`), `page`, `limit`. Each item includes `enrollmentCount` and `completedCount`.

### GET `/users/:id`
**Admin.** Returns a single user (the password hash is never returned).

### PATCH `/users/:id`
**Admin.** Body: `{ "role": "student" | "admin" }`. Admins cannot change their own role (`400`).

### DELETE `/users/:id`
**Admin.** Deletes the user, with their enrollments and progress removed by cascade. Admins cannot delete themselves (`400`).

---

## Admin analytics

### GET `/admin/stats`
**Admin.**

```json
{
  "totals": {
    "students": 6, "admins": 1, "courses": 8, "publishedCourses": 7,
    "enrollments": 18, "completedEnrollments": 5, "averageProgress": 54, "completionRate": 28
  },
  "topCourses": [{ "id": "uuid", "title": "Modern React & Next.js", "category": "Web Development", "enrollments": 4, "averageProgress": 62 }],
  "byCategory": [{ "category": "Web Development", "courses": 2, "enrollments": 6 }],
  "recentEnrollments": [{ "id": "uuid", "enrolledAt": "...", "progress": 0, "status": "active", "studentName": "Fatima Khan", "courseTitle": "UI/UX Design Principles" }]
}
```

---

## Quick test with curl

```bash
# Log in and capture the token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@learnhub.dev","password":"Admin@123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).data.token")

# Search published beginner courses
curl "http://localhost:3000/api/courses?level=beginner&q=python"

# Admin-only stats
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/stats
```
