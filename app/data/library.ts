import libraryBooks from "./library.json";

export type LibraryBook = {
  shelf: string;
  title: string;
  author: string;
  why: string;
  coverId?: string;
  buyLink?: string;
};

export const LIBRARY_BOOKS = libraryBooks as LibraryBook[];

// The shelves the Library room shows, in the order they appear on the page.
export const SHELF_ORDER = [
  "Personal Growth / Philosophy",
  "Business / Entrepreneurship",
  "Resilience",
  "Memoir / Travel / Culture",
] as const;

// The Infinite Bookshelf sheet names its shelves differently. This is the only
// place the two vocabularies meet: when syncing the sheet, translate each
// `Show on site` row's Shelf through this map before writing library.json. A
// sheet shelf that is missing here needs a decision, not a guess.
export const SHEET_SHELF_TO_SITE_SHELF: Record<string, string> = {
  "Personal growth / philosophy": "Personal Growth / Philosophy",
  "Business / entrepreneurship": "Business / Entrepreneurship",
  "Resilience / endurance": "Resilience",
  "Memoir / travel / culture": "Memoir / Travel / Culture",
};
