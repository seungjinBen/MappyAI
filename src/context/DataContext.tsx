"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/axios';

interface DataContextType {
  placeList: any[];
  loading: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [placeList, setPlaceList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const { data } = await api.get('/places');
        setPlaceList(Array.isArray(data) ? data : (data?.content ?? []));
      } catch (e) {
        console.error("전역 데이터 로딩 실패:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  return (
    <DataContext.Provider value={{ placeList, loading }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);