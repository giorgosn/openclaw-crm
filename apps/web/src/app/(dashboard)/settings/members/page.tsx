"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Trash2, Shield, User } from "lucide-react";

interface Member {
  id: string;
  userId: string;
  role: "admin" | "member";
  createdAt: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [addRole, setAddRole] = useState<"admin" | "member">("member");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function fetchMembers() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/workspace-members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/v1/workspace-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role: addRole }),
      });
      if (res.ok) {
        setEmail("");
        fetchMembers();
      } else {
        const data = await res.json();
        setError(data.error?.message ?? "Failed to add member");
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleChange(memberId: string, role: "admin" | "member") {
    const res = await fetch(`/api/v1/workspace-members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role } : m))
      );
    } else {
      const data = await res.json();
      setError(data.error?.message ?? "Failed to change role");
    }
  }

  async function handleRemove(memberId: string) {
    const res = await fetch(`/api/v1/workspace-members/${memberId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } else {
      const data = await res.json();
      setError(data.error?.message ?? "Failed to remove member");
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Members</h1>

      {/* Add member form */}
      <form onSubmit={handleAdd} className="flex items-end gap-3 mb-6">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">Add Member by Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={addRole}
          onChange={(e) => setAddRole(e.target.value as "admin" | "member")}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <Button type="submit" disabled={adding || !email.trim()}>
          {adding ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-1 h-4 w-4" />
          )}
          Add
        </Button>
      </form>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 underline hover:no-underline"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Members list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {member.userName?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="font-medium">{member.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.userEmail}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(
                          member.id,
                          e.target.value as "admin" | "member"
                        )
                      }
                      className="rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(member.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No members yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
