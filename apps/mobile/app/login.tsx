import { authClient } from "@/lib/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const result =
      mode === "signup"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message ?? "Could not sign you in");
      return;
    }
    router.replace("/map");
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: "center" }}>
      <Text style={{ fontSize: 32, fontStyle: "italic" }}>
        {mode === "signup" ? "Start a circle" : "Welcome back"}
      </Text>
      {mode === "signup" && (
        <TextInput
          placeholder="Your name"
          value={name}
          onChangeText={setName}
          style={field}
        />
      )}
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={field}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={field}
      />
      {error && <Text style={{ color: "#9e3f27" }}>{error}</Text>}
      <Pressable onPress={() => void submit()} style={button}>
        <Text style={{ color: "#fbf7f0", textAlign: "center" }}>{mode === "signup" ? "Create account" : "Sign in"}</Text>
      </Pressable>
      <Pressable onPress={() => setMode(mode === "signup" ? "login" : "signup")}>
        <Text style={{ textAlign: "center", color: "#5c5144" }}>
          {mode === "signup" ? "I already have an account" : "Create an account"}
        </Text>
      </Pressable>
    </View>
  );
}

const field = {
  borderWidth: 1,
  borderColor: "#d8ccb8",
  backgroundColor: "#fbf7f0",
  borderRadius: 12,
  padding: 12,
} as const;

const button = {
  backgroundColor: "#c45c3e",
  borderRadius: 999,
  padding: 14,
} as const;
