"use client";

import { useEffect, useState } from "react";
import {
  Search,
  GraduationCap,
  School,
  Users,
  Loader2,
  Mail,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  teamId: string;
  role?: string;
  email?: string;
  teamName?: string;
  schoolName?: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchStudents() {
    try {
      const res = await fetch("/api/students");
      const json = await res.json();
      if (json.success && json.data) {
        setStudents(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student) => {
    if (searchQuery === "") return true;
    const q = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(q) ||
      student.email?.toLowerCase().includes(q) ||
      student.teamName?.toLowerCase().includes(q) ||
      student.schoolName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">
            {students.length} registered student{students.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name, email, team, or school..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-americana-blue text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-americana-blue mb-3" />
            <p className="text-slate-500 text-sm">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <GraduationCap className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No students found</p>
            <p className="text-slate-400 text-sm mt-1">
              {searchQuery
                ? "Try adjusting your search"
                : "Students are managed in Airtable"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Team
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    School
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {student.name}
                          </p>
                          {student.role && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {student.role}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {student.teamName ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Users className="w-4 h-4" />
                          {student.teamName}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {student.schoolName ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <School className="w-4 h-4" />
                          {student.schoolName}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {student.email ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Mail className="w-4 h-4" />
                          {student.email}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Note */}
      {filteredStudents.length > 0 && (
        <p className="text-center text-sm text-slate-400">
          Showing {filteredStudents.length} of {students.length} students
        </p>
      )}
    </div>
  );
}
