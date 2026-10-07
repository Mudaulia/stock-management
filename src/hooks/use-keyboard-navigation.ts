"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface UseKeyboardNavigationOptions<T> {
  /** Number of rows in the table */
  rowCount: number;
  /** Callback when a row is selected via keyboard */
  onRowSelect?: (index: number, rowData: T) => void;
  /** Callback when Enter/Space is pressed on a row */
  onRowActivate?: (index: number, rowData: T) => void;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
  /** Initial selected index */
  initialIndex?: number;
}

export interface UseKeyboardNavigationReturn<T> {
  /** Currently selected row index */
  selectedIndex: number;
  /** Set selected index programmatically */
  setSelectedIndex: (index: number) => void;
  /** Ref to attach to the table body or container */
  tableRef: React.RefObject<HTMLDivElement>;
  /** Whether a row is currently focused */
  isFocused: boolean;
}

/**
 * Hook for adding keyboard navigation to tables
 * Supports: Arrow Up/Down, Home, End, Enter, Space, Escape
 */
export function useKeyboardNavigation<T = unknown>({
  rowCount,
  onRowSelect,
  onRowActivate,
  onEscape,
  enabled = true,
  initialIndex = -1,
}: UseKeyboardNavigationOptions<T>): UseKeyboardNavigationReturn<T> {
  const [selectedIndex, setSelectedIndexState] = useState(initialIndex);
  const [isFocused, setIsFocused] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLTableRowElement[]>([]);
  const selectedIndexRef = useRef(selectedIndex);

  // Keep ref in sync with state
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  const setSelectedIndex = useCallback((index: number) => {
    if (index >= -1 && index < rowCount) {
      setSelectedIndexState(index);
      // Focus the row element if it exists
      if (index >= 0 && rowsRef.current[index]) {
        rowsRef.current[index].focus();
      }
    }
  }, [rowCount]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || rowCount === 0) return;

      const currentIndex = selectedIndexRef.current;

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          let nextIndex = currentIndex + 1;
          if (nextIndex >= rowCount) nextIndex = 0; // Wrap to first
          setSelectedIndex(nextIndex);
          if (onRowSelect && nextIndex >= 0) {
            // We need access to row data - this would need to be passed differently
            // For now, we'll just call with index
            onRowSelect(nextIndex, null as unknown as T);
          }
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          let nextIndex = currentIndex - 1;
          if (nextIndex < 0) nextIndex = rowCount - 1; // Wrap to last
          setSelectedIndex(nextIndex);
          if (onRowSelect && nextIndex >= 0) {
            onRowSelect(nextIndex, null as unknown as T);
          }
          break;
        }
        case "Home": {
          event.preventDefault();
          setSelectedIndex(0);
          if (onRowSelect && rowCount > 0) {
            onRowSelect(0, null as unknown as T);
          }
          break;
        }
        case "End": {
          event.preventDefault();
          setSelectedIndex(rowCount - 1);
          if (onRowSelect && rowCount > 0) {
            onRowSelect(rowCount - 1, null as unknown as T);
          }
          break;
        }
        case "Enter":
        case " ": {
          event.preventDefault();
          if (currentIndex >= 0 && onRowActivate) {
            onRowActivate(currentIndex, null as unknown as T);
          }
          break;
        }
        case "Escape": {
          if (onEscape) {
            onEscape();
          }
          // Clear selection on Escape
          setSelectedIndex(-1);
          break;
        }
        case "Tab": {
          // Allow normal tab behavior but track focus
          if (event.shiftKey) {
            // Shift+Tab - moving backwards
          }
          break;
        }
      }
    },
    [enabled, rowCount, onRowSelect, onRowActivate, onEscape, setSelectedIndex]
  );

  // Attach event listener to table container
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const handleKeyDownWrapper = (event: Event) => {
      handleKeyDown(event as KeyboardEvent);
    };
    table.addEventListener("keydown", handleKeyDownWrapper);
    return () => table.removeEventListener("keydown", handleKeyDownWrapper);
  }, [handleKeyDown]);

  // Track focus state
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const handleFocusIn = () => {
      setIsFocused(true);
    };
    const handleFocusOut = () => {
      setIsFocused(false);
    };

    table.addEventListener("focusin", handleFocusIn);
    table.addEventListener("focusout", handleFocusOut);

    return () => {
      table.removeEventListener("focusin", handleFocusIn);
      table.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return {
    selectedIndex,
    setSelectedIndex,
    tableRef,
    isFocused,
  };
}

/**
 * Hook for managing row selection with checkboxes
 */
export function useRowSelection<T extends { id: string }>() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) {
        return new Set();
      } else {
        return new Set(ids);
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const selectedCount = selectedIds.size;

  return {
    selectedIds,
    selectedCount,
    toggleRow,
    toggleAll,
    clearSelection,
    isSelected,
    setSelectedIds,
  };
}