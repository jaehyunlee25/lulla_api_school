import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getSMBI: 'getSchoolMemberById',
  getMember: 'getMember',
  setMember: 'setMember',
};
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

  setBaseURL('sqls/member/update'); // 끝에 슬래시 붙이지 마시오.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.school.index.3',
      message: 'server logic error',
      error: e.toString(),
    });
  }
}
async function main(req, res) {
  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  // #3.2 userId와 memberId가 같은 멤버 조회
  // #3.2.1 memberId 유효성 점검
  const {
    member_id: memberId,
    nickname,
    member_description: description,
    image_id: imageId,
    background_image_id: backgroundImageId,
  } = req.body;

  // #3.2 member 검색
  const qMember = await QTS.getMember.fQuery({ memberId });
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2.1', 'searching member');
  if (qMember.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.school.school.3.2.2',
      message: '해당하는 데이터를 찾을 수 없습니다.',
    });
  const memberUserId = qMember.message.rows[0].user_id;
  if (userId !== memberUserId)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.school.school.3.2.3',
      message: 'member profile 정보의 수정 권한이 없습니다.',
    });

  // #3.3 member 정보 수정
  const qSM = await QTS.setMember.fQuery({
    nickname,
    description,
    imageId: imageId || null,
    backgroundImageId: backgroundImageId || null,
    memberId,
  });
  if (qSM.type === 'error')
    return qSM.onError(res, '3.3.1', 'searching member');

  // #3.4 수정된 member 정보 추출
  const getSMBI = await QTS.getSMBI.fQuery({ memberId });
  if (getSMBI.type === 'error')
    return getSMBI.onError(res, '3.3.1', 'searching member');
  if (getSMBI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 203,
      id: 'ERR.school.school.3.4.1',
      message: '해당하는 데이터를 찾을 수 없습니다.',
    });

  return RESPOND(res, {
    data: getSMBI.message.rows[0],
    message: '해당하는 데이터를 성공적으로 반환하였습니다.',
    resultCode: 200,
  });
}
