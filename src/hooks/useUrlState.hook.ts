// Create: src/hooks/useUrlState.hook.ts
import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { CommonPaginationPageSizeOptionsType } from '@TypesAndConstants/common.constants';

interface UseUrlStateConfig<T = any> {
  // Tab configuration
  tab?: {
    key?: string; // URL param key, defaults to 'tab'
    defaultValue: T;
    validValues?: T[]; // Valid tab values
  };
  
  // Search configuration
  search?: {
    key?: string; // URL param key, defaults to 'search'
    defaultValue?: string | null;
  };
  
  // Page size configuration
  pageSize?: {
    key?: string; // URL param key, defaults to 'pageSize'
    defaultValue: CommonPaginationPageSizeOptionsType;
    validValues?: CommonPaginationPageSizeOptionsType[]; // Valid page sizes like [10, 25, 50, 100]
  };
  
  // Generic filters configuration
  filters?: {
    [key: string]: {
      defaultValue: any;
      serialize?: (value: any) => string; // How to convert to URL
      deserialize?: (value: string) => any; // How to convert from URL
    };
  };
  
  // Options
  replace?: boolean; // Use replace instead of push for navigation
}

interface UseUrlStateReturn<T = any> {
  // Tab state
  activeTab: T;
  setActiveTab: (tab: T) => void;
  
  // Search state
  searchText: string | null;
  setSearchText: (search: string | null) => void;
  
  // Page size state
  pageSize: CommonPaginationPageSizeOptionsType;
  setPageSize: (size: CommonPaginationPageSizeOptionsType) => void;
  
  // Filter state
  filters: { [key: string]: any };
  setFilter: (key: string, value: any) => void;
  setFilters: (filters: { [key: string]: any }) => void;
  clearFilters: () => void;
  
  // Utility functions
  resetAll: () => void;
  updateUrl: (updates: { [key: string]: any }) => void;
}

export function useUrlState<T = string>(config: UseUrlStateConfig<T>): UseUrlStateReturn<T> {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize states from URL or defaults
  const getInitialTab = (): T => {
    if (!config.tab) return null as T;
    
    const tabKey = config.tab.key || 'tab';
    const tabFromUrl = searchParams.get(tabKey) as T;
    
    if (config.tab.validValues && !config.tab.validValues.includes(tabFromUrl)) {
      return config.tab.defaultValue;
    }
    
    return tabFromUrl || config.tab.defaultValue;
  };
  
  const getInitialSearch = (): string | null => {
    if (!config.search) return null;
    
    const searchKey = config.search.key || 'search';
    return searchParams.get(searchKey) || config.search.defaultValue || null;
  };
  
  const getInitialPageSize = (): CommonPaginationPageSizeOptionsType => {
    if (!config.pageSize) return 10;
    
    const pageSizeKey = config.pageSize.key || 'pageSize';
    const pageSizeFromUrl = searchParams.get(pageSizeKey);
    
    if (pageSizeFromUrl) {
      const parsed = parseInt(pageSizeFromUrl) as CommonPaginationPageSizeOptionsType;
      if (config.pageSize.validValues && !config.pageSize.validValues.includes(parsed)) {
        return config.pageSize.defaultValue as CommonPaginationPageSizeOptionsType;
      }
      return parsed || config.pageSize.defaultValue as CommonPaginationPageSizeOptionsType;
    }
    
    return config.pageSize.defaultValue as CommonPaginationPageSizeOptionsType;
  };
  
  const getInitialFilters = (): { [key: string]: any } => {
    if (!config.filters) return {};
    
    const filters: { [key: string]: any } = {};
    
    Object.entries(config.filters).forEach(([key, filterConfig]) => {
      const urlValue = searchParams.get(key);
      if (urlValue && filterConfig.deserialize) {
        filters[key] = filterConfig.deserialize(urlValue);
      } else if (urlValue) {
        filters[key] = urlValue;
      } else {
        filters[key] = filterConfig.defaultValue;
      }
    });
    
    return filters;
  };
  
  // State management
  const [activeTab, setActiveTabState] = useState<T>(getInitialTab());
  const [searchText, setSearchTextState] = useState<string | null>(getInitialSearch());
  const [pageSize, setPageSizeState] = useState<CommonPaginationPageSizeOptionsType>(getInitialPageSize());
  const [filters, setFiltersState] = useState<{ [key: string]: any }>(getInitialFilters());
  
  // Update URL function
  const updateUrl = useCallback((updates: { [key: string]: any }) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value.toString());
      }
    });
    
    setSearchParams(newSearchParams, { replace: config.replace ?? true });
  }, [searchParams, setSearchParams, config.replace]);
  
  // Individual setters
  const setActiveTab = useCallback((tab: T) => {
    setActiveTabState(tab);
    if (config.tab) {
      const tabKey = config.tab.key || 'tab';
      updateUrl({ [tabKey]: tab });
    }
  }, [updateUrl, config.tab]);
  
  const setSearchText = useCallback((search: string | null) => {
    setSearchTextState(search);
    if (config.search) {
      const searchKey = config.search.key || 'search';
      updateUrl({ [searchKey]: search });
    }
  }, [updateUrl, config.search]);
  
  const setPageSize = useCallback((size: CommonPaginationPageSizeOptionsType) => {
    setPageSizeState(size);
    if (config.pageSize) {
      const pageSizeKey = config.pageSize.key || 'pageSize';
      updateUrl({ [pageSizeKey]: size });
    }
  }, [updateUrl, config.pageSize]);
  
  const setFilter = useCallback((key: string, value: any) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
    
    if (config.filters?.[key]) {
      const filterConfig = config.filters[key];
      const serializedValue = filterConfig.serialize ? filterConfig.serialize(value) : value;
      updateUrl({ [key]: serializedValue });
    }
  }, [updateUrl, config.filters]);
  
  const setFilters = useCallback((newFilters: { [key: string]: any }) => {
    setFiltersState(newFilters);
    
    if (config.filters) {
      const urlUpdates: { [key: string]: any } = {};
      Object.entries(newFilters).forEach(([key, value]) => {
        const filterConfig = config.filters![key];
        if (filterConfig) {
          urlUpdates[key] = filterConfig.serialize ? filterConfig.serialize(value) : value;
        }
      });
      updateUrl(urlUpdates);
    }
  }, [updateUrl, config.filters]);
  
  const clearFilters = useCallback(() => {
    if (!config.filters) return;
    
    const defaultFilters: { [key: string]: any } = {};
    const urlUpdates: { [key: string]: any } = {};
    
    Object.entries(config.filters).forEach(([key, filterConfig]) => {
      defaultFilters[key] = filterConfig.defaultValue;
      urlUpdates[key] = null; // This will delete from URL
    });
    
    setFiltersState(defaultFilters);
    updateUrl(urlUpdates);
  }, [updateUrl, config.filters]);
  
  const resetAll = useCallback(() => {
    if (config.tab) setActiveTab(config.tab.defaultValue);
    if (config.search) setSearchText(config.search.defaultValue || null);
    if (config.pageSize) setPageSize(config.pageSize.defaultValue);
    if (config.filters) clearFilters();
  }, [config, setActiveTab, setSearchText, setPageSize, clearFilters]);
  
  // Sync URL changes with state (for browser back/forward)
  useEffect(() => {
    // Update tab from URL
    if (config.tab) {
      const tabKey = config.tab.key || 'tab';
      const tabFromUrl = searchParams.get(tabKey) as T;
      if (tabFromUrl && (!config.tab.validValues || config.tab.validValues.includes(tabFromUrl))) {
        if (tabFromUrl !== activeTab) {
          setActiveTabState(tabFromUrl);
        }
      }
    }
    
    // Update search from URL
    if (config.search) {
      const searchKey = config.search.key || 'search';
      const searchFromUrl = searchParams.get(searchKey);
      if (searchFromUrl !== searchText) {
        setSearchTextState(searchFromUrl);
      }
    }
    
    // Update page size from URL
    if (config.pageSize) {
      const pageSizeKey = config.pageSize.key || 'pageSize';
      const pageSizeFromUrl = searchParams.get(pageSizeKey);
      if (pageSizeFromUrl) {
        const parsed = parseInt(pageSizeFromUrl) as CommonPaginationPageSizeOptionsType;
        if (!isNaN(parsed) && parsed !== pageSize) {
          if (!config.pageSize.validValues || config.pageSize.validValues.includes(parsed)) {
            setPageSizeState(parsed);
          }
        }
      }
    }
    
    // Update filters from URL
    if (config.filters) {
      const newFilters: { [key: string]: any } = {};
      let hasChanges = false;
      
      Object.entries(config.filters).forEach(([key, filterConfig]) => {
        const urlValue = searchParams.get(key);
        let filterValue;
        
        if (urlValue && filterConfig.deserialize) {
          filterValue = filterConfig.deserialize(urlValue);
        } else if (urlValue) {
          filterValue = urlValue;
        } else {
          filterValue = filterConfig.defaultValue;
        }
        
        newFilters[key] = filterValue;
        if (filters[key] !== filterValue) {
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setFiltersState(newFilters);
      }
    }
  }, [searchParams]); // Only depend on searchParams to avoid infinite loops
  
  return {
    activeTab,
    setActiveTab,
    searchText,
    setSearchText,
    pageSize,
    setPageSize,
    filters,
    setFilter,
    setFilters,
    clearFilters,
    resetAll,
    updateUrl,
  };
}