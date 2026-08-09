import type { Env } from '../../types';
import { ReportGenerator } from '../../../modules/beauty-ai/report-engine/generator';
import { BeautyReportRepository } from '../../../modules/beauty-ai/report-repository/repository';
import { ReportAccessService, DAILY_LIMITS } from '../../../modules/beauty-ai/permission/report-access-service';
import { TokenService } from '../../../modules/token/token-service';
import type { ReportLevel } from '../../../modules/beauty-ai/report-engine/types';
import { extractSessionId } from '../../../lib/session';
import type { BeautyFaceMetrics, BeautyFaceMetricsExtended } from '../../../modules/beauty-ai/types/beauty';

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
      JSON.stringify({ error: "Field analysisId is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const reportLevel: ReportLevel = body.reportLevel ?? 'first-look';

  // Merge all faceMetrics fields — includes both basic + extended (faceWidth, jawWidth, etc.)
  const raw = (body.faceMetrics || {}) as Record<string, unknown>;
  const faceMetrics: BeautyFaceMetrics & Partial<BeautyFaceMetricsExtended> = {
    faceShape: String(raw.faceShape || raw.faceType || '鹅蛋脸'),
    faceRatio: Number(raw.faceRatio ?? 0.8),
    eyeType: String(raw.eyeType || '杏眼'),
    eyeSize: Number(raw.eyeSize ?? 0),
    noseRatio: Number(raw.noseRatio ?? 0.4),
    lipRatio: Number(raw.lipRatio ?? 0.3),
    jawType: String(raw.jawType || '标准颌型'),
    skinTone: String(raw.skinTone || '中性'),
    // Extended metrics from PlaceholderDetector
    faceWidth: Number(raw.faceWidth ?? 128),
    faceHeight: Number(raw.faceHeight ?? 160),
    jawWidth: Number(raw.jawWidth ?? 96),
    chinLength: Number(raw.chinLength ?? 48),
    eyeWidth: Number(raw.eyeWidth ?? 24),
    noseWidth: Number(raw.noseWidth ?? 18),
    lipWidth: Number(raw.lipWidth ?? 30),
  };

  if (!faceMetrics.faceShape) {
    return new Response(
      JSON.stringify({ error: 'faceMetrics.faceShape is required' }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const sessionId = extractSessionId(request);
    console.log('[beauty/report] sessionId:', sessionId ? sessionId.slice(0, 8) + '...' : 'NULL');

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, status: "AUTH_REQUIRED", error: 'Authentication required' }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
    console.log('[beauty/report] sessionRaw:', sessionRaw ? 'found' : 'NOT FOUND');
    if (!sessionRaw) {
      return new Response(
        JSON.stringify({ success: false, status: "SESSION_EXPIRED", error: 'Invalid or expired session' }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const resolvedUserId = JSON.parse(sessionRaw).userId;
    console.log('[beauty/report] userId:', resolvedUserId, 'level:', reportLevel);

    const tokenService = new TokenService(env.D1_DB);
    const reportAccessService = new ReportAccessService(env.D1_DB);
    const tokenCost = reportLevel === 'beauty-pro' ? 1 : 0;

    if (reportLevel === 'beauty-pro') {
      const balance = await tokenService.getBalance(resolvedUserId);
      console.log('[beauty/report] token balance:', balance);
      if (balance < 1) {
        return new Response(
          JSON.stringify({ success: false, status: "INSUFFICIENT_TOKEN", error: 'Token不足，请先解锁', balance }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      await tokenService.consume({ userId: resolvedUserId, amount: 1, description: 'beauty-pro report generation' });
      console.log('[beauty/report] Consumed 1 token:', resolvedUserId);
    } else {
      const dailyLimit = DAILY_LIMITS[reportLevel as keyof typeof DAILY_LIMITS];
      console.log('[beauty/report] dailyLimit:', dailyLimit);
      const todayCount = await reportAccessService.getDailyAccessCount(resolvedUserId, reportLevel);
      console.log('[beauty/report] todayCount:', todayCount, 'limit:', dailyLimit);
      if (todayCount >= dailyLimit) {
        return new Response(
          JSON.stringify({ success: false, status: "DAILY_LIMIT_REACHED", error: '今日次数已用完，请明天再试', dailyLimit, todayCount }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    console.log('[beauty/report] Generating V2 report...');
    const generator = new ReportGenerator();
    const report = await generator.generateV2(
      body.analysisId,
      faceMetrics as unknown as BeautyFaceMetrics,
      undefined,
      reportLevel,
      body.decisions ? {
        style: body.decisions.style || "natural",
        occasion: body.decisions.occasion || "daily",
        tolerance: body.decisions.tolerance || "normal",
        submittedAt: new Date().toISOString(),
      } : undefined,
    );
    console.log('[beauty/report] generateV2 OK, keys:', Object.keys(report));

    console.log('[beauty/report] Saving to D1...');
    const repo = new BeautyReportRepository(env.D1_DB);
    const decisionAnswersJson = body.decisions
      ? JSON.stringify({
          style: body.decisions.style || "natural",
          occasion: body.decisions.occasion || "daily",
          tolerance: body.decisions.tolerance || "normal",
          submittedAt: new Date().toISOString(),
        })
      : null;

    const result = await repo.createReport({
      userId: resolvedUserId,
      uploadId: body.analysisId,
      imageUrl: body.imageUrl ?? null,
      thumbnailUrl: body.thumbnailUrl ?? null,
      reportLevel,
      reportJson: report,
      decisionAnswersJson,
    });
    console.log('[beauty/report] createReport OK, id:', result.id);

    console.log('[beauty/report] Granting access...');
    const accessResult = reportLevel === 'beauty-pro'
      ? await reportAccessService.recordAccess(resolvedUserId, result.id, reportLevel)
      : await reportAccessService.grantReportAccess(resolvedUserId, result.id, reportLevel);
    console.log('[beauty/report] accessResult:', accessResult.success, accessResult.alreadyUnlocked);

    if (!accessResult.success) {
      console.error('[beauty/report] Failed to record report_access:', accessResult.error);
      return new Response(
        JSON.stringify({ success: false, status: "ACCESS_FAILED", error: accessResult.error || 'Failed to record access' }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('[beauty/report] Complete! reportId:', result.id, 'level:', reportLevel);

    return new Response(
      JSON.stringify({ success: true, status: "REPORT_GENERATED", report, reportId: result.id, level: reportLevel, tokenCost }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error('[beauty/report] ERROR:', err);
    console.error('[beauty/report] STACK:', err instanceof Error ? err.stack : String(err));
    console.error('[beauty/report] ERR TYPE:', err instanceof Error ? err.constructor.name : typeof err);
    return new Response(
      JSON.stringify({ success: false, status: "SERVER_ERROR", error: '生成报告失败，请稍后重试' }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
