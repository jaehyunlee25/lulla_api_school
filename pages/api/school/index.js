import { RESPOND } from '../../../lib/apiCommon';

export default function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'Content-Type', // for application/json
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});

  if (req.method === 'POST')
    return RESPOND(res, { type: 'success', method: 'post' });
  if (req.method === 'GET')
    return RESPOND(res, { type: 'success', method: 'get' });
  return true;
}
