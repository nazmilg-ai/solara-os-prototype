"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCustomer } from "@/app/customers/actions";

export function DeleteCustomerButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="text-red-600 hover:underline text-sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this customer? This cannot be undone.")) return;
        startTransition(async () => {
          await deleteCustomer(id);
          router.push("/customers");
        });
      }}
    >
      Delete customer
    </button>
  );
}
