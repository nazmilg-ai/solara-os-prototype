import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/queries";
import { CustomerForm } from "../CustomerForm";
import { DeleteCustomerButton } from "./DeleteCustomerButton";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {customer.firstName} {customer.lastName}
        </h1>
        <DeleteCustomerButton id={customer.id} />
      </div>
      <CustomerForm
        mode="edit"
        customerId={customer.id}
        initial={{
          accountNo: customer.accountNo,
          brand: customer.brand,
          firstName: customer.firstName,
          lastName: customer.lastName,
          doorNo: customer.doorNo ?? "",
          addressLine1: customer.addressLine1 ?? "",
          addressLine2: customer.addressLine2 ?? "",
          city: customer.city ?? "",
          county: customer.county ?? "",
          postcode: customer.postcode ?? "",
          telephoneNumber: customer.telephoneNumber ?? "",
          mobileNumber: customer.mobileNumber ?? "",
          email: customer.email ?? "",
          dateRegistered: customer.dateRegistered.toISOString().slice(0, 10),
          notes: customer.notes ?? "",
        }}
      />
    </div>
  );
}
