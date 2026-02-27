"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle, Flame } from "lucide-react";

export default function CheckInPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const teamId = params.teamId as string;

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [teamName, setTeamName] = useState("");
  const [eventName, setEventName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function doCheckIn() {
      try {
        const res = await fetch("/api/scoring/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, teamId }),
        });

        const data = await res.json();

        if (data.success) {
          setTeamName(data.data?.teamName || "Team");
          setEventName(data.data?.eventName || "Event");
          setStatus("success");
        } else {
          setErrorMsg(data.error || "Check-in failed");
          setStatus("error");
        }
      } catch {
        setErrorMsg("Network error — please try again");
        setStatus("error");
      }
    }

    doCheckIn();
  }, [eventId, teamId]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-bbq-red mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-slate-900">Checking In...</h1>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Checked In!
            </h1>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-bbq-red" />
              <span className="text-lg font-semibold text-slate-700">{teamName}</span>
            </div>
            <p className="text-sm text-slate-500">{eventName}</p>
            <p className="text-xs text-slate-400 mt-4">
              {new Date().toLocaleString()}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Check-In Error
            </h1>
            <p className="text-sm text-red-600">{errorMsg}</p>
          </>
        )}
      </div>
    </div>
  );
}
