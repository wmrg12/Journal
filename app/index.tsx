import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function Index() {

  const router = useRouter();

  useEffect(() => {
<<<<<<< HEAD
    router.replace("/tabs/home");
    router.replace("/login");
=======
    router.replace("/createDiary");
>>>>>>> origin/create-diary
  }, [router]); 
  return null;
}
