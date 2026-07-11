"use server";

import { Brand } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface CustomerInput {
  accountNo: string;
  brand: Brand;
  firstName: string;
  lastName: string;
  doorNo?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  telephoneNumber?: string;
  mobileNumber?: string;
  email?: string;
  dateRegistered?: string;
  notes?: string;
}

function clean(input: CustomerInput) {
  return {
    accountNo: input.accountNo.trim(),
    brand: input.brand,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    doorNo: input.doorNo?.trim() || null,
    addressLine1: input.addressLine1?.trim() || null,
    addressLine2: input.addressLine2?.trim() || null,
    city: input.city?.trim() || null,
    county: input.county?.trim() || null,
    postcode: input.postcode?.trim() || null,
    telephoneNumber: input.telephoneNumber?.trim() || null,
    mobileNumber: input.mobileNumber?.trim() || null,
    email: input.email?.trim() || null,
    dateRegistered: input.dateRegistered ? new Date(input.dateRegistered) : new Date(),
    notes: input.notes?.trim() || null,
  };
}

export async function createCustomer(input: CustomerInput) {
  if (!input.accountNo.trim()) return { ok: false as const, error: "Account No is required." };
  if (!input.firstName.trim() || !input.lastName.trim()) {
    return { ok: false as const, error: "First and last name are required." };
  }
  const existing = await prisma.customer.findUnique({ where: { accountNo: input.accountNo.trim() } });
  if (existing) return { ok: false as const, error: `Account No "${input.accountNo}" is already in use.` };

  const customer = await prisma.customer.create({ data: clean(input) });
  revalidatePath("/customers");
  return { ok: true as const, id: customer.id };
}

export async function updateCustomer(id: string, input: CustomerInput) {
  if (!input.accountNo.trim()) return { ok: false as const, error: "Account No is required." };
  if (!input.firstName.trim() || !input.lastName.trim()) {
    return { ok: false as const, error: "First and last name are required." };
  }
  const existing = await prisma.customer.findUnique({ where: { accountNo: input.accountNo.trim() } });
  if (existing && existing.id !== id) {
    return { ok: false as const, error: `Account No "${input.accountNo}" is already in use.` };
  }

  await prisma.customer.update({ where: { id }, data: clean(input) });
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { ok: true as const, id };
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
}
