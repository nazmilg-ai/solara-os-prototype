import { CustomerForm } from "../CustomerForm";

export default function NewCustomerPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Customer</h1>
      <CustomerForm mode="create" />
    </div>
  );
}
