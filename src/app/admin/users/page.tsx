"use client";

import { Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { Input, Select } from "@/components/ui/input";
import { ErrorAlert, EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { Table, Td, Th } from "@/components/ui/table";
import { api, ApiClientError, toQuery, type Paginated, type UserDto } from "@/lib/client";
import { useApi, useDebounced } from "@/lib/hooks";
import { cn, formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const me = useApi<{ user: { id: string } }>("/api/auth/me");
  const { data, loading, error, reload } = useApi<Paginated<UserDto>>(`/api/users${toQuery({ q, role, page, limit: 15 })}`);

  async function changeRole(user: UserDto, next: "student" | "admin") {
    if (!confirm(`Change ${user.name}'s role to ${next}?`)) return;
    try {
      await api(`/api/users/${user.id}`, { method: "PATCH", json: { role: next } });
      toast(`${user.name} is now ${next === "admin" ? "an admin" : "a student"}`);
      reload();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Update failed", "error");
    }
  }

  async function remove(user: UserDto) {
    if (!confirm(`Delete ${user.name}? Their enrollments and progress will be removed.`)) return;
    try {
      await api(`/api/users/${user.id}`, { method: "DELETE" });
      toast("User deleted");
      reload();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Delete failed", "error");
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Users" description="Students and admins registered on the platform." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-neutral-500" />
          <Input
            aria-label="Search users"
            placeholder="Search by name or email…"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="sm:w-48">
          <Select aria-label="Role" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
          </Select>
        </div>
      </div>

      {error && <ErrorAlert>{error}</ErrorAlert>}
      {loading && !data ? (
        <Skeleton className="h-96" />
      ) : data?.items.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        data && (
          <div className={cn(loading && "opacity-60")}>
            <Table>
              <thead>
                <tr>
                  <Th>User</Th>
                  <Th>Role</Th>
                  <Th>Enrollments</Th>
                  <Th>Completed</Th>
                  <Th>Joined</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => {
                  const isMe = u.id === me.data?.user.id;
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <Td>
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-medium text-white">
                              {u.name} {isMe && <span className="text-xs text-neutral-500">(you)</span>}
                            </p>
                            <p className="text-xs text-neutral-500">{u.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td className="w-36">
                        <select
                          aria-label={`Role for ${u.name}`}
                          value={u.role}
                          disabled={isMe}
                          onChange={(e) => changeRole(u, e.target.value as "student" | "admin")}
                          className="h-8 cursor-pointer rounded-md border border-white/10 bg-neutral-900 px-2 text-xs text-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                        </select>
                      </Td>
                      <Td>{u.enrollmentCount}</Td>
                      <Td>{u.completedCount}</Td>
                      <Td className="text-neutral-500">{formatDate(u.createdAt)}</Td>
                      <Td className="text-right">
                        {!isMe && (
                          <button onClick={() => remove(u)} title="Delete user" className="cursor-pointer rounded-md p-2 text-neutral-400 hover:bg-red-500/10 hover:text-red-400">
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onChange={setPage} />
          </div>
        )
      )}
    </div>
  );
}
