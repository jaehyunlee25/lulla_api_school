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
  getItems: 'getItems',
  getChatIds: 'getChatIds',
  delAnnouncement: 'delAnnouncement',
  delChat: 'delChat',
  getToMember: 'getToMember',
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
      id: 'ERR.announce.delete.0',
      message: 'server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  EXEC_STEP = '1.1'; // 토큰을 통한 userId 추출
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, EXEC_STEP);
  const userId = qUserId.message;

  EXEC_STEP = '1.2'; // 파라미터 추출
  const {
    member_id: memberId, // uuid
    id: annIds, // uuid[]
  } = req.body;

  EXEC_STEP = '1.2.1'; // annIds 유효성 검색
  if (annIds.length === 0)
    return ERROR(res, {
      id: 'ERR.announce.delete.1.2.1',
      message: '삭제할 알림장이 존재하지 않습니다.',
      step: EXEC_STEP,
    });

  EXEC_STEP = '1.3'; // member 검색
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '1.3.1', 'searching member');
  //
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.delete.1.3.2',
      message: 'no such member',
    });
  // const { grade } = qMIUI.message.rows[0];

  EXEC_STEP = '1.4'; // 삭제 요청한 id들 중에 실제 존재하는 id만 추출
  const qAnn = await QTS.getItems.fQuery(
    baseUrl,
    {
      annIds: annIds.sql('(', ')'),
    },
    memberId,
  );
  if (qAnn.type === 'error')
    return qAnn.onError(res, '1.4.1', 'searching announcement');

  if (qAnn.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.delete.1.4.2',
      message: '삭제할 알림장이 존재하지 않거나 삭제할 권한이 없습니다.',
    });

  const avAnnIds = qAnn.message.rows.map((obj) => obj.id);

  EXEC_STEP = '1.4.3'; // to_member_id 추출
  const qToMem = await QTS.getToMember.fQuery(baseUrl, {
    avAnnIds: avAnnIds.sql('(', ')'),
  });
  if (qToMem.type === 'error')
    return qToMem.onError(res, '1.4.3.1', 'searchgin to_member_id');

  if (qToMem.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.delete.1.4.3.2',
      message: '알림장을 받은 사람이 명확하지 않습니다.',
    });

  if (qToMem.message.rows.length > 1)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.delete.1.4.3.3',
      message: '1개 이상의 방의 알림장을 동시에 삭제할 수 없습니다.',
    });

  const { toMemberId } = qToMem.message.rows[0];

  EXEC_STEP = '1.6'; // 알림장의 채팅 아이디 추출
  const qChat = await QTS.getChatIds.fQuery(baseUrl, { avAnnIds });
  if (qChat.type === 'error')
    return qChat.onError(res, '1.6.1', 'searching chat ids');

  const { chatIds } = qChat.message.rows[0];

  EXEC_STEP = '1.7'; // 알림장 삭제
  const qAnnDel = await QTS.delAnnouncement.fQuery(baseUrl, {
    avAnnIds: avAnnIds.sql('(', ')'),
  });
  if (qAnnDel.type === 'error')
    return qAnnDel.onError(res, '1.6.1', 'deleting announcement');

  EXEC_STEP = '1.8'; // 채팅에서 삭제
  const qChatDel = await QTS.delChat.fQuery(baseUrl, {
    chatIds: chatIds.sql('(', ')'),
  });
  if (qChatDel.type === 'error')
    return qChatDel.onError(res, '1.6.1', 'deleting chat');

  EXEC_STEP = '1.9'; // 1:1 채팅창에 전송
  const members = [toMemberId];
  const qDel = await POST(
    'send',
    '/chat',
    {
      'Content-Type': 'application/json',
      authorization: req.headers.authorization,
    },
    { member_id: memberId, members, message: '알림장을 삭제했습니다.' },
  );
  if (qDel.type === 'error')
    return qDel.onError(res, '1.7', 'fatal error while publishing message');

  return RESPOND(res, {
    message: '해당하는 알림장을 삭제하였습니다.',
    resultCode: 200,
  });
}
