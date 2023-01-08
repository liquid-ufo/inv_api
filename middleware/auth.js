const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
    // const token = req.header('x-auth-token');
    const token = req.header('token');

    if (!token) {
        return res.status(401).json({
            msg: 'Unauthorized'
        });
    }

    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));

        req.user = decoded.user;
        next();
    }
    catch (e) {
        return res.status(401).json({
            msg: 'Unauthorized'
        });
    }
};