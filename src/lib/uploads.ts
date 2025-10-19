import { writeFile } from "fs/promises";
import path from "path";

export async function handleFileUpload(file: File) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "images");

  const filename = `${file.name}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await writeFile(path.join(uploadDir, filename), buffer);

  const imagePath = `public/uploads/images/${filename}`;

  return imagePath;
}
