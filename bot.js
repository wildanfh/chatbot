const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Ollama } = require('ollama');

// Initialize Ollama
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
let isModelReady = false;
let modelName = 'llama3.2'; // You can change to llama3.1, llama2, mistral, etc.

async function checkModel() {
    try {
        console.log(`🤖 Checking if ${modelName} model is available...`);
        const models = await ollama.list();
        const hasModel = models.models.some(m => m.name.includes(modelName.split(':')[0]));
        
        if (!hasModel) {
            console.log(`📥 Model not found. Pulling ${modelName}... This may take a few minutes.`);
            console.log('💡 Tip: You can cancel and run "ollama pull llama3.2" in another terminal');
            await ollama.pull({ model: modelName, stream: false });
            console.log(`✅ ${modelName} model downloaded successfully!`);
        } else {
            console.log(`✅ ${modelName} model is ready!`);
        }
        
        isModelReady = true;
        return true;
    } catch (error) {
        console.error('❌ Error checking model:', error.message);
        console.log('\n⚠️  Make sure Ollama is installed and running!');
        console.log('📝 Install: https://ollama.com/download');
        console.log('🔧 Start: ollama serve');
        return false;
    }
}

// Initialize the WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Generate QR code for authentication
client.on('qr', (qr) => {
    console.log('Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Client is ready
client.on('ready', async () => {
    console.log('✅ WhatsApp bot is ready!');
    console.log('Bot is now listening for messages...\n');
    
    // Check and download model if needed
    await checkModel();
});

// Handle authentication
client.on('authenticated', () => {
    console.log('✅ Authenticated successfully');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
});

// Conversation history per user (limited to last 5 exchanges)
const conversationHistory = new Map();

function getConversationHistory(userId) {
    if (!conversationHistory.has(userId)) {
        conversationHistory.set(userId, []);
    }
    return conversationHistory.get(userId);
}

function addToHistory(userId, role, content) {
    const history = getConversationHistory(userId);
    history.push({ role, content });
    
    // Keep only last 10 messages (5 exchanges)
    if (history.length > 10) {
        history.shift();
        history.shift();
    }
}

// Handle incoming messages
client.on('message', async (message) => {
    // Ignore group messages to avoid spam (remove this if you want group support)
    const chat = await message.getChat();
    if (chat.isGroup) return;
    
    const userMessage = message.body.trim();
    const userId = message.from;
    
    console.log(`📩 Message from ${userId}: ${userMessage}`);

    // Bot commands
    if (userMessage.toLowerCase() === '!help' || userMessage.toLowerCase() === '/help') {
        await message.reply(
            '🤖 *AI WhatsApp Bot - Commands:*\n\n' +
            '• Just chat naturally - I\'ll respond with AI!\n' +
            '• !help - Show this help message\n' +
            '• !reset - Clear conversation history\n' +
            '• !status - Check AI status\n' +
            '• !model [name] - Change model (e.g., !model llama3.1)\n' +
            '• !ping - Check if bot is active\n\n' +
            `_Current model: ${modelName}_\n` +
            '_Powered by Ollama + Llama (100% free & offline)_'
        );
        return;
    }
    
    if (userMessage.toLowerCase() === '!ping' || userMessage.toLowerCase() === '/ping') {
        await message.reply('🏓 Pong! Bot is active and running.');
        return;
    }
    
    if (userMessage.toLowerCase() === '!reset' || userMessage.toLowerCase() === '/reset') {
        conversationHistory.delete(userId);
        await message.reply('🔄 Conversation history cleared! Starting fresh.');
        return;
    }
    
    if (userMessage.toLowerCase().startsWith('!model ')) {
        const newModel = userMessage.substring(7).trim();
        if (newModel) {
            modelName = newModel;
            await message.reply(`🔄 Switching to model: ${modelName}\nChecking availability...`);
            const ready = await checkModel();
            if (ready) {
                await message.reply(`✅ Now using ${modelName}!`);
            } else {
                await message.reply(`❌ Failed to load ${modelName}. Check if Ollama is running.`);
            }
        }
        return;
    }
    
    if (userMessage.toLowerCase() === '!status' || userMessage.toLowerCase() === '/status') {
        if (isModelReady) {
            await message.reply(`✅ AI is ready!\n\nModel: ${modelName}\nStatus: Operational`);
        } else {
            await message.reply('❌ AI model not ready. Make sure Ollama is running:\n\n1. Install: https://ollama.com\n2. Run: ollama serve\n3. Type !status again');
        }
        return;
    }

    // AI Response
    if (!isModelReady) {
        await message.reply('⚠️ AI not ready. Make sure Ollama is installed and running!\n\nInstall: https://ollama.com\nRun: ollama serve\n\nThen type !status to check.');
        return;
    }

    try {
        // Show typing indicator
        chat.sendStateTyping();
        
        // Get conversation history
        const history = getConversationHistory(userId);
        
        // Build messages array
        const messages = [
            { 
                role: 'system', 
                content: 'You are a helpful AI assistant on WhatsApp. Be concise, friendly, and helpful. Keep responses under 200 words unless asked for more detail.' 
            }
        ];
        
        // Add conversation history
        history.forEach(msg => {
            messages.push({ role: msg.role, content: msg.content });
        });
        
        // Add current message
        messages.push({ role: 'user', content: userMessage });
        
        // Generate AI response
        const response = await ollama.chat({
            model: modelName,
            messages: messages,
            stream: false,
            options: {
                temperature: 0.7,
                num_predict: 300
            }
        });
        
        const aiResponse = response.message.content.trim();
        
        // Save to history
        addToHistory(userId, 'user', userMessage);
        addToHistory(userId, 'assistant', aiResponse);
        
        // Send response
        await message.reply(aiResponse);
        
        console.log(`✅ AI responded to ${userId}`);
        
    } catch (error) {
        console.error('Error generating AI response:', error.message);
        
        if (error.message.includes('connect ECONNREFUSED')) {
            await message.reply('❌ Cannot connect to Ollama. Make sure it\'s running:\n\nRun: ollama serve');
        } else if (error.message.includes('not found')) {
            await message.reply(`❌ Model "${modelName}" not found. Downloading...\n\nThis may take a few minutes.`);
            await checkModel();
        } else {
            await message.reply('❌ Sorry, I encountered an error. Please try again or type !reset to clear history.');
        }
    }
});

// Handle disconnection
client.on('disconnected', (reason) => {
    console.log('❌ Client was disconnected:', reason);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await client.destroy();
    process.exit(0);
});

// Initialize the client
console.log('🚀 Starting WhatsApp AI bot with Ollama...');
console.log('📦 Make sure Ollama is installed: https://ollama.com\n');
client.initialize();
