// src/api/address.ts
import { LocationData } from "@/types/address";

const API_BASE = "https://psgc.gitlab.io/api";

// Helper for sorting alphabetically
const sortByName = (a: LocationData, b: LocationData) => a.name.localeCompare(b.name);

export async function getProvinces(): Promise<LocationData[]> {
  const res = await fetch(`${API_BASE}/provinces/`);
  if (!res.ok) throw new Error("Failed to fetch provinces");
  const data = await res.json();
  return data.sort(sortByName);
}

export async function getCities(provinceCode: string): Promise<LocationData[]> {
  const res = await fetch(`${API_BASE}/provinces/${provinceCode}/cities-municipalities/`);
  if (!res.ok) throw new Error("Failed to fetch cities");
  const data = await res.json();
  return data.sort(sortByName);
}

export async function getBarangays(cityCode: string): Promise<LocationData[]> {
  const res = await fetch(`${API_BASE}/cities-municipalities/${cityCode}/barangays/`);
  if (!res.ok) throw new Error("Failed to fetch barangays");
  const data = await res.json();
  return data.sort(sortByName);
}