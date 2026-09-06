import { NextResponse } from "next/server";
import {
  getActiveHeadOfOfficeSignatory,
  getAllSignatories,
  createSignatory,
  updateSignatory,
  setActiveHeadOfOffice,
  deleteSignatory,
  seedDefaultHeadOfOffice,
} from "@/lib/actions/signatory-actions";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";
    const headOfOfficeOnly = searchParams.get("headOfOffice") === "true";

    if (activeOnly || headOfOfficeOnly) {
      const res = await getActiveHeadOfOfficeSignatory();
      return NextResponse.json(res, { status: 200 });
    }

    const res = await getAllSignatories();
    if (!res.success) {
      return NextResponse.json({ message: res.error }, { status: 500 });
    }

    return NextResponse.json(res, { status: 200 });
  } catch (error: unknown) {
    console.error("Signatories GET error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch signatories.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as { role?: string })?.role;
    if (!session?.user || userRole !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === "seedDefault") {
      const res = await seedDefaultHeadOfOffice();
      if (!res.success) {
        return NextResponse.json({ message: res.error }, { status: 400 });
      }
      return NextResponse.json(res, { status: 200 });
    }

    const res = await createSignatory(body);
    if (!res.success) {
      return NextResponse.json({ message: res.error }, { status: 400 });
    }

    return NextResponse.json(res, { status: 201 });
  } catch (error: unknown) {
    console.error("Signatories POST error:", error);
    const message = error instanceof Error ? error.message : "Failed to create signatory.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as { role?: string })?.role;
    if (!session?.user || userRole !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, ...data } = body;

    if (!id) {
      return NextResponse.json({ message: "Signatory ID is required." }, { status: 400 });
    }

    if (action === "setActive") {
      const res = await setActiveHeadOfOffice(id);
      if (!res.success) {
        return NextResponse.json({ message: res.error }, { status: 400 });
      }
      return NextResponse.json(res, { status: 200 });
    }

    const res = await updateSignatory(id, data);
    if (!res.success) {
      return NextResponse.json({ message: res.error }, { status: 400 });
    }

    return NextResponse.json(res, { status: 200 });
  } catch (error: unknown) {
    console.error("Signatories PUT error:", error);
    const message = error instanceof Error ? error.message : "Failed to update signatory.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as { role?: string })?.role;
    if (!session?.user || userRole !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Signatory ID is required." }, { status: 400 });
    }

    const res = await deleteSignatory(id);
    if (!res.success) {
      return NextResponse.json({ message: res.error }, { status: 400 });
    }

    return NextResponse.json({ message: "Signatory deleted successfully." }, { status: 200 });
  } catch (error: unknown) {
    console.error("Signatories DELETE error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete signatory.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
