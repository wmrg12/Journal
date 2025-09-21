import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function Index() {

  const router = useRouter();

  useEffect(() => {
    router.replace("/tabs/home");
    router.replace("/login");
  }, [router]); 
  return null;
}
