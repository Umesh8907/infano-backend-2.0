const mongoose = require('mongoose');

async function checkSlugs() {
    try {
        await mongoose.connect('mongodb://localhost:27017/infano');
        const Journey = mongoose.model('Journey', new mongoose.Schema({}, { strict: false }));
        const Quest = mongoose.model('Quest', new mongoose.Schema({}, { strict: false }));

        const journeys = await Journey.find({});
        console.log('Journeys:', JSON.stringify(journeys, null, 2));

        const quests = await Quest.find({});
        console.log('Quests:', JSON.stringify(quests, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSlugs();
