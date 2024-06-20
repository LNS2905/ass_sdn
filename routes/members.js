const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Member = require('../models/Member');
const authMiddleware = require('../middleware/verify');
const { body, validationResult } = require("express-validator");

// Register page
router.get("/register", (req, res) => {
    res.render("register", { noHeaderFooter: true, title: 'Register', memberInformation: req.session.member });
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { membername, password, name, YOB, isAdmin } = req.body;

        // Validate input
        await body('membername')
            .notEmpty().withMessage('Username is required.')
            .isLength({ min: 8 }).withMessage('Username must be at least 8 characters long.')
            .run(req);

        await body('name')
            .notEmpty().withMessage('Name is required.')
            .isLength({ min: 8 }).withMessage('Name must be at least 8 characters long.')
            .run(req);

        await body('password')
            .notEmpty().withMessage('Password is required.')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
            .run(req);

        await body('YOB')
            .notEmpty().withMessage('YOB is required.')
            .isNumeric().withMessage('YOB must be a number.')
            .isInt({ min: 1000, max: 2025 }).withMessage('YOB must be between 1000 - 2025.')
            .run(req);

        const errors = validationResult(req);
        const errorArray = errors.array();

        // Check for existing member
        const existingMember = await Member.findOne({ membername });
        if (existingMember) {
            errorArray.push({ msg: 'Username already exists' });
        }

        if (errorArray.length > 0) {
            return res.render("register", {
                memberInformation: req.session.member || {},
                errors: errorArray,
                noHeaderFooter: true,
                title: 'Register'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new member
        const newMember = new Member({
            membername,
            password: hashedPassword,
            name,
            YOB,
            isAdmin: isAdmin || false,
        });

        await newMember.save();

        res.redirect("/members/login");
    } catch (err) {
        console.error('Registration error:', err);
        return res.render('error', { message: 'Server error', error: err, memberInformation: req.session.member });
    }
});

// Login page
router.get('/login', authMiddleware.isAuthenticated, (req, res) => {
    res.render('login', { noHeaderFooter: true, title: 'Login' });
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { membername, password } = req.body;
        const member = await Member.findOne({ membername });

        if (!member) {
            return res.render("login", { error: 'Invalid credentials', noHeaderFooter: true, title: 'Login' });
        }

        const validPassword = await bcrypt.compare(password, member.password);
        if (validPassword) {
            req.session.member = member;

            if (member.isAdmin) {
                res.redirect('/members/accounts');
            } else {
                res.redirect('/');
            }
        } else {
            return res.render("login", { error: 'Invalid credentials', noHeaderFooter: true, title: 'Login' });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.render('error', { message: 'Server error', error, memberInformation: req.session.member });
    }
});

// Edit profile information
router.get("/edit/profile/:id", authMiddleware.ensureAuthenticated, async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (member) {
            res.render("profile", {
                memberInformation: member,
                title: 'Edit Profile'
            });
        } else {
            res.render('error', { message: 'Member not found', memberInformation: req.session.member });
        }
    } catch (err) {
        console.error('Error fetching member:', err);
        res.render('error', { message: 'Error fetching member', error: err, memberInformation: req.session.member });
    }
});

router.post("/edit/profile/:id", authMiddleware.ensureAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { name, YOB, password } = req.body;
    try {
        await body("name")
            .notEmpty()
            .withMessage("Name is required.")
            .isLength({ min: 8 })
            .withMessage("Name must be at least 8 characters long.")
            .run(req);

        await body("YOB")
            .notEmpty()
            .withMessage("YOB is required.")
            .isNumeric()
            .withMessage("YOB must be a number.")
            .isInt({ min: 1000, max: 2025 })
            .withMessage("YOB must be between 1000 - 2025.")
            .run(req);

        await body("password")
            .notEmpty()
            .withMessage("Password is required.")
            .isLength({ min: 8 })
            .withMessage("Password must be at least 8 characters long.")
            .run(req);

        const errors = validationResult(req);
        const errorArray = errors.array();

        if (errorArray.length > 0) {
            return res.render("profile", {
                memberInformation: req.session.member || {},
                errors: errorArray,
                title: 'Edit Profile'
            });
        }

        let hashedPassword = req.session.member.password;
        if (hashedPassword !== password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        const editProfile = await Member.findByIdAndUpdate(id, {
            password: hashedPassword,
            name,
            YOB,
        });

        if (editProfile) {
            res.send(`
                <script>
                    alert("Edit successful. Please log out and log back in to update information");
                    window.location.href = '/members/profile';
                </script>
            `);
        } else {
            res.render('error', { message: 'Error updating profile', memberInformation: req.session.member });
        }
    } catch (err) {
        console.error('Error updating profile:', err);
        res.render('error', { message: 'Error updating profile', error: err, memberInformation: req.session.member });
    }
});

// Get all members (admin only)
router.get('/accounts', authMiddleware.isAdmin, async (req, res) => {
    try {
        const members = await Member.find();
        res.render('members', { members, memberInformation: req.session.member });
    } catch (err) {
        console.error('Error fetching members:', err);
        res.render('error', { message: 'Error fetching members', error: err, memberInformation: req.session.member });
    }
});

// Profile page
router.get("/profile", authMiddleware.ensureAuthenticated, async (req, res) => {
    try {
        const member = await Member.findById(req.session.member._id);
        if (member) {
            res.render("profile", {
                memberInformation: member,
                title: 'Profile'
            });
        } else {
            res.render('error', { message: 'Member not found', memberInformation: req.session.member });
        }
    } catch (err) {
        console.error('Error fetching member:', err);
        res.render('error', { message: 'Error fetching member', error: err, memberInformation: req.session.member });
    }
});

// Logout
router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/members/login");
});

module.exports = router;