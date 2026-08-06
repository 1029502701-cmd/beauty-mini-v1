import type { CreatorApplyRequest, CreatorApplyResponse } from "@/types";

export async function applyCreator(req: Request, env: any): Promise<CreatorApplyResponse> {
  try {
    // For multipart/form-data upload (images)
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const name = formData.get("name") as string;
      const avatar = formData.get("avatar") as string;
      const platform = formData.get("platform") as string;
      const description = formData.get("description") as string;
      const styleTagsStr = formData.get("styleTags") as string;
      const faceImageUrl = formData.get("faceImageUrl") as string;
      const workImagesStr = formData.get("workImages") as string;

      const styleTags = JSON.parse(styleTagsStr);
      const workImages = JSON.parse(workImagesStr);

      return applyCreatorInternal(env, { name, avatar, platform, description, styleTags, faceImageUrl, workImages });
    } else {
      // For JSON content type
      const data = await req.json() as CreatorApplyRequest;
      return applyCreatorInternal(env, data);
    }
  } catch (error) {
    console.error("Error processing creator apply request:", error);
    throw error;
  }
}

async function applyCreatorInternal(env: any, request: CreatorApplyRequest): Promise<CreatorApplyResponse> {
  // Generate a unique creator ID
  const creatorId = "creator_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const createdAt = new Date().toISOString();

  // Insert into beauty_creators table
  await env.D1_DB.prepare(
"INSERT INTO beauty_creators (user_id, name, avatar, platform, description, style_tags, works, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).execute([
    "current_user_id",
    request.name,
    request.avatar,
    request.platform,
    request.description,
    JSON.stringify(request.styleTags),
    JSON.stringify(request.works),
    "pending",
    createdAt,
    createdAt
  ]);

  // Insert into beauty_creator_applications table
  await env.D1_DB.prepare(
"INSERT INTO beauty_creator_applications (creator_id, work_images, status, created_at) VALUES (?, ?, ?, ?)"
  ).execute([
    creatorId,
    JSON.stringify(request.workImages),
    "pending",
    createdAt
  ]);

  return {
    creatorId,
    status: "pending"
  };
}



