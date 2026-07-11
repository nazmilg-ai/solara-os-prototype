"use server";

import { Brand } from "@prisma/client";
import { getColoursByFabric, getCustomers, getFabricsByCategory } from "@/lib/queries";

export async function fetchFabrics(categoryId: string) {
  const fabrics = await getFabricsByCategory(categoryId);
  return fabrics.map((f) => ({ id: f.id, name: f.name }));
}

export async function fetchColours(fabricId: string) {
  const colours = await getColoursByFabric(fabricId);
  return colours.map((c) => ({ id: c.id, name: c.name }));
}

export async function fetchCustomers(brand: Brand) {
  const customers = await getCustomers(brand);
  return customers.map((c) => ({
    id: c.id,
    accountNo: c.accountNo,
    name: `${c.firstName} ${c.lastName}`,
  }));
}
