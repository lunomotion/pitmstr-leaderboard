"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Upload,
  Trash2,
  Download,
  ArrowLeft,
  Loader2,
  Plus,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";

const DOC_TYPES = [
  { value: "flyer", label: "Event Flyer", icon: ImageIcon },
  { value: "w9", label: "W-9 Form", icon: FileSpreadsheet },
  { value: "invoice", label: "Invoice", icon: FileText },
  { value: "logistics", label: "Logistics / Risk Doc", icon: File },
  { value: "rules", label: "Competition Rules", icon: FileText },
  { value: "other", label: "Other", icon: File },
] as const;

type DocType = (typeof DOC_TYPES)[number]["value"];

interface EventDocument {
  id: string;
  name: string;
  type: DocType;
  url: string;
  uploadedAt: string;
  size?: string;
}

export default function EventDocumentsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [eventName, setEventName] = useState("");
  const [documents, setDocuments] = useState<EventDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<DocType>("flyer");

  useEffect(() => {
    async function load() {
      try {
        // Fetch event name
        const eventRes = await fetch(`/api/events/${eventId}`);
        const eventData = await eventRes.json();
        if (eventData.success && eventData.data) {
          setEventName(eventData.data.name);
        }

        // Fetch documents
        const docsRes = await fetch(`/api/events/${eventId}/documents`);
        const docsData = await docsRes.json();
        if (docsData.success) {
          setDocuments(docsData.data || []);
        }
      } catch {
        setError("Failed to load event data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", selectedType);
      formData.append("eventId", eventId);

      const res = await fetch(`/api/events/${eventId}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setDocuments((prev) => [...prev, data.data]);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed — please try again");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(docId: string) {
    try {
      const res = await fetch(`/api/events/${eventId}/documents?docId=${docId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch {
      setError("Failed to delete document");
    }
  }

  function getDocIcon(type: DocType) {
    const docType = DOC_TYPES.find((d) => d.value === type);
    const Icon = docType?.icon || File;
    return <Icon className="w-5 h-5" />;
  }

  function getDocLabel(type: DocType) {
    return DOC_TYPES.find((d) => d.value === type)?.label || type;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Event Documents</h1>
        <p className="text-slate-500 mt-1">
          {eventName || "Loading..."} — Manage flyers, W9s, invoices, and logistics documents
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Upload Document
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as DocType)}
            className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-americana-blue"
          >
            {DOC_TYPES.map((dt) => (
              <option key={dt.value} value={dt.value}>
                {dt.label}
              </option>
            ))}
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={handleUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-americana-blue text-white rounded-lg text-sm font-medium hover:bg-americana-blue/90 disabled:opacity-50 transition-all"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Uploading..." : "Choose File & Upload"}
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          Accepted: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (max 10MB)
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            Documents ({documents.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No documents uploaded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Upload flyers, W9s, and logistics docs above
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    {getDocIcon(doc.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-medium text-slate-500">
                        {getDocLabel(doc.type)}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                      {doc.size && (
                        <>
                          <span>·</span>
                          <span>{doc.size}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
