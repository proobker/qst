"use client";

import { useState } from "react";
import { LocateFixed } from "lucide-react";

type Props = {
  defaultLatitude: number | null;
  defaultLongitude: number | null;
};

export function LocationPicker({ defaultLatitude, defaultLongitude }: Props) {
  const [latitude, setLatitude] = useState<number | null>(defaultLatitude);
  const [longitude, setLongitude] = useState<number | null>(defaultLongitude);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
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
      <button
        type="button"
        onClick={requestLocation}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition hover:border-primary hover:text-primary"
      >
        <LocateFixed size={14} />
        {loading ? "Requesting location..." : "Use current location"}
      </button>
      <p className="text-sm text-muted">
        {latitude !== null && longitude !== null
          ? `Location enabled: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          : "No location saved yet."}
      </p>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
