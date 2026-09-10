"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** MiniPay stats are public at /minipay-stats — redirect from the old admin path. */
export default function AdminMinipayStatsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/minipay-stats");
  }, [router]);
  return (
    <p className="py-8 text-sm text-slate-400">Redirecting to public MiniPay stats…</p>
  );
}
