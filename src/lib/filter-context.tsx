'use client';

import { createContext, useContext, useState, useMemo, ReactNode, useCallback } from 'react';
import type { FilterState, TimesheetEntry } from './types';
import { useData } from './data-context';
import { filterEntries } from './calculations';

interface FilterContextValue {
  filters: FilterState;
  setFilters: (f: Partial<FilterState>) => void;
  resetFilters: () => void;
  filteredEntries: TimesheetEntry[];
  uniqueClients: string[];
  uniqueProjects: string[];
  uniqueResources: string[];
  selectedYear: number;
  selectedMonth: number;
  isAllTime: boolean;
}

// Default: show latest month in the data
const defaultFilters: FilterState = {
  dateFrom: '',
  dateTo: '',
  selectedMonth: '2025-12', // Latest month with data
  isAllTime: false,
  clients: [],
  projects: [],
  resources: [],
};

const FilterContext = createContext<FilterContextValue>({
  filters: defaultFilters,
  setFilters: () => {},
  resetFilters: () => {},
  filteredEntries: [],
  uniqueClients: [],
  uniqueProjects: [],
  uniqueResources: [],
  selectedYear: 2025,
  selectedMonth: 12,
  isAllTime: false,
});

export function FilterProvider({ children }: { children: ReactNode }) {
  const { data } = useData();
  const [filters, setFiltersState] = useState<FilterState>(defaultFilters);

  const setFilters = useCallback((partial: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const [selectedYear, selectedMonth] = useMemo(() => {
    const [y, m] = filters.selectedMonth.split('-').map(Number);
    return [y, m];
  }, [filters.selectedMonth]);

  const filteredEntries = useMemo(() => {
    if (!data) return [];

    let dateFrom = filters.dateFrom || undefined;
    let dateTo = filters.dateTo || undefined;

    // When a specific month is selected, derive date range from it
    if (!filters.isAllTime && filters.selectedMonth && !dateFrom && !dateTo) {
      const [y, m] = filters.selectedMonth.split('-');
      dateFrom = `${y}-${m}-01`;
      dateTo = `${y}-${m}-31`;
    }

    return filterEntries(data.entries, {
      dateFrom,
      dateTo,
      clients: filters.clients.length ? filters.clients : undefined,
      projects: filters.projects.length ? filters.projects : undefined,
      resources: filters.resources.length ? filters.resources : undefined,
    });
  }, [data, filters]);

  const uniqueClients = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.entries.map(e => e.client))].sort();
  }, [data]);

  const uniqueProjects = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.entries.map(e => e.project))].sort();
  }, [data]);

  const uniqueResources = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.entries.map(e => e.resource))].sort();
  }, [data]);

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        resetFilters,
        filteredEntries,
        uniqueClients,
        uniqueProjects,
        uniqueResources,
        selectedYear,
        selectedMonth,
        isAllTime: filters.isAllTime,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  return useContext(FilterContext);
}
