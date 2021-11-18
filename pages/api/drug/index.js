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
  newDrugCabinet: 'newDrugCabinet',
  newDrugs: 'newDrugs',
  getDrugs: 'getDrugs',
  getTeacherId: 'getTeacherId',
};
const baseUrl = 'sqls/drug/drug'; // 끝에 슬래시 붙이지 마시오.
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
      id: 'ERR.drug.index.3',
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

  EXEC_STEP = '3.1'; //
  const {
    member_id: memberId, // uuid
    date, // 'yyyy-mm-dd'
    signature_id: signatureId,
    is_reserved: isReserved,
    is_published: isPublished,
    drug: drugs,
  } = req.body;

  EXEC_STEP = '3.2'; // #3.2. member 검색
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.2.1', 'searching member');

  EXEC_STEP = '3.2.2'; // #3.2. member 검색
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.drug.index.3.2.2.1',
      message: 'no such member',
    });
  const { grade, classId } = qMIUI.message.rows[0];

  if (grade !== 5)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.drug.index.3.2.2.2',
      message: '투약의뢰서를 작성 할 권한이 없습니다.',
    });

  EXEC_STEP = '3.2.3'; // #3.6. 담임선생님의 memberId를 알아낸다.
  const qGetTeacher = await QTS.getTeacherId.fQuery(baseUrl, { classId });
  if (qGetTeacher.type === 'error')
    return qGetTeacher.onError(res, '3.2.3.1', 'searching teacher id');

  if (qGetTeacher.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.drug.index.3.2.3.2',
      message:
        '해당 보호자의 자녀가 있는 반이 존재하지 않거나 선생님이 배정되어 있지 않습니다.',
    });
  const teacherId = qGetTeacher.message.rows[0].teacher_id;

  EXEC_STEP = '3.3'; // #3.3. insert drug_cabinet
  const qNewDC = await QTS.newDrugCabinet.fQuery(baseUrl, {
    date,
    isReserved,
    isPublished,
    memberId,
    signatureId,
  });
  if (qNewDC.type === 'error')
    return qNewDC.onError(res, '3.3.1', 'creating drug cabinet');
  const drugCabinetId = qNewDC.message.rows[0].id;

  EXEC_STEP = '3.4'; // #3.4. 투약 의뢰서를 만든다.
  const newDrugs = [];
  drugs.forEach((drug) => {
    const item = [
      'uuid_generate_v1()',
      ["'", drug.symptom, "'"].join(''),
      ["'", drug.schedule, "'"].join(''),
      ["'", drug.storage_method, "'"].join(''),
      ["'", drug.dosage, "'"].join(''),
      ["'", drug.medical_type, "'"].join(''),
      ["'", drug.times, "'"].join(''),
      'now()',
      'now()',
      ["'", drugCabinetId, "'"].join(''),
      ["'", drug.content, "'"].join(''),
    ];
    newDrugs.push(['(', item.join(','), ')'].join(''));
  });
  const sqlDrugs = newDrugs.join(',\r\n\t');

  EXEC_STEP = '3.5'; // #3.4. 투약 의뢰서를 저장한다.
  const qNewDrugs = await QTS.newDrugs.fQuery(baseUrl, { sqlDrugs });
  if (qNewDrugs.type === 'error')
    return qNewDrugs.onError(res, '3.5.1', 'creating new drugs');

  if (isPublished) {
    EXEC_STEP = '3.6'; // #3.6. 채팅을 publish한다.
    const members = [teacherId];
    const qMember = await POST(
      'send',
      '/chat/setDrug',
      {
        'Content-Type': 'application/json',
        authorization: req.headers.authorization,
      },
      { member_id: memberId, members, message: drugCabinetId },
    );
    if (qMember.type === 'error')
      return qMember.onError(
        res,
        '3.6.1',
        'fatal error while publishing message',
      );
  }

  EXEC_STEP = '3.7'; // #3.4. 저장한 투약의뢰정보를 가져온다.
  const qGet = await QTS.getDrugs.fQuery(baseUrl, { drugCabinetId });
  if (qGet.type === 'error')
    return qGet.onError(res, '3.7.1', 'creating new drugs');

  return RESPOND(res, {
    sqlDrugs,
    message: '해당하는 알림장을 반환하였습니다.',
    resultCode: 200,
  });
}
