import { useState } from "react";
import useSWR from "swr";
import { getProvinces, getCities, getBarangays } from "@/api/address";
import { LocationData } from "@/types/address";

const STATIC_OPTIONS = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false
};

export function usePhAddress() {
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string | null>(null);
  const [selectedCityCode, setSelectedCityCode] = useState<string | null>(null);

  // 1. Fetch Provinces
  const { 
    data: provinces, 
    isLoading: loadingProvinces 
  } = useSWR<LocationData[]>("ph-provinces", getProvinces, STATIC_OPTIONS);

  // 2. Fetch Cities
  // ✅ FIX: Explicitly type the arguments as [string, string]
  const { 
    data: cities, 
    isLoading: loadingCities 
  } = useSWR<LocationData[]>(
    selectedProvinceCode ? ["ph-cities", selectedProvinceCode] : null,
    ([, code]: [string, string]) => getCities(code), 
    STATIC_OPTIONS
  );

  // 3. Fetch Barangays
  // ✅ FIX: Explicitly type the arguments as [string, string]
  const { 
    data: barangays, 
    isLoading: loadingBarangays 
  } = useSWR<LocationData[]>(
    selectedCityCode ? ["ph-barangays", selectedCityCode] : null,
    ([, code]: [string, string]) => getBarangays(code),
    STATIC_OPTIONS
  );

  // --- HANDLERS ---

  const fetchCities = (provinceCode: string) => {
    setSelectedProvinceCode(provinceCode);
    setSelectedCityCode(null); 
  };

  const fetchBarangays = (cityCode: string) => {
    setSelectedCityCode(cityCode);
  };

  return {
    provinces: provinces || [],
    cities: cities || [],
    barangays: barangays || [],
    loadingProvinces,
    loadingCities,
    loadingBarangays,
    fetchCities,
    fetchBarangays,
  };
}