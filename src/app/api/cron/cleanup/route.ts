import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Find all expired media
    const expiredMedia = await prisma.media.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Delete each expired image from storage and database
    for (const image of expiredMedia) {
      const fileName = `${image.slug}${getExtension(image.mimeType)}`;
      await supabase.storage.from("media").remove([fileName]);
      await prisma.media.delete({
        where: { id: image.id },
      });
    }

    return NextResponse.json({
      success: true,
      cleaned: expiredMedia.length,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Error during cleanup" },
      { status: 500 }
    );
  }
}

function getExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/ogg": ".ogv",
  };
  return extensions[mimeType] || "";
} 