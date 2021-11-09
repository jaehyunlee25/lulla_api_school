import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  // POST,
} from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getMIUI: 'getMemberByIdAndUserId',
  getAnnounce: 'getAnnouncement',
};
const baseUrl = 'sqls/announce/detail'; // 끝에 슬래시 붙이지 마시오.
let EXEC_STEP = 0;
export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});

  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.announce.index.3',
      message: 'server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  EXEC_STEP = '3.9'; // #3.8. 리턴값을 생성한다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.0');
  const userId = qUserId.message;

  EXEC_STEP = '3.10'; // 원 생성
  const {
    member_id: memberId, // uuid
    id: annId, // boolean
  } = req.body;

  EXEC_STEP = '3.2'; // #3.2. member 검색
  // #3.2.1.
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.2.1', 'searching member');
  // #3.2.2.
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.index.3.2.2',
      message: 'no such member',
    });
  //  const { grade } = qMIUI.message.rows[0];

  const qAnn = await QTS.getAnnounce.fQuery(baseUrl, { annId });
  if (qAnn.type === 'error')
    return qAnn.onError(res, '3.2.2', 'searching announcement');
  const data = qAnn.message.rows[0];

  return RESPOND(res, {
    data,
    message: '해당하는 알림장을 반환하였습니다.',
    resultCode: 200,
  });
}
