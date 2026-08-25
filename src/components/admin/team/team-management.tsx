"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { UserPlusIcon, XIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  cancelInvite,
  getTeamMembers,
} from "@/features/team/actions";

type TeamData = Awaited<ReturnType<typeof getTeamMembers>>;
type Member = TeamData["members"][number];
type Invite = TeamData["invites"][number];

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  AUTHOR: "Author",
  CONTRIBUTOR: "Contributor",
  SUBSCRIBER: "Subscriber",
};

const ROLE_BADGE: Record<Role, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  EDITOR: "secondary",
  AUTHOR: "secondary",
  CONTRIBUTOR: "outline",
  SUBSCRIBER: "outline",
};

const INVITABLE_ROLES = [Role.ADMIN, Role.EDITOR, Role.AUTHOR, Role.CONTRIBUTOR] as const;
type InvitableRole = (typeof INVITABLE_ROLES)[number];

export function TeamManagement({
  currentUserId,
  initialMembers,
  initialInvites,
}: {
  currentUserId: string;
  initialMembers: Member[];
  initialInvites: Invite[];
}) {
  const [members, setMembers] = React.useState(initialMembers);
  const [invites, setInvites] = React.useState(initialInvites);
  const [pending, startTransition] = useTransition();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<InvitableRole>(Role.AUTHOR);

  function refresh() {
    startTransition(async () => {
      const data = await getTeamMembers();
      setMembers(data.members);
      setInvites(data.invites);
    });
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await inviteTeamMember({ email, role });
      if (result.success) {
        toast.success(`Invited ${email} as ${ROLE_LABEL[role]}`);
        setInviteOpen(false);
        setEmail("");
        setRole(Role.AUTHOR);
        refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRoleChange(userId: string, next: Role) {
    startTransition(async () => {
      const result = await updateTeamMemberRole(userId, next);
      if (result.success) {
        toast.success("Role updated");
        refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name}'s CMS access? Their posts stay published and attributed to them.`)) return;
    startTransition(async () => {
      const result = await removeTeamMember(userId);
      if (result.success) {
        toast.success("Access revoked");
        refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleCancelInvite(inviteId: string) {
    startTransition(async () => {
      const result = await cancelInvite(inviteId);
      if (result.success) {
        toast.success("Invite cancelled");
        refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-muted-foreground text-sm">
            Give teammates CMS access. Authors and contributors only see and manage their own posts.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlusIcon /> Invite teammate
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const isSelf = m.id === currentUserId;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.name ?? "—"} {isSelf && <span className="text-muted-foreground text-xs">(you)</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell>
                      {isSelf ? (
                        <Badge variant={ROLE_BADGE[m.role]}>{ROLE_LABEL[m.role]}</Badge>
                      ) : (
                        <Select
                          value={m.role}
                          onValueChange={(v) => handleRoleChange(m.id, v as Role)}
                          disabled={pending}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INVITABLE_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {ROLE_LABEL[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.author?._count.posts ?? 0}</TableCell>
                    <TableCell className="text-right">
                      {!isSelf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => handleRemove(m.id, m.name ?? m.email)}
                        >
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                    No team members yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_BADGE[inv.role]}>{ROLE_LABEL[inv.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={pending}
                        onClick={() => handleCancelInvite(inv.id)}
                        aria-label="Cancel invite"
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a teammate</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                required
                placeholder="teammate@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-muted-foreground text-[11px]">
                If they haven&apos;t signed in yet, this role applies automatically the first time they do.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as InvitableRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-[11px]">
                Authors and contributors can write and submit posts for review but only publish is reserved for
                editors and admins.
              </p>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2Icon className="animate-spin" />} Send invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
