import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const posts = await prisma.post.findMany({
    take: 10,
  });

  console.log(posts);
  return NextResponse.json(posts);
}
