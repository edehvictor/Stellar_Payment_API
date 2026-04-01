"use client";

import { useMerchantApiKey } from "@/lib/merchant-store";
import { useState } from "react";
import CopyButton from "@/components/CopyButton";
import { toast } from "sonner";

export default function ApiKeysPage() {
  const storedApiKey = useMerchantApiKey();
  const [isRotating, setIsRotating] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const displayKey = storedApiKey
    ? revealed
      ? storedApiKey
      : storedApiKey.slice(0, 7) + "•".repeat(storedApiKey.length - 13) + storedApiKey.slice(-6)
    : "sk_••••••••••••••••••••••••";

  const handleRotate = async () => {
    if (!confirm("Rotate your API key? The old one will be invalidated immediately.")) return;
    setIsRotating(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/rotate-key`, {
        method: "POST",
        headers: { "x-api-key": storedApiKey || "" },
      });
      if (!res.ok) throw new Error("Rotation failed");
      toast.success("API key rotated. Update your integrations.");
    } catch {
      toast.error("Failed to rotate API key");
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#6B6B6B] mb-2">Security</p>
        <h1 className="text-4xl font-bold text-[#0A0A0A] tracking-tight">API Keys</h1>
        <p className="mt-2 text-sm font-medium text-[#6B6B6B]">
          Manage your secret keys to authenticate server-side requests.
        </p>
      </div>

      <div className="max-w-xl rounded-2xl border border-[#E8E8E8] bg-white p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">
              Live API Key
            </label>
            <button
              type="button"
              onClick={() => setRevealed(v => !v)}
              className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
            >
              {revealed ? "Hide" : "Reveal"}
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-hidden rounded-xl border border-[#E8E8E8] bg-[#F9F9F9] p-1 pl-4">
            <code className={`flex-1 truncate text-sm font-bold tracking-widest transition-colors ${revealed ? "text-[#0A0A0A]" : "text-[#E8E8E8]"}`}>
              {displayKey}
            </code>
            {revealed && storedApiKey && <CopyButton text={storedApiKey} />}
          </div>
          <p className="text-[10px] font-medium text-[#6B6B6B]">
            Pass this as the <code className="text-[#0A0A0A]">x-api-key</code> header on every API request.
          </p>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <p className="font-bold mb-1">Security Warning</p>
          <p className="text-yellow-700 text-xs leading-relaxed">
            Never share your secret API keys in publicly accessible areas like GitHub, client-side code, or public forums.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleRotate}
            disabled={isRotating}
            className="rounded-xl border border-red-200 bg-red-50 px-6 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            {isRotating ? "Rotating..." : "Rotate API Key"}
          </button>
        </div>
      </div>
    </div>
  );
}
