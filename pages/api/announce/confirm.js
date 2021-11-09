import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getMIUI: 'getMemberByIdAndUserId',
  getAnnounce: 'getAnnouncement',
  getItem: 'getItem',
  setConfirm: 'setConfirm',
};
const baseUrl = 'sqls/announce/confirm'; // 끝에 슬래시 붙이지 마시오.
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
      id: 'ERR.announce.confirm.0',
      message: 'server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  EXEC_STEP = '1.1'; // 리턴값을 생성한다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.0');
  const userId = qUserId.message;

  EXEC_STEP = '1.2'; // 원 생성
  const {
    member_id: memberId, // uuid
    id: annId, // boolean
  } = req.body;

  EXEC_STEP = '1.3'; // member 검색
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '1.3.1', 'searching member');
  //
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.confirm.1.3.2',
      message: 'no such member',
    });
  //  const { grade } = qMIUI.message.rows[0];

  EXEC_STEP = '1.4'; // 알림장 존재여부 검색
  const qAnn = await QTS.getItem.fQuery(baseUrl, { annId });
  if (qAnn.type === 'error')
    return qAnn.onError(res, '1.4.1', 'searching announcement');

  if (qAnn.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.confirm.1.4.2',
      message: '승인할 알림장이 존재하지 않습니다.',
    });

  const ann = qAnn.message.rows[0];

  EXEC_STEP = '1.5'; // 알림장을 받는 사람이 memberId와 다르면 권한 없음 처리
  if (ann.to_member_id !== memberId)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.confirm.1.5.1',
      message: '알림장을 승인할 권한이 없습니다.',
    });

  EXEC_STEP = '1.6'; // 알림장 확인 처리
  const qSet = await QTS.setConfirm.fQuery(baseUrl, { annId });
  if (qSet.type === 'error')
    return qSet.onError(res, '1.6.1', 'searching announcement');

  EXEC_STEP = '1.7'; // 1:1 채팅창에 전송
  const members = [ann.member_id];
  const qChat = await POST(
    'send',
    '/chat',
    {
      'Content-Type': 'application/json',
      authorization: req.headers.authorization,
    },
    { member_id: memberId, members, message: '알림장을 확인했습니다.' },
  );
  if (qChat.type === 'error')
    return qChat.onError(res, '1.7', 'fatal error while publishing message');

  EXEC_STEP = '1.8'; // confirm한 알림장 리턴
  const qData = await QTS.getAnnounce.fQuery(baseUrl, { annId });
  if (qData.type === 'error')
    return qData.onError(res, '3.10.1', 'searching announcement');
  const data = qData.message.rows;

  return RESPOND(res, {
    data,
    message: '해당하는 알림장을 반환하였습니다.',
    resultCode: 200,
  });
}
