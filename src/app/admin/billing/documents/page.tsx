"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  Loader2,
  Download,
} from "lucide-react";
import { VENDOR_DOC_TYPES } from "@/lib/types";
import type { VendorDocument } from "@/lib/types";

export default function VendorDocumentsPage() {
  const [docs, setDocs] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vendor-documents");
      const json = await res.json();
      if (json.success) setDocs(json.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Find uploaded doc for a given type
  const getDoc = (type: string) => docs.find((d) => d.type === type);

  const uploadedCount = VENDOR_DOC_TYPES.filter((t) => getDoc(t.type)).length;
  const totalCount = VENDOR_DOC_TYPES.length;
  const allUploaded = uploadedCount === totalCount;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/billing"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-americana-blue mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-americana-blue/10 rounded-xl">
              <FileText className="w-6 h-6 text-americana-blue" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Vendor Documents
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Payment package documents attached to every invoice — schools need these to process payment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDocs}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div
        className={`rounded-xl border p-4 flex items-start gap-3 ${
          allUploaded
            ? "bg-green-50 border-green-200"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        {allUploaded ? (
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p
            className={`font-medium ${
              allUploaded ? "text-green-900" : "text-amber-900"
            }`}
          >
            {uploadedCount} of {totalCount} documents uploaded
          </p>
          <p
            className={`text-sm mt-1 ${
              allUploaded ? "text-green-700" : "text-amber-700"
            }`}
          >
            {allUploaded
              ? "All vendor documents are ready. Every invoice payment package will include these files."
              : "Some documents are missing. Upload them in Airtable to include them in invoice payment packages."}
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-americana-blue/5 border border-americana-blue/20 rounded-xl p-5">
        <h2 className="font-semibold text-slate-900 mb-2">How it works</h2>
        <ol className="text-sm text-slate-700 space-y-1.5 list-decimal list-inside">
          <li>Upload each vendor document as a file attachment in the Airtable <strong>Vendor Documents</strong> table</li>
          <li>Set the Type field to match one of the 6 document types below</li>
          <li>Check &quot;Active&quot; to include the document in payment packages</li>
          <li>Schools can download the full package from any invoice with one click</li>
        </ol>
      </div>

      {/* Document slots */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VENDOR_DOC_TYPES.map((docType) => {
            const uploaded = getDoc(docType.type);
            return (
              <div
                key={docType.type}
                className={`bg-white rounded-2xl border p-5 transition-colors ${
                  uploaded
                    ? "border-green-200 bg-green-50/30"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900">
                        {docType.label}
                      </h3>
                      {uploaded ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          <AlertCircle className="w-3 h-3" />
                          Missing
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {docType.description}
                    </p>
                  </div>
                </div>

                {uploaded ? (
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500 truncate flex-1">
                      {uploaded.fileName || "file.pdf"}
                    </span>
                    <a
                      href={uploaded.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-americana-blue bg-americana-blue/5 rounded-lg hover:bg-americana-blue/10 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      View
                    </a>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                      Not uploaded yet. Add this file to the Airtable Vendor Documents table.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Airtable link */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-slate-900">Manage in Airtable</p>
          <p className="text-sm text-slate-500 mt-0.5">
            Upload, update, or deactivate vendor documents directly in Airtable
          </p>
        </div>
        <a
          href="https://airtable.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-americana-blue rounded-xl hover:bg-americana-blue-light transition-colors"
        >
          Open Airtable
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
