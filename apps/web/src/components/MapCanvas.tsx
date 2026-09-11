"use client";

import type { Pin, Place } from "@/lib/types";
import { useRef } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const style = mapboxToken
  ? "mapbox://styles/mapbox/light-v11"
  : "https://tiles.openfreemap.org/styles/liberty";

export function MapCanvas({
  pins,
  selectedId,
  draft,
  onSelect,
  onDrop,
}: {
  pins: Pin[];
  selectedId: string | null;
  draft: Place | null;
  onSelect: (id: string) => void;
  onDrop: (lat: number, lng: number) => void;
}) {
  const mapRef = useRef<MapRef>(null);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ latitude: 20, longitude: 12, zoom: 1.7 }}
      mapStyle={style}
      attributionControl={false}
      style={{ width: "100%", height: "100%" }}
      onClick={(event) => {
        if (event.features?.length) return;
        const { lng, lat } = event.lngLat;
        onDrop(lat, lng);
      }}
    >
      <NavigationControl position="bottom-right" />
      {pins.map((pin) => (
        <Marker key={pin.id} latitude={pin.lat} longitude={pin.lng} anchor="center">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(pin.id);
            }}
            title={pin.placeName}
            style={{
              width: pin.status === "visited" ? 36 : 22,
              height: pin.status === "visited" ? 36 : 22,
              borderRadius: "50%",
              border: pin.status === "visited" ? "2px solid var(--cream)" : "2px dashed var(--sea)",
              background:
                pin.status === "visited" && pin.coverUrl
                  ? `center / cover url(${pin.coverUrl})`
                  : pin.status === "visited"
                    ? "var(--terracotta)"
                    : "transparent",
              boxShadow: selectedId === pin.id ? "0 0 0 4px rgba(196, 92, 62, 0.35)" : "0 4px 12px rgba(42,34,24,0.2)",
              transform: selectedId === pin.id ? "scale(1.15)" : "scale(1)",
              padding: 0,
            }}
          />
        </Marker>
      ))}
      {draft && (
        <Marker latitude={draft.lat} longitude={draft.lng} anchor="center">
          <span
            style={{
              display: "block",
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "var(--ink)",
              boxShadow: "0 0 0 6px rgba(42,34,24,0.15)",
            }}
          />
        </Marker>
      )}
    </Map>
  );
}
