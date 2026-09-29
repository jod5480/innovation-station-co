export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  city?: string;
  country?: string;
  countryCode?: string;
  updatedAt: number;
}

const KEY = "ct_gps_location";

export function getSavedLocation(): GeoLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GeoLocation) : null;
  } catch {
    return null;
  }
}

export function saveLocation(loc: GeoLocation) {
  localStorage.setItem(KEY, JSON.stringify(loc));
  window.dispatchEvent(new CustomEvent("ct-location", { detail: loc }));
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("Location isn't supported on this device."));
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      if (err.code === err.PERMISSION_DENIED)
        reject(new Error("Location permission denied. Allow location access in your browser settings."));
      else if (err.code === err.TIMEOUT) reject(new Error("Couldn't get your location in time. Try again."));
      else reject(new Error("Couldn't detect your location."));
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  });
}

async function reverseGeocode(lat: number, lon: number) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=12&addressdetails=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!r.ok) return {};
    const j = await r.json();
    const a = j.address ?? {};
    return {
      city: a.city || a.town || a.village || a.suburb || a.county || a.state_district || a.state,
      country: a.country,
      countryCode: (a.country_code || "").toUpperCase(),
    };
  } catch {
    return {};
  }
}

/** Ask the device for a precise GPS fix, resolve the city name, and cache it. */
export async function detectLocation(): Promise<GeoLocation> {
  const pos = await getPosition();
  const { latitude, longitude, accuracy } = pos.coords;
  const place = await reverseGeocode(latitude, longitude);
  const loc: GeoLocation = { latitude, longitude, accuracy, ...place, updatedAt: Date.now() };
  saveLocation(loc);
  return loc;
}

/** Great-circle distance in km. */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.max(100, Math.round(km * 10) * 100)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}
