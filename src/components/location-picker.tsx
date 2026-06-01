"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { LocateFixed } from "lucide-react";

const LocationMap = dynamic(() => import("@/components/location-map").then((mod) => mod.LocationMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-full items-center justify-center rounded-lg border border-border bg-background text-sm text-muted">
      Loading map...
    </div>
  ),
});

type Props = {
  defaultLatitude: number | null;
  defaultLongitude: number | null;
};

const FALLBACK_LATITUDE = 40.7128;
const FALLBACK_LONGITUDE = -74.006;

export function LocationPicker({ defaultLatitude, defaultLongitude }: Props) {
  const [latitude, setLatitude] = useState<number | null>(defaultLatitude);
  const [longitude, setLongitude] = useState<number | null>(defaultLongitude);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasLocation = latitude !== null && longitude !== null;
  const mapLatitude = latitude ?? FALLBACK_LATITUDE;
  const mapLongitude = longitude ?? FALLBACK_LONGITUDE;

  const updateLocation = (nextLatitude: number, nextLongitude: number) => {
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    setError(null);
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position.coords.latitude, position.coords.longitude);
        setLoading(false);
      },
      (geoError) => {
        setError(geoError.message || "Could not access location.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name="latitude" value={latitude ?? ""} />
      <input type="hidden" name="longitude" value={longitude ?? ""} />

      <LocationMap
        latitude={mapLatitude}
        longitude={mapLongitude}
        showMarker={hasLocation}
        onChange={updateLocation}
      />

      <p className="text-xs text-muted">
        {hasLocation
          ? "Drag the pin, click the map, or use your current location to adjust where quests are generated."
          : "Click the map or use your current location to set where quests are generated."}
      </p>

      <button
        type="button"
        onClick={requestLocation}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition hover:border-primary hover:text-primary"
      >
        <LocateFixed size={14} />
        {loading ? "Requesting location..." : "Use current location"}
      </button>

      <p className="text-sm text-muted">
        {hasLocation
          ? `Selected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          : "No location saved yet."}
      </p>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
