import type { Env } from '../../types';
import { ReportGenerator } from '../../../modules/beauty-ai/report-engine/generator';
import { BeautyReportRepository } from '../../../modules/beauty-ai/report-repository/repository';
import { ReportAccessService } from '../../../modules/beauty-ai/permission/report-access-service';
import { TokenService } from '../../../modules/token/token-service';
import type { ReportLevel } from '../../../modules/beauty-ai/report-engine/types';
import { extractSessionId } from '../../../lib/session';

interface AnalyzeRequest {
  analysisId?: string;
  reportLevel?: ReportLevel;
  faceMetrics?: Record<string, unknown>;
  imageUrl?: string;
  thumbnailUrl?: string;
  decisions?: {
    style?: "natural" | "refined" | "charismatic" | "individual";
    occasion?: "daily" | "date" | "workplace" | "photo";
    tolerance?: "conservative" | "normal" | "bold";
  };
}

export async function onRequestPost(context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  const { env, request } = context;

  let body: AnalyzeRequest;
  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return new Response(
      JSON.stringify({ error: "Request body must be valid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!body.analysisId) {
    return new Response(
      JSON.stringify({ error: "Field 'analysisId' is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const reportLevel: ReportLevel = body.reportLevel ?? 'first-look';

  const faceMetrics = body.faceMetrics
    ? (body.faceMetrics as unknown as import('../../../modules/beauty-ai/face-types').FaceMetrics)
    : null;

  if (!faceMetrics) {
    return new Response(
      JSON.stringify({ error: 'faceMetrics is required ¡ª run /api/beauty/analyze first' }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const sessionId = extractSessionId(request);
    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
    if (!sessionRaw) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired session' }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const resolvedUserId = JSON.parse(sessionRaw).userId;

    const tokenService = new TokenService(env.D1_DB);
    const reportAccessService = new ReportAccessService(env.D1_DB);

    if (reportLevel === 'beauty-pro') {
      const balance = await tokenService.getBalance(resolvedUserId);
      if (balance < 1) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Insufficient tokens. beauty-pro requires 1 token, balance: ' + balance,
            tokenRequired: 1,
            balance,
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      await tokenService.consume({
        userId: resolvedUserId,
        amount: 1,
        description: 'beauty-pro report generation',
      });
      console.log('[beauty/report] Consumed 1 token for beauty-pro, userId:', resolvedUserId);
    }

    const generator = new ReportGenerator();
    const report = await generator.generateV2(
      body.analysisId,
      faceMetrics as unknown as import('../../../modules/beauty-ai/types/beauty').BeautyFaceMetrics,
      undefined,
      reportLevel,
      body.decisions ? {
        style: body.decisions.style || "natural",
        occasion: body.decisions.occasion || "daily",
        tolerance: body.decisions.tolerance || "normal",
        submittedAt: new Date().toISOString(),
      } : undefined,
    );

    const repo = new BeautyReportRepository(env.D1_DB);
    const decisionAnswersJson = body.decisions ? JSON.stringify({
      style: body.decisions.style || "natural",
      occasion: body.decisions.occasion || "daily",
      tolerance: body.decisions.tolerance || "normal",
      submittedAt: new Date().toISOString(),
    }) : null;
    const result = await repo.createReport({
      userId: resolvedUserId,
      uploadId: body.analysisId,
      imageUrl: body.imageUrl ?? null,
      thumbnailUrl: body.thumbnailUrl ?? null,
      reportLevel,
      reportJson: report,
      decisionAnswersJson,
    });

    const accessResult = await reportAccessService.grantReportAccess(resolvedUserId, result.id, reportLevel);
    if (!accessResult.success) {
      console.error('[beauty/report] Failed to record report_access:', accessResult.error);
    }

    console.log('[beauty/report] Persisted V2 report:', result.id, 'level:', reportLevel, 'access:', accessResult.alreadyUnlocked ? 'already unlocked' : 'new');

    return new Response(
      JSON.stringify({ success: true, report, reportId: result.id, level: reportLevel, tokenCost: reportLevel === 'beauty-pro' ? 1 : 0 }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error('[beauty/report] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Report generation failed' }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
