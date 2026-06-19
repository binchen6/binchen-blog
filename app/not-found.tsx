import Link from "next/link";
import { Home } from "lucide-react";
import { EmptyState, SiteShell } from "@/components/page-chrome";

export const runtime = "edge";

export default function NotFound() {
  return (
    <SiteShell>
      <section className="px-6 pb-20 pt-28">
        <EmptyState
          title="未找到这页"
          description="山径偶有岔路，回到首页继续慢慢走。"
          action={
            <Link href="/" className="btn-ink inline-flex items-center gap-2">
              <Home size={14} />
              返回首页
            </Link>
          }
        />
      </section>
    </SiteShell>
  );
}
