import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

export async function handleImageUpload(file: File): Promise<string> {
  try {
    // Validasi tipe file
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

    // Validasi ukuran file (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit");
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename dengan ekstensi .webp
    const fileName = `product_${uuidv4()}.webp`;

    // Path untuk menyimpan file
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");

    // Buat direktori jika belum ada
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);

    // Konversi ke WebP dengan sharp
    try {
      // Optimasi gambar: resize maksimal 1200px, kompresi WebP
      await sharp(buffer)
        .resize({
          width: 1200,
          height: 1200,
          fit: 'inside', // Maintain aspect ratio
          withoutEnlargement: true // Don't enlarge if smaller
        })
        .webp({
          quality: 80, // Kualitas 80% (optimal untuk web)
          effort: 6, // Kompresi maksimal
          lossless: false, // Lossy compression untuk ukuran lebih kecil
          alphaQuality: 80, // Kualitas transparansi jika ada
          nearLossless: false
        })
        .toFile(filePath);

      console.log(`✅ Gambar berhasil dikonversi ke WebP: ${fileName}`);

    } catch (sharpError: any) {
      console.error("Error konversi dengan sharp:", sharpError);
      
      // Fallback: simpan file asli jika sharp error
      console.log("⚠️  Fallback: Menyimpan file asli...");
      await writeFile(filePath, buffer);
    }

    // Return public URL
    return `/uploads/products/${fileName}`;
  } catch (error: any) {
    console.error("Image upload error:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}