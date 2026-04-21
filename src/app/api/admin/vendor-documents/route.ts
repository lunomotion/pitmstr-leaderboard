import { NextResponse } from "next/server";
import { getVendorDocuments } from "@/lib/airtable";
import { requirePermission, isAuthError } from "@/lib/auth";

// GET /api/admin/vendor-documents - list all active vendor documents
export async function GET() {
  const auth = await requirePermission("admin:access");
  if (isAuthError(auth)) return auth;

  try {
    const docs = await getVendorDocuments();
    return NextResponse.json({ success: true, data: docs });
  } catch (error) {
    console.error("Error fetching vendor documents:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vendor documents" },
      { status: 500 }
    );
  }
}
