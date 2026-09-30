// lib/models.ts — server helpers for uploaded 3D models (Model3D).
// Used by the topic page (via WIRING_MODELS.md) and the 3D Studio admin.

import { prisma } from "@/lib/db";

export interface TopicModel {
  url: string;
}

/**
 * Return the uploaded model mapped to a topic, or null.
 * Only "ready" models count — uploads that failed or are still processing
 * never leak into the public topic page.
 */
export async function getModelForTopic(topicId: number): Promise<TopicModel | null> {
  if (!Number.isInteger(topicId) || topicId <= 0) return null;
  const model = await prisma.model3D.findUnique({
    where: { topicId },
    select: { filePath: true, status: true },
  });
  if (!model || model.status !== "ready") return null;
  return { url: model.filePath };
}
