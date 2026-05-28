import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET_NAME = "product-images";

function getSafeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "Please upload a valid image file." },
      { status: 400 }
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { message: "Only image files are allowed." },
      { status: 400 }
    );
  }

  const maxSizeInBytes = 5 * 1024 * 1024;

  if (file.size > maxSizeInBytes) {
    return NextResponse.json(
      { message: "Image size must be 5MB or less." },
      { status: 400 }
    );
  }

  const safeFileName = getSafeFileName(file.name);
  const filePath = `seller-branding/${Date.now()}-${safeFileName}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return NextResponse.json({
    message: "Seller image uploaded successfully.",
    imageUrl: data.publicUrl,
    filePath,
  });
}