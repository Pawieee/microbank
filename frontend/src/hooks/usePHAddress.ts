// src/hooks/use-ph-address.ts
import { useState, useEffect } from "react";
import { getProvinces, getCities, getBarangays, LocationData } from "@/lib/api/address";

export function usePhAddress() {
  const [provinces, setProvinces] = useState<LocationData[]>([]);
  const [cities, setCities] = useState<LocationData[]>([]);
  const [barangays, setBarangays] = useState<LocationData[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  // 1. Initial Load: Provinces
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      const data = await getProvinces();
      setProvinces(data);
      setLoadingProvinces(false);
    };
    loadProvinces();
  }, []);

  // 2. Handler: Fetch Cities
  const fetchCities = async (provinceCode: string) => {
    if (!provinceCode) {
      setCities([]);
      return;
    }
    
    setLoadingCities(true);
    setCities([]);    // Clear previous cities
    setBarangays([]); // Clear previous barangays
    
    const data = await getCities(provinceCode);
    setCities(data);
    setLoadingCities(false);
  };

  // 3. Handler: Fetch Barangays
  const fetchBarangays = async (cityCode: string) => {
    if (!cityCode) {
      setBarangays([]);
      return;
    }

    setLoadingBarangays(true);
    setBarangays([]); // Clear previous barangays
    
    const data = await getBarangays(cityCode);
    setBarangays(data);
    setLoadingBarangays(false);
  };

  return {
    provinces,
    cities,
    barangays,
    loadingProvinces,
    loadingCities,
    loadingBarangays,
    fetchCities,
    fetchBarangays,
  };
}