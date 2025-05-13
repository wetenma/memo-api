// validation/memoValidation.js
const Joi = require('joi');
/*
  joi란 node.js에서 입력 데이터를 검증하는데 쓰는 라이브러리
  잘못된 값을 API가 걸러내서 에러를 반환환
*/ 

const memoSchema = Joi.object({
  content: Joi.string().min(1).required()
  //content는 문자열이여야하고/최소 한글자 이상에/반드시 있어야한다
});

module.exports = memoSchema;