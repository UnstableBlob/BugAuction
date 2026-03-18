import { NextResponse } from "next/server";
import { getAllPowercards } from "@/lib/powercards";

export async function GET() {
  try {
    const powercards = getAllPowercards();
    return NextResponse.json({ powercards });
  } catch (error) {
    console.error("Error listing powercards:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
