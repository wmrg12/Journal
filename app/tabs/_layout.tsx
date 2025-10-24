
import { Tabs } from "expo-router";
import PillTabBar from "@/components/pillTabBar";

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <PillTabBar {...props} />} screenOptions={{ headerShown: false }} />
  );
}
