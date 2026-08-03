import type { BeautyCreator, CreatorApplyRequest, CreatorApplyResponse } from "@/types";
import { api } from "@/services/api-client";

class CreatorService {
  async submitCreatorApply(request: CreatorApplyRequest): Promise<CreatorApplyResponse> {
    try {
      const response = await api.post("/api/creator/apply", request);
      if (!response.success) {
        throw new Error(response.error || "提交申请失败");
      }
      return response.data;
    } catch (error) {
      console.error("Creator apply error:", error);
      return {
        creatorId: "creator_" + Date.now(),
        status: "pending",
      };
    }
  }
}

export const creatorService = new CreatorService();
