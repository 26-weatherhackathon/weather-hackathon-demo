// api/reflect.js — Claude 리플렉션 피드백 (Build Spec §11).
// 런타임 서버리스에서만 ANTHROPIC_API_KEY 사용(클라이언트 노출 금지). 스캐폴드 스텁.
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  // TODO(§11): @anthropic-ai/sdk 로 claude-sonnet-4-6 리플렉션 피드백 생성.
  res.status(501).json({ error: 'Not Implemented (scaffold)' });
}
