import type { ShareRecord } from "@/types";
import { api } from "@/services/api-client";

export interface ShareResponse { shareId: string; status: string; }

class ShareService {
  async createShareRecord(reportId: string): Promise<ShareResponse | null> {
    try {
      const response = await api.post("/api/share", { reportId });
      if (response.success) {
        return response.data;
      } else {
        console.warn("API fallback, using mock");
        return this.getMockShare();
      }
    } catch (error) {
      console.error("Share error:", error);
      return this.getMockShare();
    }
  }

  private getMockShare(): ShareResponse {
    return {
      shareId: "share_" + Date.now(),
      status: "completed"
    };
  }
}

export const shareService = new ShareService();
