const express = require('express');
const router = express.Router();
const Watch = require('../models/Watch');
const Brand = require('../models/Brand');
const authMiddleware = require('../middleware/verify');
const methodOverride = require('method-override');

// Use method-override to support PUT and DELETE methods
router.use(methodOverride('_method'));

// Search watches by name
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        const watches = await Watch.find({ watchName: new RegExp(q, 'i') }).populate('brand');
        const brands = await Brand.find();
        res.render("watches", { watches, brands, memberInformation: req.session.member });
    } catch (error) {
        console.error('Error searching watches:', error);
        res.render('error', { message: 'Error searching watches', error, memberInformation: req.session.member });
    }
});

// Filter watches by brand name
router.get('/filter', async (req, res) => {
    try {
        const { brand } = req.query;
        const brandDoc = await Brand.findOne({ brandName: new RegExp(brand, 'i') });
        if (!brandDoc) {
            return res.render('error', { message: 'Brand not found', memberInformation: req.session.member });
        }
        const watches = await Watch.find({ brand: brandDoc._id }).populate('brand');
        const brands = await Brand.find();
        res.render("watches", { watches, brands, memberInformation: req.session.member });
    } catch (error) {
        console.error('Error filtering watches:', error);
        res.render('error', { message: 'Error filtering watches', error, memberInformation: req.session.member });
    }
});

// Get all watches (admin only)
router.get('/', authMiddleware.isAdmin, async (req, res) => {
    try {
        const watches = await Watch.find().populate('brand');
        const brands = await Brand.find();
        res.render("watches", { watches, brands, memberInformation: req.session.member });
    } catch (error) {
        console.error('Error fetching watches:', error);
        res.render('error', { message: 'Error fetching watches', error, memberInformation: req.session.member });
    }
});

// Get a specific watch by ID 
router.get('/:watchId', async (req, res) => {
    try {
        const watch = await Watch.findById(req.params.watchId).populate('brand').populate({
            path: 'comments',
            populate: { path: 'author', select: 'name' }
        });
        if (!watch) {
            return res.render('error', { message: 'Watch not found', memberInformation: req.session.member });
        }
        return res.render("watch-details", { watch, memberInformation: req.session.member });
    } catch (error) {
        console.error('Error fetching watch:', error);
        res.render('error', { message: 'Error fetching watch', error, memberInformation: req.session.member });
    }
});

// Create a new watch (admin only)
router.post('/', authMiddleware.isAdmin, async (req, res) => {
    try {
        const { watchName, brand, price, image, watchDescription, automatic } = req.body;

        // Ensure the brand exists
        const brandDoc = await Brand.findById(brand);
        if (!brandDoc) {
            return res.render('error', { message: 'Brand not found', memberInformation: req.session.member });
        }

        const watch = new Watch({
            watchName,
            brand: brandDoc._id,
            price,
            image,
            watchDescription,
            automatic: automatic === 'true'
        });
        await watch.save();
        res.redirect("/watches");
    } catch (error) {
        console.error('Error creating watch:', error);
        res.render('error', { message: 'Error creating watch', error, memberInformation: req.session.member });
    }
});

// Update a watch (admin only)
router.put('/:watchId', authMiddleware.isAdmin, async (req, res) => {
    try {
        const { watchName, brand, price, image, watchDescription, automatic } = req.body;

        // Ensure the brand exists
        const brandDoc = await Brand.findById(brand);
        if (!brandDoc) {
            return res.render('error', { message: 'Brand not found', memberInformation: req.session.member });
        }

        const watch = await Watch.findByIdAndUpdate(req.params.watchId, {
            watchName,
            brand: brandDoc._id,
            price,
            image,
            watchDescription,
            automatic: automatic === 'true'
        }, { new: true, runValidators: true });

        if (!watch) {
            return res.status(404).send({ message: 'Watch not found' });
        }
        res.redirect("/watches");
    } catch (error) {
        console.error('Error updating watch:', error);
        res.render('error', { message: 'Error updating watch', error, memberInformation: req.session.member });
    }
});

// Delete a watch (admin only)
router.delete('/:watchId', authMiddleware.isAdmin, async (req, res) => {
    try {
        const watch = await Watch.findByIdAndDelete(req.params.watchId);
        if (!watch) {
            return res.status(404).send({ message: 'Watch not found' });
        }
        res.send({ message: 'Watch deleted successfully' });
    } catch (error) {
        console.error('Error deleting watch:', error);
        res.status(400).send(error);
    }
});

module.exports = router;