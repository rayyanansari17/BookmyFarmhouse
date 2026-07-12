import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action") || null;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  await connectDB();

  const matchStage = action ? [{ $match: { "activityLog.action": action } }] : [];

  const basePipeline = [
    { $unwind: "$activityLog" },
    ...matchStage,
  ];

  const [items, countResult] = await Promise.all([
    Property.aggregate([
      ...basePipeline,
      { $sort: { "activityLog.timestamp": -1 } },
      { $skip: offset },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "activityLog.performedBy",
          foreignField: "_id",
          as: "actorArr",
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          eventType: "$activityLog.action",
          note: "$activityLog.note",
          timestamp: "$activityLog.timestamp",
          actor: { $first: "$actorArr" },
        },
      },
    ]),
    Property.aggregate([
      ...basePipeline,
      { $count: "total" },
    ]),
  ]);

  const total = (countResult[0] as { total?: number } | undefined)?.total ?? 0;

  return NextResponse.json({ success: true, data: items, total });
}
