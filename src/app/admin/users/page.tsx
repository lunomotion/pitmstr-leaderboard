"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search, ChevronDown, Check, Loader2, School } from "lucide-react";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/roles";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  role: Role | null;
  schoolId: string | null;
  stateId: string | null;
  createdAt: number;
  lastSignInAt: number | null;
}

const roleOptions = Object.entries(ROLES).map(([, value]) => ({
  value,
  label: ROLE_LABELS[value],
}));

function RoleDropdown({
  user,
  onRoleChange,
}: {
  user: User;
  onRoleChange: (userId: string, role: Role) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (role: Role) => {
    setSaving(true);
    setOpen(false);
    await onRoleChange(user.id, role);
    setSaving(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-all ${
          user.role
            ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            : "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300"
        }`}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <span>{user.role ? ROLE_LABELS[user.role] : "Assign Role"}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[220px]">
            {roleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>{option.label}</span>
                {user.role === option.value && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface SchoolOption {
  id: string;
  name: string;
  state: string;
}

function SchoolDropdown({
  user,
  schools,
  onSchoolChange,
}: {
  user: User;
  schools: SchoolOption[];
  onSchoolChange: (userId: string, schoolId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentSchool = schools.find((s) => s.id === user.schoolId);

  const handleSelect = async (schoolId: string) => {
    setSaving(true);
    setOpen(false);
    await onSchoolChange(user.id, schoolId);
    setSaving(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-all ${
          currentSchool
            ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
        }`}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <School className="w-3.5 h-3.5" />
            <span className="max-w-[140px] truncate">
              {currentSchool ? currentSchool.name : "Assign School"}
            </span>
            <ChevronDown className="w-3.5 h-3.5" />
          </>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[260px] max-h-64 overflow-y-auto">
            {schools.map((school) => (
              <button
                key={school.id}
                onClick={() => handleSelect(school.id)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="truncate">
                  {school.name}
                  {school.state && (
                    <span className="text-slate-400 ml-1">({school.state})</span>
                  )}
                </span>
                {user.schoolId === school.id && (
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 ml-2" />
                )}
              </button>
            ))}
            {schools.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400">No schools loaded</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [totalCount, setTotalCount] = useState(0);
  const [schools, setSchools] = useState<SchoolOption[]>([]);

  // Fetch schools list for the dropdown
  useEffect(() => {
    fetch("/api/schools")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSchools(data.data.map((s: SchoolOption) => ({ id: s.id, name: s.name, state: s.state })));
        }
      })
      .catch((err) => console.error("Failed to fetch schools:", err));
  }, []);

  const fetchUsers = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("limit", "100");

      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.data);
        setTotalCount(data.totalCount);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (data.success) {
        // Update local state
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role } : u))
        );
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const handleSchoolChange = async (userId: string, schoolId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId }),
      });

      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, schoolId } : u))
        );
      }
    } catch (error) {
      console.error("Failed to update school:", error);
    }
  };

  // Filter users by role
  const filteredUsers =
    filterRole === "all"
      ? users
      : filterRole === "pending"
        ? users.filter((u) => !u.role)
        : users.filter((u) => u.role === filterRole);

  const pendingCount = users.filter((u) => !u.role).length;

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-[var(--americana-blue)]" />
            User Management
          </h1>
          <p className="text-slate-500 mt-1">
            {totalCount} registered user{totalCount !== 1 ? "s" : ""}
            {pendingCount > 0 && (
              <span className="text-amber-600 font-medium">
                {" "}
                &middot; {pendingCount} pending approval
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--americana-blue)] focus:border-transparent"
          />
        </form>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--americana-blue)]"
        >
          <option value="all">All Roles</option>
          <option value="pending">Pending Approval</option>
          {roleOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Signed Up
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Last Sign In
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                    School
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-500">
                            {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {user.firstName} {user.lastName}
                          </p>
                          {!user.role && (
                            <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                              PENDING
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {user.lastSignInAt
                        ? new Date(user.lastSignInAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <SchoolDropdown
                        user={user}
                        schools={schools}
                        onSchoolChange={handleSchoolChange}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end">
                        <RoleDropdown
                          user={user}
                          onRoleChange={handleRoleChange}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
