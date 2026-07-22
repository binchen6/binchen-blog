"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/page-chrome";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useAuth } from "@/lib/client-auth";

/** /profile → 重定向到 /users/[username]，合并为统一用户主页 */
export default function ProfilePage() {
  useDocumentTitle("个人中心");
  const router = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (user?.username) {
      router.replace(`/users/${encodeURIComponent(user.username)}`);
    } else {
      router.replace("/login");
    }
  }, [user, ready, router]);

  return (
    <SiteShell>
      <section className="flex min-h-[60vh] items-center justify-center">
        <div className="ink-loading h-1 w-40" />
      </section>
    </SiteShell>
  );
}
