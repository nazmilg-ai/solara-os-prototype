"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteQuote } from "@/app/quotes/actions";

export function DeleteQuoteButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="text-red-600 hover:underline text-sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this quote? This cannot be undone.")) return;
        startTransition(async () => {
          await deleteQuote(id);
          router.push("/quotes");
        });
      }}
    >
      Delete quote
    </button>
  );
}
