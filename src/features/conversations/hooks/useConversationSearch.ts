import {useCallback, useEffect, useRef} from 'react';
import {useConversationsStore} from '../store/conversationsStore';

const DEBOUNCE_MS = 300;

/** Recherche avec délai 300 ms ; minuteur annulé au démontage. */
export function useConversationSearch(): {
  searchQuery: string;
  searching: boolean;
  onSearchChange: (q: string) => void;
  clearSearch: () => void;
} {
  const searchQuery = useConversationsStore(s => s.searchQuery);
  const setSearchQuery = useConversationsStore(s => s.setSearchQuery);
  const search = useConversationsStore(s => s.search);
  const clearSearch = useConversationsStore(s => s.clearSearch);
  const searching = useConversationsStore(s => s.searching);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const onSearchChange = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (timer.current) clearTimeout(timer.current);
      if (q.trim().length < 1) {
        clearSearch();
        return;
      }
      timer.current = setTimeout(() => {
        fireSearch(search, q);
      }, DEBOUNCE_MS);
    },
    [setSearchQuery, clearSearch, search],
  );

  return {searchQuery, searching, onSearchChange, clearSearch};
}

function fireSearch(
  search: (q: string) => Promise<void>,
  q: string,
): void {
  search(q).catch(() => {
    /* */
  });
}
