import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireStaff, canManageSettings } from "@/lib/auth";
import { getTeamMembers } from "@/features/team/actions";
import { TeamManagement } from "@/components/admin/team/team-management";

export const metadata: Metadata = { title: "Team" };

export default async function AdminTeamPage() {
  const user = await requireStaff();
  if (!user || !canManageSettings(user.role)) redirect("/admin/dashboard");

  const { members, invites } = await getTeamMembers();

  return (
    <TeamManagement
      currentUserId={user.id}
      initialMembers={JSON.parse(JSON.stringify(members))}
      initialInvites={JSON.parse(JSON.stringify(invites))}
    />
  );
}
