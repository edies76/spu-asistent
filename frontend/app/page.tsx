"use client";

// Página raíz: decide el home según el rol del usuario autenticado.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe, homePorRol } from "@/lib/auth";
import { LoadingScreen } from "@/components/Feedback";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const u = await getMe();
      if (!u) {
        router.replace("/login");
        return;
      }
      router.replace(homePorRol(u.rol));
    })();
  }, [router]);

  return <LoadingScreen />;
}
