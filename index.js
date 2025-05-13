
// 필요한 모듈 불러오기
const express = require('express');        
// 웹 서버를 위한 express

// MongoDB랑 Node.js를 연결해주는 ODM(Object Data Modeling) 라이브러리.
const mongoose = require('mongoose');

// 메모 모델 불러오기 (models/Memo.js)
const Memo = require('./models/Memo');

//사용자 인증 라우터
const authRoutes = require('./routes/auth');

// Joi 입력 검증 스키마 불러오기 (validation/memoValidation.js)
/*
  joi란 node.js에서 입력 데이터를 검증하는데 쓰는 라이브러리
  잘못된 값을 API가 걸러내서 에러를 반환환
*/ 
const memoValidation = require('./validation/memoValidation');

const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const port = process.env.PORT || 3000;


// 요청의 본문이 json이면 자동으로 JavaScript로 바꾸는 미들웨어
app.use(express.json());
//  /auth/register, /auth/login 연결
app.use('/auth',authRoutes);


mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB 연결 성공! :) '))
.catch(err => console.error('MongoDB 연결 실패 :( :', err));

/** 몽고디비에서 조회
 * [GET] /memo
 * - MongoDB에서 저장된 모든 메모를 가져와 반환
 * - 최신순 정렬 (createdAt 기준 내림차순)
 */
app.get('/memo', authMiddleware, async (req, res, next) => {
  try {
    // MongoDB에서 모든 메모 찾기, 최신순 정렬(-1아닌 1이면 내립차순순)
    const memos = await Memo.find().sort({ createdAt: -1 });
    res.json(memos);
  } catch (err) {
    // 오류 발생 시 다음 미들웨어(에러 핸들링)로 넘김
    next(err);
  }
});

/**
 * [POST] /memo
 * - 클라이언트로부터 받은 메모를 저장
 * - Joi로 유효성 검사 → 실패 시 400 에러
 * - 저장 성공 시 생성된 메모를 반환
 */
app.post('/memo', authMiddleware, async (req, res, next) => {
  // Joi 스키마로 요청 바디 검증
  const { error } = memoValidation.validate(req.body);
  if (error) {
    // 유효성 검사 실패 시 에러 미들웨어로 넘김
    return next(error);
  }

  try {
    // Mongoose 모델을 이용해 새 메모 생성
    const memo = new Memo({
      content: req.body.content
    });

    // DB에 저장
    const savedMemo = await memo.save();

    // 저장된 결과 반환
    res.status(201).json(savedMemo);
  } catch (err) {
    // 에러가 발생하면 에러 미들웨어로 전달
    next(err);
  }
});
/*
app.post('/memo', (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: '내용이 필요합니다.' });
  }

  const newMemo = {
    id: Date.now(),
    content
  };
  
  memos.push(newMemo);
  saveMemosToFile(); // 파일에 저장
  
  res.status(201).json(newMemo);
});
*/

/**
 * [DELETE] /memo/:id
 * - 전달받은 id에 해당하는 메모를 MongoDB에서 삭제
 * - 해당 id가 존재하지 않으면 404 에러
 * - 삭제 성공 시 삭제된 메모 정보 반환
 */
app.delete('/memo/:id',authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params; // URL 파라미터에서 id 추출

    // MongoDB에서 해당 id를 가진 메모를 찾아 삭제
    const deletedMemo = await Memo.findByIdAndDelete(id);

    // 삭제된 게 없으면 (존재하지 않는 id) 에러 반환
    if (!deletedMemo) {
      return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
    }

    // 삭제 성공
    res.json({ message: '삭제되었습니다.', deleted: deletedMemo });
  } catch (err) {
    // 에러 발생 시 에러 핸들러로 전달
    next(err);
  }
});
/*
 app.delete('/memo/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = memos.findIndex(memo => memo.id === id);

  if (index === -1) {
    return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
  }

  const deleted = memos.splice(index, 1);
  saveMemosToFile(); // 파일에 저장
  res.json({ message: '삭제되었습니다.', deleted });
}); 
 */

/**
 * [PATCH] /memo/:id
 * - 전달된 id의 메모를 수정
 * - Joi로 content 유효성 검사
 * - 수정된 메모를 반환
 */
app.patch('/memo/:id',authMiddleware, async (req, res, next) => {
  // 요청 본문 검증
  const { error } = memoValidation.validate(req.body);
  if (error) {
    // content가 비었거나 없으면 Joi가 막아줌
    return next(error);
  }

  try {
    const { id } = req.params;

    // MongoDB에서 id에 해당하는 문서를 찾아 내용 수정
    const updatedMemo = await Memo.findByIdAndUpdate(
      id,                           // 대상 문서 ID
      { content: req.body.content }, // 수정할 필드
      { new: true }                  // 수정된 결과를 반환
    );

    // 해당 메모가 없을 경우
    if (!updatedMemo) {
      return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
    }

    // 성공 응답
    res.json({ message: '수정되었습니다.', memo: updatedMemo });
  } catch (err) {
    next(err);
  }
});
/*
app.patch('/memo/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { content } = req.body;

  const memo = memos.find(m => m.id === id);
  if (!memo) {
    return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
  }

  if (!content) {
    return res.status(400).json({ error: '수정할 내용이 없습니다.' });
  }

  memo.content = content;
  saveMemosToFile(); // 파일에 저장
  res.json({ message: '수정되었습니다.', memo });
});
*/

/**
 * 서버 실행
 */


app.listen(port, () => {
  console.log(`서버가 http://localhost:${port}/memo 에서 실행 중입니다.`);
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.message); // 서버 콘솔에 에러 메시지 출력
  res.status(400).json({ error: err.message });
});