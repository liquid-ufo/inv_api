const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const config = require("config");

const { check, validationResult } = require("express-validator/check");
const auth = require("../middleware/auth");

const User = require("../models/User");

/*
@route: GET api/users
@desc: Test route
@access:  Private
*/
router.get("/", auth, async (req, res) => {

    try {
        const users = await User.find().select({ "name": 1, "email": 1 });
        res.json(users);
    } catch (error) {
        res.json({ msg: error });
    }
});

/*
@route: POST api/users
@desc: Registers user
@access:  Public
*/
router.post("/", [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Invalid email').isEmail(),
    check('password', 'Password should be atleast 6 characters').isLength({ min: 6 })
], async (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            res.status(400).json({ errors: [{ message: "User already exists." }] });
        }
        user = new User({
            name,
            email,
            password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload,
            config.get("jwtSecret"),
            {
                expiresIn: 360000
            }, (error, token) => {
                if (error) throw error;
                res.json({ token });
            });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

module.exports = router;