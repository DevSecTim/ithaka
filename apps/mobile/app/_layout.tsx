import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#f4efe6" },
          headerTintColor: "#2a2218",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#f4efe6" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Ithaka" }} />
        <Stack.Screen name="map" options={{ title: "Map", headerBackVisible: false }} />
        <Stack.Screen name="pin" options={{ title: "Place" }} />
      </Stack>
    </>
  );
}
