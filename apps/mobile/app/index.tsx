import { authClient } from "@/lib/auth";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { data, isPending } = authClient.useSession();
  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "#f4efe6" }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={data ? "/map" : "/login"} />;
}
