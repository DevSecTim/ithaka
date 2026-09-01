import { api } from "@/lib/api";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";

type Pin = {
  id: string;
  placeName: string;
  status: "wishlist" | "visited";
  note?: string | null;
  wishes?: { name: string }[];
  trips?: Array<{
    id: string;
    note?: string | null;
    startDate?: string | null;
    photos: Array<{ id: string; url: string; caption?: string | null }>;
  }>;
};

export default function PinScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pin, setPin] = useState<Pin | null>(null);
  const [note, setNote] = useState("");

  async function load() {
    const { pin: next } = await api<{ pin: Pin }>(`/api/pins/${id}`);
    setPin(next);
    setNote(next.trips?.[0]?.note ?? next.note ?? "");
  }

  useEffect(() => {
    void load().catch(() => undefined);
  }, [id]);

  if (!pin) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        <Text>Opening this place…</Text>
      </View>
    );
  }

  const latest = pin.trips?.[0];

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={{ letterSpacing: 1.4, fontSize: 12, color: "#5c5144" }}>
        {pin.status.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 32 }}>{pin.placeName}</Text>
      {pin.status === "wishlist" && (
        <Pressable
          onPress={() => void api(`/api/pins/${pin.id}/visit`, { method: "POST", body: JSON.stringify({ note }) }).then(load)}
          style={{ backgroundColor: "#c45c3e", padding: 12, borderRadius: 999 }}
        >
          <Text style={{ color: "#fbf7f0", textAlign: "center" }}>We went</Text>
        </Pressable>
      )}
      {latest && (
        <>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Best bit?"
            multiline
            style={{ minHeight: 100, borderWidth: 1, borderColor: "#d8ccb8", borderRadius: 12, padding: 12, backgroundColor: "#fbf7f0" }}
          />
          <Pressable
            onPress={() => void api(`/api/trips/${latest.id}`, { method: "PATCH", body: JSON.stringify({ note }) }).then(load)}
          >
            <Text>Save the page</Text>
          </Pressable>
          {latest.photos.map((photo) => (
            <View key={photo.id}>
              <Image source={{ uri: photo.url.startsWith("http") ? photo.url : undefined }} style={{ width: "100%", height: 220, borderRadius: 16, backgroundColor: "#ebe3d4" }} />
              {photo.caption && <Text>{photo.caption}</Text>}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}
