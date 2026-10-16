// The API uses a self-signed certificate, so by default requests go through
// the Vite proxy ("/api" -> https://tdd.demo.reaktivate.com, see vite.config.ts).
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// The "[user]" part of https://tdd.demo.reaktivate.com/v1/books/[user]
export const API_USER = import.meta.env.VITE_API_USER || 'daniazhuk';
