# My Blog App - Project Guide

This document serves as a contextual guide for AI development assistants (like Claude) to understand the architecture, code style, and critical logic of this full-stack blog application.

---

## 🚀 Architecture Overview
- **Frontend**: React (TypeScript), Vite, React Router DOM
- **Backend**: Node.js, Express, `pg` (PostgreSQL client)
- **Database**: PostgreSQL (tables: `blog_posts`, `blog_tags`, `blog_post_tags`)
- **Authentication**: JWT-based token stored in `localStorage` (`verifyToken` middleware)

## 🛠️ Commands & Scripts
### Frontend (`/frontend`)
- Development: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

### Backend (`/backend`)
- Development: `npm start` (or `node src/index.js`)

---

## 🏷️ Critical Feature Logics

### 1. Tag System Architecture
- **Database**: Many-to-Many via junction table `blog_post_tags (post_id, tag_id)`.
- **Saving Logic (UPSERT & Swap)**: 
  On post creation (`POST`) or updates (`PUT`), the backend deletes all existing relations for that `post_id` in `blog_post_tags`, registers new tags using `ON CONFLICT (name) DO UPDATE`, and re-inserts the junction rows.
- **Frontend Parsing**: 
  The backend might return tags as either string arrays `["React", "Go"]` or object arrays `[{id, name}]`. The frontend handles both formats gracefully using a parsing helper that maps inputs into a standard string array.

### 2. Smart Initial Filtering (The "#はじめに" Flow)
- **Requirement**: The blog must showcase guidelines/announcements tagged with `#はじめに` by default when a user first visits.
- **State Management**:
  - `selectedTag` is initialized from `sessionStorage.getItem('selected_blog_tag')`.
  - Default value: If `savedTag` is `'none'`, it maps to `null` (shows all posts). If no memory exists, it defaults to `'はじめに'`.
  - When the filter is manually cleared, `sessionStorage` records `'none'` so that navigating back or refreshing during the session retains the full-list view.

### 3. Pagination & Sorting
- **API**: Supports `?sort=published|updated&page=X&limit=5&tag=NAME&all=true`
- **Behavior**: Changing the sorting type or selecting/clearing tags resets the current page back to `1` safely.

---

## 🎨 Code Style & Preferences
- **Component Styling**: Standard JavaScript objects used as inline styles (e.g., `const styles = { wrapper: { ... } };`) with type-casting where necessary (`as const`).
- **Data Fetching**: Native `fetch` API inside React `useEffect` hooks.
- **State Flow**: Unidirectional state-driven UI. UI components should react purely to state changes (e.g., changing `sortBy` triggers API re-fetch instantly).
- **Security**: Always append `verifyToken` middleware on mutating routes (`POST`, `PUT`, `DELETE`).
- **Markdown Handling**: Content rendered via `<MarkdownViewer />`. Excerpts on lists are parsed through `stripMarkdown()`.