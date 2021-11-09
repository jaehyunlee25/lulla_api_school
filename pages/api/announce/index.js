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
  getPermission: 'getPermission',
  newAnnouncement: 'newAnnouncement',
  getChatRoom: 'getChatRoom',
  newFile: 'newFile',
  getAnnouncement: 'getAnnouncement',
  // GET only
  getATT: 'getAnnounceTeacherTemp',
  getAT: 'getAnnounceTeacher',
  getACT: 'getAnnounceCarerTemp',
  getAC: 'getAnnounceCarer',
};
const baseUrl = 'sqls/announce/announce'; // 끝에 슬래시 붙이지 마시오.
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
  EXEC_STEP = '3.0'; // #3.0. 사용자 토큰을 이용해 유효성을 검증하고, 필요하면 userId를 추출한다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.0');
  const userId = qUserId.message;

  EXEC_STEP = '3.1'; // 원 생성
  const {
    member_id: memberId, // uuid
    to_member_id: toMemberId, // uuid
    date, // 'yyyy-mm-dd'
    sleep, // int
    condition, // int
    meal, // int
    temperature, // int
    defecation, // int
    is_reserved: isReserved, // boolean
    is_published: isPublished, // boolean
    is_record: isRecord, // boolean
    file_list: fileList, // uuid[]
    content, // string
  } = req.body;

  EXEC_STEP = '3.2'; // #3.2. member 검색
  // #3.2.1.
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.2.2', 'searching member');
  // #3.2.2.
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.index.3.2.3',
      message: 'no such member',
    });
  const { grade } = qMIUI.message.rows[0];

  EXEC_STEP = '3.3'; // #3.3. memberId로 권한 검색(announce create 권한)
  // 보통 grade 3(선생님)이 이 권한을 갖고 있다.
  // 보호자 grade 5도 이 권한을 가지고 있다.
  const type = 4; // announce
  const action = 1; // create
  const qCheck = await QTS.getPermission.fQuery(baseUrl, {
    memberId,
    type,
    action,
  });
  if (qCheck.type === 'error')
    return qCheck.onError(res, '3.3.1', 'searching permission');

  if (qCheck.message.rows.length === 0 && grade !== 5)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.index.3.3.2',
      message: '알림장을 발송할 권한이 없습니다.',
    });

  EXEC_STEP = '3.4'; // #3.4. 둘이 속해 있는 채팅방의 id를 찾는다.
  const qChat = await QTS.getChatRoom.fQuery(baseUrl, { memberId, toMemberId });
  if (qChat.type === 'error')
    return qChat.onError(res, '3.5.1', 'creating announcement');
  if (qChat.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.index.3.4.1',
      message: '알림장을 발행할 채팅방이 존재하지 않습니다.',
    });
  const chatId = qChat.message.rows[0].id;

  EXEC_STEP = '3.5'; // #3.5. 알림장을 생성한다.
  const qNew = await QTS.newAnnouncement.fQuery(baseUrl, {
    date,
    condition,
    meal,
    temperature,
    defecation,
    memberId,
    isPublished,
    isReserved,
    content,
    toMemberId,
    chatId,
    isRecord,
    sleep,
  });
  if (qNew.type === 'error')
    return qNew.onError(res, '3.5.1', 'creating announcement');
  const annId = qNew.message.rows[0].id;

  EXEC_STEP = '3.6'; // #3.6. 첨부파일을 저장한다.
  if (fileList && fileList.length > 0) {
    const queryFileList = fileList
      .map(
        (fileId) =>
          `(uuid_generate_v1(), now(), now(), '${annId}', '${fileId}')`,
      )
      .join(',\r\n\t');
    const qFile = await QTS.newFile.fQuery(baseUrl, { queryFileList });
    if (qFile.type === 'error')
      return qFile.onError(res, '3.6.1', 'creating attached file list');
  }

  if (isPublished) {
    EXEC_STEP = '3.7'; // #3.7. 채팅을 publish한다.
    const members = [toMemberId];
    const qMember = await POST(
      'send',
      '/chat/announce',
      {
        'Content-Type': 'application/json',
        authorization: req.headers.authorization,
      },
      { member_id: memberId, members, message: annId },
    );
    if (qMember.type === 'error')
      return qMember.onError(
        res,
        '3.7.1',
        'fatal error while publishing message',
      );
  }

  EXEC_STEP = '3.8'; // #3.8. 리턴값을 생성한다.
  const qData = await QTS.getAnnouncement.fQuery(baseUrl, { annId });
  if (qData.type === 'error')
    return qData.onError(res, '3.8.1', 'searching announcement');
  const data = qData.message.rows;

  return RESPOND(res, {
    data,
    message: '해당하는 알림장을 반환하였습니다.',
    resultCode: 200,
  });
}
