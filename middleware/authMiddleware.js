const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // 헤더가 없거나 Bearer 토큰 형식이 아닌 경우
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '토큰이 없습니다.' });
  }

  const token = authHeader.split(' ')[1]; // Bearer 토큰에서 실제 토큰만 추출

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // 토큰 검증
    req.user = decoded; // 토큰에 담긴 userId를 req.user에 저장
    next(); // 다음 미들웨어로 진행
  } catch (err) {
    return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = authMiddleware;