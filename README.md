# URL Shortener – Backend Design (Node.js + SQLite)

## Overview

This project implements a **URL shortener backend** using **Node.js**, **Express**, and **SQLite**.  
The purpose of this repository is not only to build a working system, but also to capture **design decisions and trade-offs** that are commonly discussed in backend and system design interviews.

This README is intentionally written as a **revision guide** that can be referred to before interviews.

---

## Core Functionality

1. Accept a long URL from a client
2. Generate a short code
3. Persist the mapping in a database
4. Redirect short URL requests to the original URL

---

## High-Level Architecture

```
Client (Postman / Browser / Mobile App)
        |
        v
Express Server (server.js)
        |
        v
Database Layer (db.js)
        |
        v
SQLite Database (data.sqlite)
```

---

## API Design

### Create a Short URL

**Endpoint**
```
POST /api/v1/shorten
```

**Request**
```json
{
  "original_url": "https://example.com/very/long/url"
}
```

**Response**
```json
{
  "short_url": "http://localhost:3000/1",
  "original_url": "https://example.com/very/long/url"
}
```

---

### Redirect to Original URL

**Endpoint**
```
GET /:code
```

**Example**
```
GET /1
→ Redirects to original URL
```

---

## Database Design

### Table: `urls`

```sql
CREATE TABLE urls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code TEXT UNIQUE,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Why `id` is the Primary Key (and not `short_code`)

### Key Design Decision

The system uses:

```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
```

instead of:

```sql
PRIMARY KEY (short_code)
```

### Reasons

1. **Primary keys should be internal and stable**
   - `short_code` is user-facing and may change
   - `id` is internal and immutable

2. **Performance**
   - Integer primary keys are faster and smaller than text keys
   - SQLite optimizes `INTEGER PRIMARY KEY` as a rowid alias

3. **Future extensibility**
   - Custom aliases
   - Multiple short codes per URL
   - Multiple domains

---

## Short Code Generation Strategy

### Approach Used: Auto-increment ID + Base62 Encoding

**Flow**
```
INSERT URL → get auto-increment ID → Base62 encode ID → short_code
```

### Why Base62?

- URL-safe characters
- Compact representation
- Deterministic
- No collision handling required

### Example

| ID | Base62 |
|----|--------|
| 1  | 1 |
| 62 | Z |
| 63 | 10 |
| 125 | 21 |

---

## Why Not Hash the URL?

| Hashing Approach | ID + Base62 |
|------------------|------------|
| Collision risk | Guaranteed uniqueness |
| Retry logic required | No retries |
| Harder to debug | Simple and predictable |

---

## Database Access Layer (`db.js`)

### Responsibilities

- Open SQLite database
- Run migrations
- Prepare SQL statements
- Expose functions instead of raw SQL

### Why Prepared Statements?

- Faster execution
- SQL injection protection
- Clean separation of concerns

Example:
```js
insertUrl(originalUrl)
findByShortCode(code)
```

---

## Migrations Strategy

- Schema is created automatically at startup
- No manual DB setup required

### SQLite Caveat

SQLite is file-based:
- If the DB file already exists, schema is reused
- Schema changes require manual DB recreation during development

```bash
rm data.sqlite
npm start
```

---

## Environment Configuration

### `.env`

```
PORT=3000
BASE_HOST=http://localhost:3000
DB_PATH=./data.sqlite
```

### Why `dotenv`?

- No hardcoded configuration
- Environment-specific settings
- Industry-standard approach

---

## Why Use `npm run start`

- Ensures correct working directory
- Ensures `.env` is loaded correctly
- Prevents subtle dotenv-related bugs

---

## Error Handling Strategy

- Input validation using `validator`
- Graceful HTTP errors
- Try/catch around DB operations
- Fail-fast during startup if schema is invalid

---

## Security Considerations

- Rate limiting to prevent abuse
- Helmet for secure HTTP headers
- URL validation
- Prepared SQL statements

---

## Scaling Considerations (Interview Talking Points)

### Read-heavy traffic
- Redis cache for short_code → original_url

### Write scalability
- Move to PostgreSQL or MySQL
- Sequence-based ID generation

### Analytics
- Add click tracking table
- Store timestamp, referrer, and anonymized IP

### High traffic
- Stateless servers
- Load balancer
- CDN for redirects

---

## Why SQLite for This Project?

- Zero configuration
- Easy to reason about
- Perfect for prototyping and learning

**Production systems** typically use PostgreSQL or MySQL.

---

## Key Interview Takeaways

You should be able to explain:
- Why ID-based short codes were chosen
- Why short_code is not a primary key
- SQLite limitations
- How the system would scale
- Trade-offs compared to hashing approaches

---

## How to Run Locally

```bash
npm install
npm run start
```

Test endpoints:
```
POST http://localhost:3000/api/v1/shorten
GET  http://localhost:3000/{code}
```

---

## Final Note

This project prioritizes **clarity of design over cleverness**.  
Every decision was made to optimize for:
- Simplicity
- Predictability
- Interview explainability
- Future extensibility
