"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  School,
  GraduationCap,
  Trophy,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  events: number;
  teams: number;
  schools: number;
  students: number;
  loading: boolean;
  error: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    events: 0,
    teams: 0,
    schools: 0,
    students: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch events count
        const eventsRes = await fetch("/api/events");
        const eventsData = await eventsRes.json();

        setStats({
          events: eventsData.length || 0,
          teams: 0, // Would need API endpoint
          schools: 0, // Would need API endpoint
          students: 0, // Would need API endpoint
          loading: false,
          error: null,
        });
      } catch (err) {
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load stats",
        }));
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Events",
      value: stats.events,
      icon: Calendar,
      href: "/admin/events",
      color: "bg-americana-blue",
    },
    {
      label: "Teams",
      value: stats.teams,
      icon: Users,
      href: "/admin/teams",
      color: "bg-bbq-red",
    },
    {
      label: "Schools",
      value: stats.schools,
      icon: School,
      href: "/admin/charters",
      color: "bg-brisket-brown",
    },
    {
      label: "Students",
      value: stats.students,
      icon: GraduationCap,
      href: "/admin/students",
      color: "bg-success-green",
    },
  ];

  const quickActions = [
    { label: "Create Event", href: "/admin/events/new", icon: Calendar },
    { label: "Add Team", href: "/admin/teams/new", icon: Users },
    { label: "Register School", href: "/admin/charters/new", icon: School },
    { label: "View Turn-Ins", href: "/admin/turn-ins", icon: Trophy },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-3xl text-smoke-black">Dashboard</h1>
        <p className="text-medium-grey mt-1">
          Welcome to the NHSBBQA Admin Portal
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl border border-card-border p-5 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-medium-grey">{card.label}</p>
                <p className="text-3xl font-bold text-smoke-black mt-1">
                  {stats.loading ? (
                    <span className="inline-block w-12 h-8 bg-light-grey animate-pulse rounded" />
                  ) : (
                    card.value
                  )}
                </p>
              </div>
              <div
                className={`${card.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}
              >
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-card-border p-6">
        <h2 className="font-heading text-xl text-smoke-black mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-card-border hover:border-americana-blue hover:bg-americana-blue/5 transition-colors text-center"
            >
              <action.icon className="w-8 h-8 text-americana-blue" />
              <span className="text-sm font-medium text-smoke-black">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-card-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl text-smoke-black">
              Recent Activity
            </h2>
            <Clock className="w-5 h-5 text-medium-grey" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-success-green" />
              <span className="text-medium-grey">
                Activity feed coming soon...
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-card-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl text-smoke-black">
              Upcoming Events
            </h2>
            <TrendingUp className="w-5 h-5 text-medium-grey" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-americana-blue" />
              <span className="text-medium-grey">
                Event list coming soon...
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-americana-blue/5 border border-americana-blue/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-americana-blue/10 rounded-lg">
            <AlertCircle className="w-6 h-6 text-americana-blue" />
          </div>
          <div>
            <h3 className="font-semibold text-smoke-black">
              Getting Started
            </h3>
            <p className="text-sm text-medium-grey mt-1">
              This admin dashboard connects directly to your Airtable base.
              Changes made here will sync automatically. Use the sidebar to
              navigate between different data tables.
            </p>
            <Link
              href="/knowledge-base"
              className="inline-block mt-3 text-sm text-americana-blue hover:underline"
            >
              View Knowledge Base →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
