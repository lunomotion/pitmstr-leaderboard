/**
 * Event Documents API
 *
 * GET  /api/events/[eventId]/documents         - List documents for an event
 * POST /api/events/[eventId]/documents         - Upload a document (via Airtable attachment)
 * DELETE /api/events/[eventId]/documents?docId= - Delete a document
 *
 * Documents are stored as Airtable attachments on the Events table
 * in a "Documents" attachment field.
 */

import { NextRequest, NextResponse } from "next/server";
import Airtable from "airtable";

function getBase(): Airtable.Base {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) throw new Error("Airtable not configured");
  return new Airtable({ apiKey }).base(baseId);
}

interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// GET: List documents
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const base = getBase();

    const record = await base("Events").find(eventId);
    const attachments = (record.get("Documents") as AirtableAttachment[]) || [];

    const documents = attachments.map((att) => ({
      id: att.id,
      name: att.filename,
      type: inferDocType(att.filename),
      url: att.url,
      uploadedAt: record._rawJson.createdTime,
      size: formatSize(att.size),
    }));

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST: Upload document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const docType = (formData.get("type") as string) || "other";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    const base = getBase();

    // Get existing attachments
    const record = await base("Events").find(eventId);
    const existing = (record.get("Documents") as AirtableAttachment[]) || [];

    // Convert file to base64 for Airtable upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "application/octet-stream";

    // Prefix filename with doc type for organization
    const prefixedName = `[${docType.toUpperCase()}] ${file.name}`;

    // Airtable wants the existing attachment URLs + new upload
    const updatedAttachments = [
      ...existing.map((att) => ({ url: att.url })),
      {
        url: `data:${mimeType};base64,${base64}`,
        filename: prefixedName,
      },
    ];

    await base("Events").update(eventId, {
      Documents: updatedAttachments as unknown as Airtable.FieldSet[keyof Airtable.FieldSet],
    } as Partial<Airtable.FieldSet>);

    // Fetch updated record to get the new attachment with ID
    const updated = await base("Events").find(eventId);
    const newAttachments = (updated.get("Documents") as AirtableAttachment[]) || [];
    const newDoc = newAttachments[newAttachments.length - 1];

    return NextResponse.json({
      success: true,
      data: {
        id: newDoc?.id || Date.now().toString(),
        name: prefixedName,
        type: docType,
        url: newDoc?.url || "",
        uploadedAt: new Date().toISOString(),
        size: formatSize(file.size),
      },
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

// DELETE: Remove document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("docId");

    if (!docId) {
      return NextResponse.json(
        { success: false, error: "docId is required" },
        { status: 400 }
      );
    }

    const base = getBase();
    const record = await base("Events").find(eventId);
    const existing = (record.get("Documents") as AirtableAttachment[]) || [];

    // Filter out the deleted attachment
    const remaining = existing
      .filter((att) => att.id !== docId)
      .map((att) => ({ url: att.url }));

    const docValue = remaining.length > 0 ? remaining : [];
    await base("Events").update(eventId, {
      Documents: docValue as unknown as Airtable.FieldSet[keyof Airtable.FieldSet],
    } as Partial<Airtable.FieldSet>);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

function inferDocType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("[flyer]") || lower.includes("flyer")) return "flyer";
  if (lower.includes("[w9]") || lower.includes("w9") || lower.includes("w-9")) return "w9";
  if (lower.includes("[invoice]") || lower.includes("invoice")) return "invoice";
  if (lower.includes("[logistics]") || lower.includes("logistics") || lower.includes("risk"))
    return "logistics";
  if (lower.includes("[rules]") || lower.includes("rules")) return "rules";
  return "other";
}
