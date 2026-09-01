import { api } from "@/lib/api";
import { authClient } from "@/lib/auth";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

type Circle = { id: string; name: string; members: { name: string }[] };
type Pin = {
  id: string;
  lat: number;
  lng: number;
  placeName: string;
  status: "wishlist" | "visited";
  coverUrl?: string | null;
};

export default function MapScreen() {
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [circleId, setCircleId] = useState<string | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    const { circles: next } = await api<{ circles: Circle[] }>("/api/circles");
    setCircles(next);
    const current = next[0];
    if (!current) return;
    setCircleId(current.id);
    const { pins: list } = await api<{ pins: Pin[] }>(`/api/circles/${current.id}/pins`);
    setPins(list);
  }, []);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function addCircle() {
    if (!name.trim()) return;
    await api("/api/circles", { method: "POST", body: JSON.stringify({ name }) });
    setName("");
    await load();
  }

  if (!circles.length) {
    return (
      <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: "center" }}>
        <Text style={{ fontSize: 28 }}>Where does this circle want to go?</Text>
        <Text style={{ color: "#5c5144" }}>Name a circle to open a blank map.</Text>
        <Pressable
          onPress={() => {
            setName("Just us");
            void api("/api/circles", { method: "POST", body: JSON.stringify({ name: "Just us" }) }).then(load);
          }}
          style={{ backgroundColor: "#c45c3e", padding: 14, borderRadius: 999 }}
        >
          <Text style={{ color: "#fbf7f0", textAlign: "center" }}>Create “Just us”</Text>
        </Pressable>
        <Pressable onPress={() => void addCircle()}>
          <Text style={{ textAlign: "center" }}>Or type a name in the next version — tap above to start.</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{ latitude: 20, longitude: 12, latitudeDelta: 80, longitudeDelta: 80 }}
        onLongPress={async (event) => {
          if (!circleId) return;
          const { latitude, longitude } = event.nativeEvent.coordinate;
          const { pin } = await api<{ pin: { id: string } }>(`/api/circles/${circleId}/pins`, {
            method: "POST",
            body: JSON.stringify({
              lat: latitude,
              lng: longitude,
              placeName: "Dropped pin",
              status: "wishlist",
            }),
          });
          router.push(`/pin/${pin.id}`);
          await load();
        }}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            title={pin.placeName}
            pinColor={pin.status === "visited" ? "#c45c3e" : "#3d6b6a"}
            onPress={() => router.push(`/pin/${pin.id}`)}
          />
        ))}
      </MapView>
      <View style={{ position: "absolute", top: 8, left: 12, right: 12, backgroundColor: "#fbf7f0", padding: 12, borderRadius: 16 }}>
        <Text style={{ fontWeight: "600" }}>{circles.find((c) => c.id === circleId)?.name}</Text>
        <Text style={{ color: "#5c5144" }}>Long-press the map to drop a wishlist pin.</Text>
        <Pressable
          onPress={async () => {
            await authClient.signOut();
            router.replace("/login");
          }}
        >
          <Text style={{ marginTop: 6 }}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
