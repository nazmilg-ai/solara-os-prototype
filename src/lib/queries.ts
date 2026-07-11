import { prisma } from "@/lib/prisma";
import { Brand } from "@prisma/client";

export function getCategories() {
  return prisma.productCategory.findMany({ orderBy: { name: "asc" } });
}

export function getActiveSuppliers() {
  return prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } });
}

export function getAllSuppliers() {
  return prisma.supplier.findMany({ orderBy: { name: "asc" } });
}

export function getFabricsByCategory(categoryId: string) {
  return prisma.fabric.findMany({ where: { categoryId }, orderBy: { name: "asc" } });
}

export function getColoursByFabric(fabricId: string) {
  return prisma.colour.findMany({ where: { fabricId }, orderBy: { name: "asc" } });
}

export function getCustomers(brand?: Brand) {
  return prisma.customer.findMany({
    where: brand ? { brand } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export function getCustomer(id: string) {
  return prisma.customer.findUnique({ where: { id } });
}

export function getQuotes(brand?: Brand) {
  return prisma.quote.findMany({
    where: brand ? { brand } : undefined,
    include: { customer: true, lines: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getQuote(id: string) {
  return prisma.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      lines: { include: { supplier: true, category: true, fabric: true, colour: true } },
    },
  });
}
