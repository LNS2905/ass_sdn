const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const memberRoutes = require('./routes/members');
const watchRoutes = require('./routes/watches');
const brandRoutes = require('./routes/brands');
const commentRoutes = require('./routes/comments');
const authMiddleware = require('./middleware/verify');
const session = require('express-session');
const morgan = require("morgan");
const methodOverride = require('method-override');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Use method-override to support PUT and DELETE methods
app.use(methodOverride('_method'));

// Set EJS as the view engine and use express-ejs-layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Sử dụng các tệp tĩnh của Ant Design
app.use(express.static(path.join(__dirname, 'node_modules', 'antd', 'dist')));

// MongoDB connection string
const dbURI = 'mongodb://127.0.0.1:27017/bao';

async function connectDB() {
    try {
        await mongoose.connect(dbURI);
        console.log('Connected to MongoDB successfully!');
    } catch (err) {
        console.error('Error connecting to MongoDB: ', err);
    }
}

// Connect to MongoDB
connectDB();

app.use(session({
    secret: 'yourSecretKey', // Replace with your secret key
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 180 * 60 * 1000 } // Session will expire in 3 hours
}));

// Middleware to set user in res.locals
app.use((req, res, next) => {
    res.locals.member = req.session.member;
    next();
});
app.use(morgan("dev"));

// Use routes
app.use('/members', memberRoutes);
app.use('/watches', watchRoutes);
app.use('/brands', brandRoutes);
app.use('/comments', commentRoutes);

// Define a route for the home page
app.get('/', async (req, res) => {
    try {
        const Watch = require('./models/Watch');
        const featuredWatches = await Watch.find().populate('brand');
        // console.log('featuredWatches: ', JSON.stringify(featuredWatches, null, 2)); // Kiểm tra dữ liệu
        console.log('memberInformation:', req.session.member); // Kiểm tra thông tin thành viên
        res.render('index', { featuredWatches, memberInformation: req.session.member });
    } catch (err) {
        console.error('Error fetching watches: ', err);
        res.render('error', { message: 'Error fetching watches', error: err, memberInformation: req.session.member });
    }
});

// 404 Page Not Found handler
app.use((req, res) => {
    res.status(404).render('404', { memberInformation: req.session.member });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));