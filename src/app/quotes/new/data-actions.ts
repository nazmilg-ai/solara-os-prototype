"use server";

import { Brand } from "@prisma/client";
import { getCategoriesForSupplier, getColoursByCategory, getCustomers, getFabricsByCategory } from "@/lib/queries";

export async function fetchCategoriesForSupplier(supplierId: string) {
  const categories = await getCategoriesForSupplier(supplierId);
  return categories.map((c) => ({ id: c.id, name: c.name }));
}

export async function fetchFabrics(categoryId: string) {
  const fabrics = await getFabricsByCategory(categoryId);
  return fabrics.map((f) => ({ id: f.id, name: f.name }));
}

export async function fetchColours(categoryId: string) {
  const colours = await getColoursByCategory(categoryId);
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
