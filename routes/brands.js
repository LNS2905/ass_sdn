const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const authMiddleware = require('../middleware/verify');

// Get all brands (admin only)
router.get('/', authMiddleware.isAdmin, async (req, res) => {
    try {
        const brands = await Brand.find({});
        res.render("brands", { brands, memberInformation: req.session.member });
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get a specific brand by ID (admin only)
router.get('/:brandId', authMiddleware.isAdmin, async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.brandId);
        if (!brand) {
            return res.status(404).render("404", { message: 'Brand not found', memberInformation: req.session.member });
        }
        res.render("brand-details", { brand, memberInformation: req.session.member });
    } catch (error) {
        res.status(400).send(error);
    }
});

// Create a new brand (admin only)
router.post('/', authMiddleware.isAdmin, async (req, res) => {
    try {
        const brand = new Brand(req.body);
        await brand.save();
        res.redirect("/brands");
    } catch (error) {
        res.status(400).send(error);
    }
});

//Update a brand (admin only)
router.put('/:brandId', authMiddleware.isAdmin, async (req, res) => {
    try {
        const brand = await Brand.findByIdAndUpdate(req.params.brandId, req.body, { new: true, runValidators: true });
        if (!brand) {
            return res.status(404).render("404", { message: 'Brand not found', memberInformation: req.session.member });
        }
        res.redirect(`/brands`);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete a brand (admin only)
router.delete('/:brandId', authMiddleware.isAdmin, async (req, res) => {
    try {
        const brand = await Brand.findByIdAndDelete(req.params.brandId);
        if (!brand) {
            return res.status(404).render("404", { message: 'Brand not found', memberInformation: req.session.member });
        }
        res.send("Brand deleted");
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;