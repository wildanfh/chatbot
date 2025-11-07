# WhatsApp AI Bot with Ollama

This is a WhatsApp bot powered by **Ollama** (offline LLM) and **WhatsApp Web.js**, capable of chatting with users, managing conversation history, and responding with AI.  

---

## Features

- Chat with AI directly on WhatsApp  
- Offline AI using **Ollama** (supports models like `llama3.2`, `llama3.1`, etc.)  
- Conversation history per user (last 5 exchanges)  
- AI typing indicator  
- Commands for bot control:
  - `!help` → Show available commands  
  - `!reset` → Clear conversation history  
  - `!status` → Check AI model status  
  - `!model [name]` → Switch AI model  
  - `!ping` → Check bot status  

---

## Requirements

- Node.js v18+  
- Ollama installed and running locally ([https://ollama.com](https://ollama.com))  
- WhatsApp account for authentication  

---

## Installation

1. Clone this repository:

```bash
git clone https://github.com/wildanfh/chatbot.git
cd chatbot
````

2. Install dependencies:

```bash
npm install
```

3. Make sure `.gitignore` includes:

```
node_modules/
.wwebjs/
```

4. Install and run Ollama:

```bash
# Install Ollama from https://ollama.com/download
ollama serve
```

---

## Configuration

* **AI Model:** You can change the model by editing the `modelName` variable in `index.js` or using the `!model [name]` command in WhatsApp.
* **Local WhatsApp session:** Stored in `.wwebjs` folder (ignored by Git).

---

## Usage

1. Start the bot:

```bash
node index.js
```

2. Scan the QR code displayed in the terminal using your WhatsApp.
3. Start chatting with the bot or use commands like `!help` for guidance.

---

## Bot Commands

| Command         | Description                               |
| --------------- | ----------------------------------------- |
| `!help`         | Show help message with available commands |
| `!reset`        | Clear conversation history                |
| `!status`       | Check if AI model is ready                |
| `!model [name]` | Switch to another AI model                |
| `!ping`         | Check if bot is active                    |

---

## Notes

* The bot ignores **group messages** to prevent spam.
* Conversation history is limited to the **last 5 exchanges** per user.
* Make sure Ollama is running locally before starting the bot, or AI responses will fail.

---

## Graceful Shutdown

Press `CTRL+C` to stop the bot. The WhatsApp client will destroy its session and exit safely.

---

## License

MIT License
