import { MagnifierIcon } from './icons';

/** Header search affordance. The popup itself lands with the search milestone (F4). */
export function SearchButton() {
  return (
    <button type="button" className="search-btn" aria-label="Search">
      <MagnifierIcon size={11} />
      <span>Search</span>
      <kbd className="search-kbd">/</kbd>
    </button>
  );
}
