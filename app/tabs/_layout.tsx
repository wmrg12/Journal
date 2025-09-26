import { Tabs } from "expo-router";
import PillTabBar from "@/components/PillTabBar"; 
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <PillTabBar {...props} />}> </Tabs>
  );
}
