import { NextResponse } from "next/server";
import { getVendorDocuments } from "@/lib/airtable";

// GET /api/admin/vendor-documents — list all active vendor documents
export async function GET() {
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
