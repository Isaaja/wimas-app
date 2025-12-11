import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function handleImageUpload(file: File): Promise<string> {
  try {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "image/gif",
    ];
    if (!validTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only JPG, PNG, WebP, and GIF are allowed"
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `product_${uuidv4()}.${fileExtension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");

    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return `/uploads/products/${fileName}`;
  } catch (error: any) {
    console.error("Image upload error:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}
