export type GeoPlace = {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  countryCode: string;
};

const CACHE_KEY = "cinetribe_geo";

export function getCachedPlace(): GeoPlace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as GeoPlace) : null;
  } catch {
    return null;
  }
}

/** Ask the browser for a precise GPS fix, then turn it into city + country. */
export function detectPlace(): Promise<GeoPlace> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location isn't supported on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let city = "";
        let country = "";
        let countryCode = "";
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          );
          if (res.ok) {
            const j = await res.json();
            city = j.city || j.locality || j.principalSubdivision || "";
            country = j.countryName || "";
            countryCode = j.countryCode || "";
          }
        } catch {
          /* keep coordinates even if naming fails */
        }
        const place = { latitude, longitude, city, country, countryCode };
        localStorage.setItem(CACHE_KEY, JSON.stringify(place));
        resolve(place);
      },
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Location permission was denied. Allow it in your browser settings."
              : "Couldn't get your location. Try again.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

/** Distance between two points in km (haversine). */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
