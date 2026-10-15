import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";
// Registers the "User" model: populate("vendorId") throws MissingSchemaError on a cold
// serverless start if nothing else on this code path has loaded it.
import "@/lib/db/models/User.model";
import type { IProperty } from "@/types";

// Internal fields that must never reach public pages or public APIs:
// scraped contact details/source links and the admin activity log.
export const PUBLIC_PROPERTY_EXCLUDE = "-scrapedPhone -scrapedWebsite -activityLog";

// Mongoose lean() documents contain ObjectId/Date instances that can't be passed
// to client components; a JSON round-trip yields the same plain data the API returned.
function toPlain<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

/** A single approved listing by slug, with its vendor's public profile populated. */
export async function getPublicPropertyBySlug(slug: string): Promise<IProperty | null> {
  await connectDB();
  const property = await Property.findOne({ slug, status: "approved", isDeleted: false })
    .select(PUBLIC_PROPERTY_EXCLUDE)
    .populate("vendorId", "name email businessName profileImage about phone")
    .lean();
  return property ? toPlain<IProperty>(property) : null;
}

/** Top-rated approved listings for the home page. */
export async function getFeaturedProperties(limit = 4): Promise<IProperty[]> {
  await connectDB();
  const properties = await Property.find({ status: "approved", isDeleted: false })
    .select(`${PUBLIC_PROPERTY_EXCLUDE} -vendorId`)
    .sort({ rating: -1, createdAt: -1 })
    .limit(limit)
    .lean();
  return toPlain<IProperty[]>(properties);
}
