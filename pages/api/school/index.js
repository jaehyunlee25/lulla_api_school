import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon';

export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});

  try {
    if (req.method === 'POST') return await post(req, res);
    if (req.method === 'GET') return await get(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.school.index.3',
      message: 'server logic error',
    });
  }
  return true;
}
async function post(req, res) {
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') qUserId.onError(res, '3.1.2');
  const userId = qUserId.message;

  // #3.2 활성화한 사용자,  토큰,  학원인원을 리턴한다.
  return RESPOND(res, {
    userId,
    resultCode: 200,
  });
}
async function get() {
  return true;
}
