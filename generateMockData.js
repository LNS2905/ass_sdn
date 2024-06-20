const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');
const Member = require('./models/Member');
const Brand = require('./models/Brand');
const Watch = require('./models/Watch');
const Comment = require('./models/Comment');

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

async function generateData() {
    try {
        // Create regular members
        const memberData = [];
        for (let i = 0; i < 10; i++) {
            const password = await bcrypt.hash(faker.internet.password(), 10);
            memberData.push({
                membername: faker.internet.userName(),
                password: password,
                name: faker.person.fullName(),
                YOB: faker.date.birthdate({ min: 18, max: 65 }).getFullYear(),
            });
        }
        const members = await Member.insertMany(memberData);

        // Create brands
        const brandNames = ['Rolex', 'Omega', 'Tag Heuer', 'Seiko', 'Casio'];
        const brandData = brandNames.map(name => ({ brandName: name }));
        const brands = await Brand.insertMany(brandData);

        // Create watches
        const watchData = [];
        for (let i = 0; i < 20; i++) {
            const brand = faker.helpers.arrayElement(brands);
            watchData.push({
                watchName: `${brand.brandName} ${faker.commerce.productAdjective()}`,
                image: faker.image.url(400, 400, 'watch'),
                price: faker.commerce.price({ min: 100, max: 10000 }),
                Automatic: faker.datatype.boolean(),
                watchDescription: faker.lorem.paragraph(),
                brand: brand._id,
            });
        }
        const watches = await Watch.insertMany(watchData);

        // Create comments
        const commentData = [];
        for (let i = 0; i < 30; i++) {
            const member = faker.helpers.arrayElement(members);
            const watch = faker.helpers.arrayElement(watches);
            commentData.push({
                rating: faker.number.int({ min: 1, max: 3 }),
                content: faker.lorem.sentence(),
                author: member._id,
                watch: watch._id,
            });
        }
        await Comment.insertMany(commentData);

        console.log('Sample data generated successfully');
        mongoose.disconnect();
    } catch (error) {
        console.error('Error generating data:', error);
        mongoose.disconnect();
    }
}

async function main() {
    await connectDB();
    await generateData();
}

main();