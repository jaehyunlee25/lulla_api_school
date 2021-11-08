import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  checkAnnouncement: 'checkAnnouncement',
  getMIUI: 'getMemberByIdAndUserId',
  getPermission: 'getPermission',
  setAnnouncement: 'setAnnouncement',
  getChatRoom: 'getChatRoom',
  delFile: 'delFile',
  getFiles: 'getFiles',
  newFile: 'newFile',
  getAnnouncement: 'getAnnouncement',
};
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

  setBaseURL('sqls/announce/update'); // 끝에 슬래시 붙이지 마시오.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.announce.udpate.3',
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
  EXEC_STEP = '3.1'; // 원 수정
  const {
    id: annId, // announcement id
    member_id: memberId, // uuid
    to_member_id: toMemberId, // uuid
    file_list: fileList, // uuid[]
    deleted_list: deletedList, // uuid[]
  } = req.body;

  EXEC_STEP = '3.2'; // #3.2. member 검색
  // #3.2.1.
  const qMIUI = await QTS.getMIUI.fQuery({ userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.2.1', 'searching member');
  // #3.2.2.
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.index.3.2.2',
      message: 'no such member',
    });
  const { grade } = qMIUI.message.rows[0];

  EXEC_STEP = '3.2.3'; // #3.2.3. 알림장 존재여부 검사
  const qAnn = await QTS.checkAnnouncement.fQuery({ annId });
  if (qAnn.type === 'error')
    return qAnn.onError(res, '3.2.3.1', 'searching announcement');
  if (qAnn.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.index.3.2.3.2',
      message: '수정할 알림장이 존재하지 않습니다.',
    });
  const ann = qAnn.message.rows[0];

  EXEC_STEP = '3.3'; // #3.3. memberId로 권한 검색(announce create 권한)
  // 보통 grade 3(선생님)이 이 권한을 갖고 있다.
  // 보호자 grade 5도 이 권한을 가지고 있다.
  const type = 4; // announce
  const action = 1; // create
  const qCheck = await QTS.getPermission.fQuery({ memberId, type, action });
  if (qCheck.type === 'error')
    return qCheck.onError(res, '3.3.1', 'searching permission');

  if (qCheck.message.rows.length === 0 && grade !== 5)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.index.3.3.2',
      message: '알림장을 수정할 권한이 없습니다.',
    });

  EXEC_STEP = '3.4'; // #3.4. 둘이 속해 있는 채팅방의 id를 찾는다.
  const qChat = await QTS.getChatRoom.fQuery({ memberId, toMemberId });
  if (qChat.type === 'error')
    return qChat.onError(res, '3.5.1', 'creating announcement');
  if (qChat.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.announce.index.3.4.1',
      message: '알림장을 발행할 채팅방이 존재하지 않습니다.',
    });
  // const chatId = qChat.message.rows[0].id;

  EXEC_STEP = '3.5'; // #3.5. 알림장을 수정한다.
  Object.keys(req.body).forEach((key) => {
    if (ann[key] === undefined) return;
    const val = req.body[key];
    ann[key] = val;
  });
  const qNew = await QTS.setAnnouncement.fQuery(ann);
  if (qNew.type === 'error')
    return qNew.onError(res, '3.5.1', 'updating announcement');

  if (deletedList && deletedList.length > 0) {
    EXEC_STEP = '3.6'; // #3.6. 제거된 파일을 삭제한다.
    const delFiles = deletedList.sql('(', ')');
    const qDelFile = await QTS.delFile.fQuery({ delFiles });
    if (qDelFile.type === 'error')
      return qDelFile.onError(res, '3.6.1', 'deleting announce file');
  }

  if (fileList && fileList.length > 0) {
    EXEC_STEP = '3.7'; // #3.7. 새로 추가된 파일을 추출한다.
    const qFiles = await QTS.getFiles.fQuery({ annId });
    if (qFiles.type === 'error')
      return qFiles.onError(res, '3.7.1', 'searching announce file');
    const { files } = qFiles.message.rows[0];
    const newFiles = files ? fileList.minusAr(files) : fileList;

    EXEC_STEP = '3.8'; // #3.6. 새로운 첨부파일을 저장한다.
    if (newFiles.length > 0) {
      const queryFileList = newFiles
        .map(
          (fileId) =>
            `(uuid_generate_v1(), now(), now(), '${annId}', '${fileId}')`,
        )
        .join(',\r\n\t');
      const qFile = await QTS.newFile.fQuery({ queryFileList });
      if (qFile.type === 'error')
        return qFile.onError(res, '3.8.1', 'creating attached file list');
    }
  }

  EXEC_STEP = '3.9'; // #3.9. 채팅을 publish한다.
  const members = [toMemberId];
  const qMember = await POST(
    'send',
    '/chat',
    {
      'Content-Type': 'application/json',
      authorization: req.headers.authorization,
    },
    { member_id: memberId, members, message: annId },
  );
  if (qMember.type === 'error')
    return qMember.onError(
      res,
      '3.9.1',
      'fatal error while publishing message',
    );

  EXEC_STEP = '3.8'; // #3.8. 리턴값을 생성한다.
  const qData = await QTS.getAnnouncement.fQuery({ annId });
  if (qData.type === 'error')
    return qData.onError(res, '3.8.1', 'searching announcement');
  const data = qData.message.rows;

  return RESPOND(res, {
    data,
    message: '알림장을 수정하였습니다.',
    resultCode: 200,
  });
}
