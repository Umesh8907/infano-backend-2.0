const mongoose = require('mongoose');

// Define Schemas (simplified for seeding - must match NestJS models)
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
}, { _id: true }); // items need _id for progress tracking

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

const QUEST1_STORY = `Gigi had always loved stories about magic — the kind where forests whispered secrets, rivers carried messages, and hidden worlds existed just beyond what you could see. But she never imagined that one day, she would discover a quiet kind of magic within her own body.
It began on a calm afternoon at school. The classroom hummed with chatter as students packed their bags, laughing about homework and weekend plans. But Gigi sat still, feeling something unfamiliar — a soft ache in her lower belly. It wasn't painful, just strange, like a gentle signal she didn't yet understand.
That evening, wrapped in her favorite blanket, the feeling returned. Along with it came curiosity mixed with a tiny flutter of worry. She wondered if something was wrong but didn't quite know how to explain it.
The next morning, she noticed a small stain on her clothes. Her heart skipped. For a moment, time felt frozen as questions rushed through her mind.
"Did I hurt myself?"
"Why is this happening?"
She called for her mother, who walked in with a calm, reassuring smile that made the room feel warm and safe.
"It looks like your body has started something new," her mother said gently. "You've gotten your first period."
Gigi had heard the word before, whispered by older girls at school like a secret she wasn't part of yet. Seeing her confusion, her mother sat beside her.
"Think of your body like a beautiful garden," she said softly.
Gigi's eyes lit up with curiosity.
"Every month, your body prepares this garden for the possibility of growing something new. It creates a soft, cozy lining inside — like laying down fresh soil and gentle pillows. And when the garden isn't needed, your body clears it away to make space for a new beginning. That's what a period is."
Gigi imagined a peaceful garden changing with the seasons, leaves falling and new buds forming. Suddenly, it didn't feel scary. It felt natural — even beautiful.
Over the next few days, she noticed small changes. Sometimes she felt tired, sometimes a little emotional, but she also felt proud. Her body was doing something meaningful, something shared by millions of girls and women everywhere.
At school, she began noticing conversations she had never paid attention to before. She realized she wasn't alone — every girl's body had its own rhythm, like a quiet song playing in the background.
One afternoon, sitting with her best friend Meera, she shared what she had learned.
"My mom says it's like seasons," Gigi said. "A cycle."
Meera smiled. "I like that. It makes it feel less confusing."
They talked openly, and instead of feeling awkward, Gigi felt a sense of understanding and connection.
She began to see that her body moved through different phases — times when she felt energetic and bright, times when she felt thoughtful, and times when she needed rest. Each phase felt like a different season in her personal garden.
Slowly, the mystery turned into confidence.
One evening, as she wrote in her journal, she paused and smiled.
"My body isn't confusing," she wrote. "It's amazing."
Because she had discovered something important—her body wasn't working against her. It was working for her, caring for her in quiet, powerful ways she was only beginning to understand.
And just like that, the garden inside her no longer felt mysterious.
It felt like home.`;

const QUEST2_STORY = `Mira always thought feelings just happened randomly.
One day she would feel excited and full of energy, talking non-stop with her friends and laughing at the smallest jokes. The next day, she might feel quiet and thoughtful, wanting to sit by the window with her music and just be alone.
At first, she thought something was wrong.
"Why do I feel so different sometimes?" she wondered.
One afternoon after school, while working on homework, Mira felt unusually tired. She couldn't focus, and even small things felt a little annoying. Later that evening, she noticed her period had started.
She paused and thought, "Is this connected?"
Curious, she decided to talk to her older cousin, who listened with a warm smile.
"Have you ever heard of hormones?" her cousin asked.
Mira shook her head slowly.
"Well," she said, "hormones are like tiny messengers in your body. They travel around giving instructions — telling your body when to grow, when to rest, and even influencing how you feel."
Mira imagined tiny glowing messengers moving through her body like fireflies carrying notes.
Her cousin continued, "During your cycle, different hormones take turns leading. Sometimes they give you more energy, and sometimes they tell your body to slow down. It's like traffic lights guiding cars so everything runs smoothly."
That made sense to Mira.
Over the next few weeks, she started paying attention. She noticed that right after her period, she felt more motivated. Midway through the month, she felt cheerful and social. And just before her period, she sometimes felt more sensitive or tired.
Instead of feeling confused, she started feeling curious.
She even began marking the first day of her period on a calendar. Soon, she could predict when it might come and noticed patterns in how she felt.
One day she wrote in her journal:
"My body isn't random — it's rhythmic."
That realization made her feel calm.
She understood that her emotions weren't something to fight against — they were signals, like gentle whispers helping her understand herself better.
And from that moment, Mira stopped worrying about why she felt different sometimes. Instead, she started listening.
Because she had discovered the secret — her body was always communicating with her, and now she knew how to understand its signals.`;

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/infano');
        console.log('Connected to MongoDB');

        const JourneyModel = mongoose.model('Journey', JourneySchema);
        const QuestModel = mongoose.model('Quest', QuestSchema);

        // Clear existing data
        await QuestModel.deleteMany({});
        await JourneyModel.deleteMany({});

        // 1. Create Journey: "Understanding Your Body"
        const journey = await JourneyModel.create({
            slug: 'understanding-your-body',
            title: 'Understanding Your Body',
            description: 'Explore the amazing way your body works, from cycles to growth and everything in between.',
            thumbnailUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a9ba332f?auto=format&fit=crop&q=80&w=800',
            totalXP: 75,
            category: 'Health & Wellness',
            isActive: true
        });
        console.log('Created Journey:', journey._id);

        // ——— QUEST 1: PERIODS AND THEIR PHASES ———
        const quest1Items = [
            // SCREEN 1 — Quest Intro
            {
                type: 'story_hook',
                title: '🌙 Periods & Their Phases',
                content: {
                    subtitle: "Understanding your body's natural rhythm",
                    text: "Your body is constantly growing, changing, and taking care of you — often in ways you can't even see.\n\nIn this quest, you'll discover what periods are, why they happen, and the different phases your body goes through each month.\n\nThere's nothing to worry about — just curiosity, learning, and understanding yourself better."
                },
                order: 0,
                xpReward: 0
            },
            // SCREEN 2 — Story Hook
            {
                type: 'story_hook',
                title: '"The Garden That Changed Everything"',
                content: { text: QUEST1_STORY },
                order: 1,
                xpReward: 5
            },
            // SCREEN 3 — Knowledge Check
            {
                type: 'knowledge_check',
                title: "Let's Understand Your Knowledge",
                content: {
                    questions: [{
                        question: "Riya notices that she feels a little more tired and emotional this week. She also remembers that her period is about to start soon. Why do you think she might be feeling this way?",
                        options: [
                            'Because she didn\'t sleep enough',
                            'Because hormones can change feelings before a period',
                            'Because periods only affect the body, not emotions',
                            'Because she did something wrong'
                        ],
                        correctOptionIndex: 1,
                        feedback: "Your body's hormones can influence how you feel during different phases of your cycle. Feeling emotional or having low energy before your period is completely normal."
                    }]
                },
                order: 2,
                xpReward: 5
            },
            // SCREEN 4 — Video Activity
            {
                type: 'video_activity',
                title: '🎬 Watch & Learn',
                content: {
                    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    description: "Watch this short video to understand:\n✔ What menstruation is\n✔ Why it happens\n✔ The four phases of your cycle\n\nAs you watch, notice one new thing you didn't know before."
                },
                order: 3,
                xpReward: 5
            },
            // SCREEN 5 — Learning Cards
            {
                type: 'learning_cards',
                title: 'Explore the Phases',
                content: {
                    cards: [
                        { title: 'WHAT IS MENSTRUATION', content: "Menstruation is your body's way of clearing out the lining of the uterus when it isn't needed. It's a healthy and natural process that shows your body is growing and working normally." },
                        { title: 'THE FOLLICULAR PHASE', content: "This is the beginning of your cycle when your body prepares an egg and starts building a new lining in the uterus. You may feel more energetic and focused during this phase." },
                        { title: 'THE OVULATORY PHASE', content: "This is when your ovary releases an egg. It's a short but important phase when your body is at its peak of readiness." },
                        { title: 'THE LUTEAL PHASE', content: "Your body prepares and waits to see if the egg will be used. You might feel more sensitive or tired during this time—and that's normal." },
                        { title: 'THE MENSTRUAL PHASE', content: "If the egg isn't needed, your body sheds the lining through your period. This is the start of a new cycle." }
                    ]
                },
                order: 4,
                xpReward: 10
            },
            // SCREEN 6 — Mini Challenge
            {
                type: 'mini_challenge',
                title: 'Your Curiosity Matters',
                content: {
                    question: "Write one thing you feel curious or unsure about your cycle. There are no wrong questions—curiosity helps you understand your body better.",
                    placeholder: '"I wonder why…"'
                },
                order: 5,
                xpReward: 5
            },
            // SCREEN 7 — Personal Insight
            {
                type: 'insight',
                title: 'Personal Insight',
                content: {
                    fullInsight: "Curiosity is the first step toward confidence. By asking questions, you're learning to understand your body and take care of yourself—and that's something to be proud of."
                },
                order: 6,
                xpReward: 2
            },
            // SCREEN 8 — Celebration
            {
                type: 'insight',
                title: 'You Completed Your First Quest!',
                content: {
                    fullInsight: "You took an important step toward understanding your body and its natural rhythm. Every small step like this builds confidence and self-awareness.\n\n🏅 Badge unlocked: Body Learner\n⭐ +35 XP"
                },
                order: 7,
                xpReward: 3
            }
        ];

        await QuestModel.create({
            journeyId: journey._id,
            title: 'Periods & Their Phases',
            slug: 'periods-and-their-phases',
            description: "Understanding your body's natural rhythm",
            order: 1,
            xpReward: 35,
            isActive: true,
            items: quest1Items
        });
        console.log('Seeded Quest 1: Periods & Their Phases');

        // ——— QUEST 2: HORMONES & YOUR BODY'S RHYTHM ———
        const quest2Items = [
            // SCREEN 1 — Quest Intro
            {
                type: 'story_hook',
                title: '🌿 Hormones & Your Body\'s Rhythm',
                content: {
                    subtitle: 'Understanding the messengers inside you',
                    text: "Have you ever wondered why some days you feel energetic, while other days you feel tired or emotional?\n\nYour body has tiny messengers called hormones that help guide these changes.\n\nIn this quest, you'll discover how hormones work, why your cycle length can vary, and how tracking helps you understand your body better."
                },
                order: 0,
                xpReward: 0
            },
            // SCREEN 2 — Story Hook
            {
                type: 'story_hook',
                title: '"The Secret Signals"',
                content: { text: QUEST2_STORY },
                order: 1,
                xpReward: 5
            },
            // SCREEN 3 — Knowledge Check Q1
            {
                type: 'knowledge_check',
                title: "Let's explore what you already know",
                content: {
                    questions: [{
                        question: 'Sara feels more emotional and tired a few days before her period starts. Why might this be happening?',
                        options: [
                            'She did something wrong',
                            'Hormones change before a period',
                            'It only happens to adults',
                            'She should ignore it'
                        ],
                        correctOptionIndex: 1,
                        feedback: "Hormonal changes before your period can affect mood and energy — this is completely normal."
                    }]
                },
                order: 2,
                xpReward: 5
            },
            // Knowledge Check Q2
            {
                type: 'knowledge_check',
                title: "Let's explore what you already know",
                content: {
                    questions: [{
                        question: "Ananya's cycle is 30 days, while her friend's is 25 days. What does this mean?",
                        options: [
                            'One of them is unhealthy',
                            'Cycles can vary and both can be normal',
                            'Only 28 days is correct',
                            'They need to fix it'
                        ],
                        correctOptionIndex: 1,
                        feedback: "Everyone's body is unique — cycle lengths can vary and still be healthy."
                    }]
                },
                order: 3,
                xpReward: 5
            },
            // Knowledge Check Q3
            {
                type: 'knowledge_check',
                title: "Let's explore what you already know",
                content: {
                    questions: [{
                        question: 'Why is tracking your cycle helpful?',
                        options: [
                            'To understand patterns in your body',
                            'To predict your period',
                            'To notice changes',
                            'All of the above'
                        ],
                        correctOptionIndex: 3,
                        feedback: 'Tracking helps you understand your body better and feel prepared.'
                    }]
                },
                order: 4,
                xpReward: 5
            },
            // SCREEN 4 — Video Activity
            {
                type: 'video_activity',
                title: '🎬 Watch & Discover',
                content: {
                    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    description: "Watch this video to learn:\n✔ How hormones guide your cycle\n✔ Why your cycle length can vary\n✔ Why tracking helps you understand your body\n\nAs you watch, notice one thing that surprises you."
                },
                order: 5,
                xpReward: 5
            },
            // SCREEN 5 — Learning Cards (6 cards)
            {
                type: 'learning_cards',
                title: 'Meet Your Hormone Messengers',
                content: {
                    cards: [
                        { title: 'WHAT ARE HORMONES', content: 'Hormones are tiny messengers that travel through your body giving instructions. They help control growth, mood, energy, and your menstrual cycle.' },
                        { title: 'FSH & ESTROGEN (THE STARTERS)', content: 'FSH helps prepare an egg in your ovary. Estrogen builds the soft lining of your uterus. You may feel more energetic during this time.' },
                        { title: 'LH (THE SIGNAL)', content: "LH tells your body when to release the egg. It's like a green light starting the next phase." },
                        { title: 'PROGESTERONE (THE CARETAKER)', content: 'Progesterone helps maintain the lining of the uterus. You might feel more tired or sensitive during this phase.' },
                        { title: 'WHY CYCLE LENGTH VARIES', content: 'Cycles can range from 21 to 35 days. Stress, sleep, diet, and growth can affect length. Everybody has its own rhythm.' },
                        { title: 'WHY TRACKING HELPS', content: 'Tracking helps you:\n✔ Predict your period.\n✔ Notice patterns\n✔ Understand your feelings\n✔ Feel prepared' }
                    ]
                },
                order: 6,
                xpReward: 8
            },
            // SCREEN 6 — Mini Challenge
            {
                type: 'mini_challenge',
                title: 'Your Body Signals Map',
                content: {
                    question: 'Think about the last time you noticed a change in your mood, energy, or body. Write one thing you noticed or would like to start paying attention to in your cycle.',
                    placeholder: '"I noticed that…"'
                },
                order: 7,
                xpReward: 4
            },
            // SCREEN 7 — Personal Insight
            {
                type: 'insight',
                title: 'Personal Insight',
                content: {
                    fullInsight: "Your body is always communicating with you through small signals. By paying attention, you're learning one of the most powerful skills — understanding yourself."
                },
                order: 8,
                xpReward: 2
            },
            // SCREEN 8 — Celebration
            {
                type: 'insight',
                title: 'Amazing Progress!',
                content: {
                    fullInsight: "You've learned how hormones guide your cycle and why every body has its own rhythm. Understanding this helps you feel more confident and prepared.\n\n🏅 Badge unlocked: Rhythm Explorer\n⭐ +40 XP"
                },
                order: 9,
                xpReward: 1
            }
        ];

        await QuestModel.create({
            journeyId: journey._id,
            title: "Hormones & Your Body's Rhythm",
            slug: 'hormones-and-your-bodys-rhythm',
            description: 'Understanding the messengers inside you',
            order: 2,
            xpReward: 40,
            isActive: true,
            items: quest2Items
        });
        console.log('Seeded Quest 2: Hormones & Your Body\'s Rhythm');

        console.log('Seed complete: Journey + 2 Quests with all screens.');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seed();
