import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId?: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const options = {
      folder: `bookmyfarmhouse/${folder}`,
      public_id: publicId,
      resource_type: "image" as const,
      transformation: [{ width: 1920, quality: "auto", fetch_format: "auto" }],
    };

    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
