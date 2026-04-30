import imageCompression from "browser-image-compression";

const MAX_MB = 2;

/**
 * Compress an image to <= 2MB on the client. Non-image files pass through unchanged.
 * Falls back to the original file on any compression failure (we'd rather upload
 * something than block the user).
 */
export async function compressIfImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  // Skip tiny images
  if (file.size <= MAX_MB * 1024 * 1024) return file;
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: MAX_MB,
      maxWidthOrHeight: 2200,
      useWebWorker: true,
      initialQuality: 0.82,
    });
    // Preserve original filename so storage paths stay readable.
    return new File([compressed], file.name, { type: compressed.type || file.type });
  } catch (err) {
    console.warn("[compressImage] falling back to original:", err);
    return file;
  }
}
