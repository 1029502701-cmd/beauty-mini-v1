import type { Env } from '../../types';
import { ReportGenerator } from '../../../modules/beauty-ai/report-engine/generator';
import { BeautyReportRepository } from '../../../modules/beauty-ai/report-repository/repository';
import { ReportAccessService } from '../../../modules/beauty-ai/permission/report-access-service';

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const logs: string[] = [];
  
  try {
    const body = await request.json();
    const sessionId = request.headers.get('X-Session-Id') || '';
    logs.push('sessionId: ' + sessionId);
    
    const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
    logs.push('session: ' + (sessionRaw ? 'found' : 'NOT FOUND'));
    if (!sessionRaw) throw new Error('No session');
    
    const userId = JSON.parse(sessionRaw).userId;
    logs.push('userId: ' + userId);
    
    // Test ReportGenerator
    logs.push('Testing ReportGenerator...');
    const generator = new ReportGenerator();
    const report = await generator.generateV2(
      body.analysisId || 'test',
      body.faceMetrics || { faceShape: '鹅蛋脸', faceRatio: 0.8, eyeType: '杏眼', eyeSize: 0.5, noseRatio: 0.4, lipRatio: 0.3, jawType: '标准颌型', skinTone: '中性' },
      undefined,
      'first-look'
    );
    logs.push('generateV2 OK: ' + Object.keys(report).join(','));
    
    // Test D1 INSERT
    logs.push('Testing D1 INSERT...');
    const repo = new BeautyReportRepository(env.D1_DB);
    const result = await repo.createReport({
      userId,
      uploadId: body.analysisId || 'test',
      imageUrl: null,
      thumbnailUrl: null,
      reportLevel: 'first-look',
      reportJson: report,
      decisionAnswersJson: null,
    });
    logs.push('createReport OK: id=' + result.id);
    
    // Test report_access INSERT
    logs.push('Testing report_access...');
    const accessService = new ReportAccessService(env.D1_DB);
    const accessResult = await accessService.grantReportAccess(userId, result.id, 'first-look');
    logs.push('grantReportAccess: ' + JSON.stringify(accessResult));
    
    return new Response(JSON.stringify({ success: true, logs }), { status: 200 });
  } catch (err) {
    logs.push('ERROR: ' + String(err));
    logs.push('STACK: ' + (err instanceof Error ? err.stack : ''));
    return new Response(JSON.stringify({ success: false, logs, error: String(err) }), { status: 500 });
  }
}
