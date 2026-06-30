import UsersTable from "@/components/UsersTable";
import PageHeader from "@/components/PageHeader";
import { listUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await listUsers();
  const riders = users.filter((u) => u.role === "rider").length;
  const drivers = users.filter((u) => u.role === "driver").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Directory"
        icon="users"
        title="Users"
        subtitle={`${users.length} total · ${riders} riders · ${drivers} drivers`}
      />
      <UsersTable users={users} />
    </div>
  );
}
