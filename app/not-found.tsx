import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

export const runtime = "edge";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-paper">
      <Navigation />
      <section className="pt-24 pb-16 px-6 text-center">
        <div className="max-w-md mx-auto">
          <span className="text-xs text-stone tracking-widest uppercase mb-2 block">
            Not Found
          </span>
          <h1 className="font-serif-zh text-3xl font-bold tracking-wider mb-4">
            未找到这页
          </h1>
          <div className="w-16 h-px bg-ink/10 mx-auto mb-8" />
          <p className="text-sm text-ink-light leading-loose mb-8">
            山径偶有岔路，回到首页继续慢慢走。
          </p>
          <Link href="/" className="btn-ink inline-flex items-center">
            返回首页
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
