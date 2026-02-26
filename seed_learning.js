const mongoose = require('mongoose');

// Define Schemas (simplified for seeding)
const JourneySchema = new mongoose.Schema({
    slug: { type: String, unique: true },
    title: String,
    description: String,
    thumbnailUrl: String,
    totalXP: Number,
    category: String,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const QuestItemSchema = new mongoose.Schema({
    type: String,
    title: String,
    content: mongoose.Schema.Types.Mixed,
    order: Number,
    xpReward: Number
});

const QuestSchema = new mongoose.Schema({
    journeyId: mongoose.Schema.Types.ObjectId,
    title: String,
    slug: { type: String, unique: true },
    description: String,
    items: [QuestItemSchema],
    order: Number,
    isActive: { type: Boolean, default: true },
    xpReward: Number
}, { timestamps: true });

async function seed() {
    try {
        await mongoose.connect('mongodb://localhost:27017/infano');
        console.log('Connected to MongoDB');

        // Clear existing data
        await mongoose.model('Journey', JourneySchema).deleteMany({});
        await mongoose.model('Quest', QuestSchema).deleteMany({});

        const JourneyModel = mongoose.model('Journey', JourneySchema);
        const QuestModel = mongoose.model('Quest', QuestSchema);

        // 1. Create Journey: "Understanding Your Body"
        const journey = await JourneyModel.create({
            slug: "understanding-your-body",
            title: "Understanding Your Body",
            description: "Explore the amazing way your body works, from cycles to growth and everything in between.",
            thumbnailUrl: "https://images.unsplash.com/photo-1518173946687-a4c8a9ba332f?auto=format&fit=crop&q=80&w=800",
            totalXP: 500,
            category: "Health & Wellness"
        });

        console.log('Created Journey:', journey._id);

        // 2. Create Quest: "Periods & Their Phases"
        const quest1 = await QuestModel.create({
            journeyId: journey._id,
            title: "Periods & Their Phases",
            slug: "periods-and-their-phases",
            description: "Discover what periods are and the natural rhythm your body follows each month.",
            order: 1,
            xpReward: 150,
            items: [
                {
                    type: 'story_hook',
                    title: 'Periods & Their Phases',
                    content: {
                        text: "Your body is constantly growing, changing, and taking care of you — often in ways you can’t even see.\n\nIn this quest, you’ll discover what periods are, why they happen, and the different phases your body goes through each month.\n\nThere’s nothing to worry about — just curiosity, learning, and understanding yourself better."
                    },
                    order: 0,
                    xpReward: 10
                },
                {
                    type: 'story_hook',
                    title: 'The Garden That Changed Everything',
                    content: {
                        text: "Gigi had always loved stories about magic — the kind where forests whispered secrets, rivers carried messages, and hidden worlds existed just beyond what you could see. But she never imagined that one day, she would discover a quiet kind of magic within her own body.\n\nIt began on a calm afternoon at school. The classroom hummed with chatter as students packed their bags, laughing about homework and weekend plans. But Gigi sat still, feeling something unfamiliar — a soft ache in her lower belly. It wasn’t painful, just strange, like a gentle signal she didn’t yet understand.\n\nThat evening, wrapped in her favorite blanket, the feeling returned. Along with it came curiosity mixed with a tiny flutter of worry. She wondered if something was wrong but didn’t quite know how to explain it.\n\nThe next morning, she noticed a small stain on her clothes. Her heart skipped. For a moment, time felt frozen as questions rushed through her mind.\n\n“Did I hurt myself?”\n“Why is this happening?”\n\nShe called for her mother, who walked in with a calm, reassuring smile that made the room feel warm and safe.\n\n“It looks like your body has started something new,” her mother said gently. “You’ve gotten your first period.”\n\nGigi had heard the word before, whispered by older girls at school like a secret she wasn’t part of yet. Seeing her confusion, her mother sat beside her.\n\n“Think of your body like a beautiful garden,” she said softly.\n\nGigi’s eyes lit up with curiosity.\n\n“Every month, your body prepares this garden for the possibility of growing something new. It creates a soft, cozy lining inside — like laying down fresh soil and gentle pillows. And when the garden isn’t needed, your body clears it away to make space for a new beginning. That’s what a period is.”\n\nGigi imagined a peaceful garden changing with the seasons, leaves falling and new buds forming. Suddenly, it didn’t feel scary. It felt natural — even beautiful.\n\nOver the next few days, she noticed small changes. Sometimes she felt tired, sometimes a little emotional, but she also felt proud. Her body was doing something meaningful, something shared by millions of girls and women everywhere.\n\nAt school, she began noticing conversations she had never paid attention to before. She realized she wasn’t alone — every girl’s body had its own rhythm, like a quiet song playing in the background.\n\nOne afternoon, sitting with her best friend Meera, she shared what she had learned.\n\n“My mom says it’s like seasons,” Gigi said. “A cycle.”\n\nMeera smiled. “I like that. It makes it feel less confusing.”\n\nThey talked openly, and instead of feeling awkward, Gigi felt a sense of understanding and connection.\n\nShe began to see that her body moved through different phases — times when she felt energetic and bright, times when she felt thoughtful, and times when she needed rest. Each phase felt like a different season in her personal garden.\n\nSlowly, the mystery turned into confidence.\n\nOne evening, as she wrote in her journal, she paused and smiled.\n\n“My body isn’t confusing,” she wrote. “It’s amazing.”\n\nBecause she had discovered something important—her body wasn’t working against her. It was working for her, caring for her in quiet, powerful ways she was only beginning to understand.\n\nAnd just like that, the garden inside her no longer felt mysterious.\n\nIt felt like home."
                    },
                    order: 1,
                    xpReward: 30
                },
                {
                    type: 'knowledge_check',
                    title: 'What do you think is happening?',
                    content: {
                        questions: [
                            {
                                question: 'Riya notices that she feels a little more tired and emotional this week. She also remembers that her period is about to start soon. Why do you think she might be feeling this way?',
                                options: [
                                    'Because she didn’t sleep enough',
                                    'Because hormones can change feelings before a period',
                                    'Because periods only affect the body, not emotions',
                                    'Because she did something wrong'
                                ],
                                correctOptionIndex: 1,
                                feedback: "Your body’s hormones can influence how you feel during different phases of your cycle. Feeling emotional or having low energy before your period is completely normal."
                            }
                        ]
                    },
                    order: 2,
                    xpReward: 40
                },
                {
                    type: 'video_activity',
                    title: 'Watch & Learn',
                    content: {
                        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
                        description: "Watch this short video to understand:\n✔ What menstruation is\n✔ Why it happens\n✔ The four phases of your cycle\n\nAs you watch, notice one new thing you didn’t know before."
                    },
                    order: 3,
                    xpReward: 20
                },
                {
                    type: 'learning_cards',
                    title: 'Explore the Phases',
                    content: {
                        cards: [
                            { title: 'WHAT IS MENSTRUATION', content: 'Menstruation is your body’s way of clearing out the lining of the uterus when it isn’t needed.\nIt’s a healthy and natural process that shows your body is growing and working normally.' },
                            { title: 'THE FOLLICULAR PHASE', content: 'This is the beginning of your cycle when your body prepares an egg and starts building a new lining in the uterus.\nYou may feel more energetic and focused during this phase.' },
                            { title: 'THE OVULATORY PHASE', content: 'This is when your ovary releases an egg.\nIt’s a short but important phase when your body is at its peak of readiness.' },
                            { title: 'THE LUTEAL PHASE', content: 'Your body prepares and waits to see if the egg will be used.\nYou might feel more sensitive or tired during this time—and that’s normal.' },
                            { title: 'THE MENSTRUAL PHASE', content: 'If the egg isn’t needed, your body sheds the lining through your period.\nThis is the start of a new cycle.' }
                        ]
                    },
                    order: 4,
                    xpReward: 30
                },
                {
                    type: 'mini_challenge',
                    title: 'Your Curiosity Matters',
                    content: {
                        question: 'Write one thing you feel curious or unsure about your cycle.\n\nThere are no wrong questions—curiosity helps you understand your body better.',
                        placeholder: "I wonder why..."
                    },
                    order: 5,
                    xpReward: 20
                },
                {
                    type: 'insight',
                    title: 'Personal Insight',
                    content: {
                        fullInsight: "Curiosity is the first step toward confidence.\n\nBy asking questions, you’re learning to understand your body and take care of yourself—and that’s something to be proud of."
                    },
                    order: 6,
                    xpReward: 10
                }
            ]
        });

        console.log('Seeded Journey and Quest 1');

        // 3. Create Quest: "Hormones & Your Body’s Rhythm"
        const quest2 = await QuestModel.create({
            journeyId: journey._id,
            title: "Hormones & Your Body’s Rhythm",
            slug: "hormones-and-your-bodys-rhythm",
            description: "Understanding the messengers inside you",
            order: 2,
            xpReward: 220,
            items: [
                {
                    type: 'story_hook',
                    title: '🌿 Hormones & Your Body’s Rhythm',
                    content: {
                        text: "Have you ever wondered why some days you feel energetic, while other days you feel tired or emotional?\n\nYour body has tiny messengers called hormones that help guide these changes.\n\nIn this quest, you’ll discover how hormones work, why your cycle length can vary, and how tracking helps you understand your body better."
                    },
                    order: 0,
                    xpReward: 10
                },
                {
                    type: 'story_hook',
                    title: '“The Secret Signals”',
                    content: {
                        text: "Mira always thought feelings just happened randomly.\n\nOne day she would feel excited and full of energy, talking non-stop with her friends and laughing at the smallest jokes. The next day, she might feel quiet and thoughtful, wanting to sit by the window with her music and just be alone.\n\nAt first, she thought something was wrong.\n\n“Why do I feel so different sometimes?” she wondered.\n\nOne afternoon after school, while working on homework, Mira felt unusually tired. She couldn’t focus, and even small things felt a little annoying. Later that evening, she noticed her period had started.\n\nShe paused and thought, “Is this connected?”\n\nCurious, she decided to talk to her older cousin, who listened with a warm smile.\n\n“Have you ever heard of hormones?” her cousin asked.\n\nMira shook her head slowly.\n\n“Well,” she said, “hormones are like tiny messengers in your body. They travel around giving instructions — telling your body when to grow, when to rest, and even influencing how you feel.”\n\nMira imagined tiny glowing messengers moving through her body like fireflies carrying notes.\n\nHer cousin continued, “During your cycle, different hormones take turns leading. Sometimes they give you more energy, and sometimes they tell your body to slow down. It’s like traffic lights guiding cars so everything runs smoothly.”\n\nThat made sense to Mira.\n\nOver the next few weeks, she started paying attention. She noticed that right after her period, she felt more motivated. Midway through the month, she felt cheerful and social. And just before her period, she sometimes felt more sensitive or tired.\n\nInstead of feeling confused, she started feeling curious.\n\nShe even began marking the first day of her period on a calendar. Soon, she could predict when it might come and noticed patterns in how she felt.\n\nOne day she wrote in her journal:\n\n“My body isn’t random — it’s rhythmic.”\n\nThat realization made her feel calm.\n\nShe understood that her emotions weren’t something to fight against — they were signals, like gentle whispers helping her understand herself better.\n\nAnd from that moment, Mira stopped worrying about why she felt different sometimes. Instead, she started listening.\n\nBecause she had discovered the secret — her body was always communicating with her, and now she knew how to understand its signals."
                    },
                    order: 1,
                    xpReward: 30
                },
                {
                    type: 'knowledge_check',
                    title: 'Let’s explore what you already know',
                    content: {
                        questions: [
                            {
                                question: 'Sara feels more emotional and tired a few days before her period starts. Why might this be happening?',
                                options: [
                                    'She did something wrong',
                                    'Hormones change before a period',
                                    'It only happens to adults',
                                    'She should ignore it'
                                ],
                                correctOptionIndex: 1,
                                feedback: "Hormonal changes before your period can affect mood and energy — this is completely normal."
                            },
                            {
                                question: 'Ananya’s cycle is 30 days, while her friend’s is 25 days. What does this mean?',
                                options: [
                                    'One of them is unhealthy',
                                    'Cycles can vary and both can be normal',
                                    'Only 28 days is correct',
                                    'They need to fix it'
                                ],
                                correctOptionIndex: 1,
                                feedback: "Everyone’s body is unique — cycle lengths can vary and still be healthy."
                            },
                            {
                                question: 'Why is tracking your cycle helpful?',
                                options: [
                                    'To understand patterns in your body',
                                    'To predict your period',
                                    'To notice changes',
                                    'All of the above'
                                ],
                                correctOptionIndex: 3,
                                feedback: "Tracking helps you understand your body better and feel prepared."
                            }
                        ]
                    },
                    order: 2,
                    xpReward: 40
                },
                {
                    type: 'video_activity',
                    title: '🎬 Watch & Discover',
                    content: {
                        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
                        description: "Watch this video to learn:\n✔ How hormones guide your cycle\n ✔ Why your cycle length can vary\n ✔ Why tracking helps you understand your body\nAs you watch, notice one thing that surprises you."
                    },
                    order: 3,
                    xpReward: 20
                },
                {
                    type: 'learning_cards',
                    title: 'Meet Your Hormone Messengers',
                    content: {
                        cards: [
                            { title: 'WHAT ARE HORMONES', content: 'Hormones are tiny messengers that travel through your body giving instructions. They help control growth, mood, energy, and your menstrual cycle.' },
                            { title: 'FSH & ESTROGEN (THE STARTERS)', content: 'FSH helps prepare an egg in your ovary. Estrogen builds the soft lining of your uterus. You may feel more energetic during this time.' },
                            { title: 'LH (THE SIGNAL)', content: 'LH tells your body when to release the egg. It’s like a green light starting the next phase.' },
                            { title: 'PROGESTERONE (THE CARETAKER)', content: 'Progesterone helps maintain the lining of the uterus. You might feel more tired or sensitive during this phase.' },
                            { title: 'WHY CYCLE LENGTH VARIES', content: 'Cycles can range from 21 to 35 days. Stress, sleep, diet, and growth can affect length. Everybody has its own rhythm.' },
                            { title: 'WHY TRACKING HELPS', content: 'Tracking helps you:\n✔ Predict your period.\n ✔ Notice patterns\n ✔ Understand your feelings\n ✔ Feel prepared' }
                        ]
                    },
                    order: 4,
                    xpReward: 50
                },
                {
                    type: 'mini_challenge',
                    title: 'Your Body Signals Map',
                    content: {
                        question: 'Think about the last time you noticed a change in your mood, energy, or body. Write one thing you noticed or would like to start paying attention to in your cycle.',
                        placeholder: "“I noticed that…”"
                    },
                    order: 5,
                    xpReward: 20
                },
                {
                    type: 'insight',
                    title: 'Personal Insight',
                    content: {
                        fullInsight: "Your body is always communicating with you through small signals. By paying attention, you’re learning one of the most powerful skills — understanding yourself."
                    },
                    order: 6,
                    xpReward: 10
                },
                {
                    type: 'insight',
                    title: 'Amazing Progress!',
                    content: {
                        fullInsight: "You’ve learned how hormones guide your cycle and why every body has its own rhythm. Understanding this helps you feel more confident and prepared.\n\n🏅 Badge unlocked: Rhythm Explorer\n ⭐ +40 XP"
                    },
                    order: 7,
                    xpReward: 40
                }
            ]
        });

        console.log('Seeded Journey, Quest 1, and Quest 2');
        process.exit(0);

    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seed();
