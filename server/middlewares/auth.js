const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.userId = user.id;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Por favor, autentique-se.' });
  }
};

const requireTwoFactor = async (req, res, next) => {
  try {
    if (req.user.two_factor_enabled && !req.user.two_factor_verified) {
      return res.status(403).json({ error: 'Autenticação de dois fatores necessária.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar autenticação de dois fatores.' });
  }
};

module.exports = { auth, requireTwoFactor }; 