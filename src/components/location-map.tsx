"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type LocationMapProps = {
  latitude: number;
  longitude: number;
  showMarker: boolean;
  onChange: (latitude: number, longitude: number) => void;
};

const DEFAULT_ZOOM = 14;

const markerIcon = L.divIcon({
  className: "",
  html: '<div class="h-4 w-4 rounded-full border-2 border-white bg-primary shadow-md"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function Recenter({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], Math.max(map.getZoom(), DEFAULT_ZOOM));
  }, [latitude, longitude, map]);

  return null;
}

function MapClickHandler({ onChange }: { onChange: LocationMapProps["onChange"] }) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export function LocationMap({ latitude, longitude, showMarker, onChange }: LocationMapProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={showMarker ? DEFAULT_ZOOM : 3}
      className="z-0 h-72 w-full rounded-lg border border-border"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter latitude={latitude} longitude={longitude} />
      <MapClickHandler onChange={onChange} />
      {showMarker ? (
        <Marker
          position={[latitude, longitude]}
          icon={markerIcon}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const marker = event.target as L.Marker;
              const position = marker.getLatLng();
              onChange(position.lat, position.lng);
            },
          }}
        />
      ) : null}
    </MapContainer>
  );
}
