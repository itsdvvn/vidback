import { NextRequest, NextResponse } from "next/server";
import { refreshSignedUrl } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json();
    if (!videoUrl) {
      return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
    }

    const freshUrl = await refreshSignedUrl(videoUrl);
    return NextResponse.json({ videoUrl: freshUrl });
  } catch (err) {
    console.error("Failed to refresh video URL:", err);
    return NextResponse.json(
      { error: "Failed to refresh video URL" },
      { status: 500 },
    );
  }
}
