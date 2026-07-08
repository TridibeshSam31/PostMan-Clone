# Running & Testing Guide

This document covers how to start both the backend and frontend, and how to manually test every feature of the application end-to-end.

---

## Prerequisites

| Tool | Minimum version | Check |
|------|----------------|-------|
| Python | 3.11 | `python --version` |
| Node.js | 18 | `node --version` |
| npm | 9 | `npm --version` |

---

## 1. Running the Backend (FastAPI)

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment
python -m venv .venv

# 3. Activate it
#    Windows (PowerShell):
.venv\Scripts\Activate.ps1
#    Windows (CMD):
.venv\Scripts\activate.bat
#    macOS / Linux:
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Start the backend server
uvicorn app.main:app --reload --port 8000
```

**What happens on first start:**
- SQLite database `postman_clone.db` is created automatically
- Seed data is inserted: 3 collections, 2 environments, 5 history entries
- The seed is idempotent — restarting does not duplicate data

**Useful URLs:**
| URL | Purpose |
|-----|---------|
| `http://localhost:8000/health` | Health check — should return `{"status":"ok"}` |
| `http://localhost:8000/docs` | Interactive Swagger UI for all API endpoints |
| `http://localhost:8000/redoc` | ReDoc API reference |

---

## 2. Running the Frontend (Next.js)

Open a **new terminal** (keep the backend running):

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies (first time only)
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** The frontend is hardcoded to call `http://localhost:8000`. Both processes must be running simultaneously.

---

## 3. TypeScript Type Check (Frontend)

```bash
cd frontend
npx tsc --noEmit
```

Exits with code `0` and no output if everything is clean.

---

## 4. Manual Testing Checklist

Work through each section in order. Each item describes the action, the expected result, and what it proves.

---

### 4.1 Initial Load

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Open `http://localhost:3000` | Dark Postman-like layout loads with TopBar, Sidebar, empty tab area |
| 2 | Check the Collections sidebar | Three seeded collections appear: **JSONPlaceholder**, **HTTPBin**, **Variable Demo** |
| 3 | Check the History tab (click clock icon) | Five pre-seeded history entries grouped under "Today" |

---

### 4.2 Sending a Request

| # | Action | Expected Result |
|---|--------|----------------|
| 4 | Click **New** in the top bar | A blank "GET / New Request" tab opens |
| 5 | Enter `https://jsonplaceholder.typicode.com/posts/1` in the URL bar | URL field updates |
| 6 | Click **Send** | Send button shows spinner; response panel slides in |
| 7 | Inspect the response panel | Status `200 OK`, response time in ms, size in KB, JSON body |
| 8 | Click **Pretty** / **Raw** toggle | Body view switches between highlighted JSON and plain text |
| 9 | Click the **Headers** sub-tab in the response panel | Response headers shown as a table |
| 10 | Check the History tab | A new "GET jsonplaceholder.typicode.com/posts/1" entry appears at the top |

---

### 4.3 Query Parameters

| # | Action | Expected Result |
|---|--------|----------------|
| 11 | With the tab open, click the **Params** sub-tab | Empty key-value table |
| 12 | Add key `_limit`, value `5` | URL bar updates to `...posts/1?_limit=5` |
| 13 | Type `?foo=bar` into the URL bar | Params table updates to show `foo=bar` |
| 14 | Uncheck a param row's checkbox | That param is excluded from the URL |

---

### 4.4 Request Headers

| # | Action | Expected Result |
|---|--------|----------------|
| 15 | Click the **Headers** sub-tab in the request builder | Empty key-value table |
| 16 | Add `X-Custom-Header` / `hello` | Header count badge on the tab shows `1` |
| 17 | Click **Send** | Response from server includes the header (visible in httpbin.org's `headers` field) |

---

### 4.5 Request Body

| # | Action | Expected Result |
|---|--------|----------------|
| 18 | Open a new tab; set method to **POST**; URL to `https://jsonplaceholder.typicode.com/posts` | — |
| 19 | Click the **Body** sub-tab → select **raw** → choose **JSON** from the language dropdown | Textarea appears |
| 20 | Paste `{"title":"test","body":"hello","userId":1}` | Text shown in textarea |
| 21 | Click **Beautify** | JSON is pretty-printed with 2-space indentation |
| 22 | Click **Send** | Response is `201 Created` with `{"id": 101, ...}` |

---

### 4.6 Authorization

| # | Action | Expected Result |
|---|--------|----------------|
| 23 | Click the **Authorization** sub-tab | Auth type selector sidebar visible |
| 24 | Select **Bearer Token**; enter `my-secret-token` | Preview shows `Authorization: Bearer my-secret-token` |
| 25 | Send to `https://httpbin.org/bearer` | Response shows `{"authenticated": true, "token": "my-secret-token"}` |
| 26 | Switch to **Basic Auth**; enter username `user`, password `pass` | Preview shows Base64-encoded header |

---

### 4.7 Collections

| # | Action | Expected Result |
|---|--------|----------------|
| 27 | Click **+** in the Collections header | Inline text input appears |
| 28 | Type `My Collection` and press Enter | New collection appears in the list |
| 29 | Right-click the new collection | Context menu: Add Request, Rename, Delete |
| 30 | Click **Rename**; type `My API`; press Enter | Collection name updates inline |
| 31 | Click the collection to expand it | Shows no requests yet |
| 32 | With a request tab open, click **Save** | SaveRequestModal opens with name input + collection dropdown |
| 33 | Pick `My API`; click **Save Request** | Request appears under `My API` in the sidebar; tab name updates; dirty dot disappears |
| 34 | Click the saved request in the sidebar | Opens in a new tab with all fields pre-filled; `isDirty` is `false` |
| 35 | Right-click the saved request → **Delete** | ConfirmDelete modal appears; confirm → request removed |
| 36 | Right-click `My API` → **Delete** | ConfirmDelete modal; confirm → collection and all children removed |

---

### 4.8 Environments & Variable Resolution

| # | Action | Expected Result |
|---|--------|----------------|
| 37 | Click the environment dropdown in the top bar | Shows "No Environment" + seeded environments |
| 38 | Click **Manage Environments** | ManageEnvironmentsModal opens |
| 39 | Select **JSONPlaceholder Env** in the left panel | Variables panel shows `baseUrl = https://jsonplaceholder.typicode.com` |
| 40 | Add a new variable: key `userId`, value `2`; click **Save** | Toast "Environment saved"; variable persists on re-open |
| 41 | Click **Add Environment**; name it `Staging`; click Save | New environment listed |
| 42 | Delete `Staging` via the × icon | ConfirmDelete → environment removed |
| 43 | Close the modal; select **JSONPlaceholder Env** from the dropdown | Environment indicator shows "JSONPlaceholder Env" |
| 44 | Open the `List users` request from the **Variable Demo** collection | Tab shows URL `{{baseUrl}}/users` |
| 45 | Click **Send** | URL resolves to `https://jsonplaceholder.typicode.com/users`; response is `200 OK` |
| 46 | Change dropdown back to **No Environment**; click Send again | Request is sent with literal `{{baseUrl}}/users`; likely connection error or server 404 |

---

### 4.9 History

| # | Action | Expected Result |
|---|--------|----------------|
| 47 | Switch to the **History** tab in the sidebar | Shows all sent requests grouped by Today / Yesterday / Older |
| 48 | Type `POST` in the search bar | Filters to only POST entries |
| 49 | Clear the search (× button) | All entries reappear |
| 50 | Click any history entry | Opens a new pre-filled tab with the full request (URL, headers, body, auth all restored) |
| 51 | Hover over an entry; click the × icon | Entry is deleted; toast confirms; list refreshes |
| 52 | Click **Clear All** | ConfirmDelete modal; confirm → History tab shows empty state |

---

### 4.10 Tab Management

| # | Action | Expected Result |
|---|--------|----------------|
| 53 | Open 5+ tabs via the **+** button | Tab bar scrolls horizontally; all tabs accessible |
| 54 | Make an edit in a tab (change URL) | Small orange dot appears on the tab to indicate unsaved changes |
| 55 | Click the **×** on a dirty (unsaved) tab | Dialog: "Unsaved Changes" with **Save**, **Discard**, **Cancel** buttons |
| 56 | Click **Cancel** | Dialog closes; tab remains open |
| 57 | Click **×** again → **Discard** | Tab closes without saving |
| 58 | Click **×** on a clean (saved) tab | Tab closes immediately with no dialog |

---

### 4.11 API Endpoint Verification (via Swagger UI)

Open `http://localhost:8000/docs` and verify these work interactively:

| Endpoint | Method | Expected status |
|----------|--------|----------------|
| `/health` | GET | 200 |
| `/api/collections` | GET | 200, returns 3 seeded collections |
| `/api/collections` | POST `{"name":"Test"}` | 201 |
| `/api/environments` | GET | 200, returns 2 seeded environments |
| `/api/environments/{id}/variables` | GET | 200, returns variables |
| `/api/history` | GET | 200, returns full history entries |
| `/runner/send` | POST (sample body) | 200 or error response; always logs to history |

---

### 4.12 Seed Idempotency

```bash
# Stop the backend (Ctrl+C), then restart it
uvicorn app.main:app --reload --port 8000

# Check collections count — should still be 3, not 6
curl http://localhost:8000/api/collections
```

Expected: still 3 collections. The seed skips if any collection exists.

---

## 5. Known Limitations

| Item | Detail |
|------|--------|
| Single user | No login; all data is shared in one SQLite file |
| No file upload | `multipart/form-data` with file fields is a text-only placeholder |
| External connectivity required | The runner proxies requests outward — some test URLs (httpbin.org, jsonplaceholder) need internet access |
| Variable keys not resolved | Only variable *values* are substituted, not key names in params/headers |
| Pre-request Script / Tests | Render a read-only "Coming Soon" placeholder editor |
