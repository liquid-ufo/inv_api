const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

const auth = require("../middleware/auth");
const User = require("../models/User");

/*
@route: POST api/auth
@desc: get user credentials and verify
@access:  Public
*/
router.post("/", [
    check('email', 'Invalid email').isEmail(),
    check('password', 'Password is required').exists(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(401).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
        return res.status(401).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    const payload = {
        user: {
            id: user.id
        }
    };

    jwt.sign(payload,
        config.get("jwtSecret"), { expiresIn: 360000 }, (error, token) => {
            if (error) throw error;
            res.json({ token });
        });
});

module.exports = router;