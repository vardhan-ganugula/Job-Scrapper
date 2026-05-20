import axios from "axios";
import { telegramBotToken } from "@utils/config.util.js";

interface MessageBody {
  from: {
    id: number;
    username?: string;
    first_name?: string;
  };
  chat: {
    id: number;
    username?: string;
    first_name?: string;
  };
  text: string;
}

class TelegramController {
    telegramBotToken : string;
    apiUrl : string;
  constructor(telegramBotToken : string) {
    this.telegramBotToken = telegramBotToken;
    this.apiUrl = `https://api.telegram.org/bot${this.telegramBotToken}`;
  }

  async init(webhookUrl : string) {
    try {
      const response = await axios.post(`${this.apiUrl}/setWebhook`, {
        url: webhookUrl,
      });
      console.log("WebHook set Successfully");
      return response.data;
    } catch (error: unknown) {
      console.error("Error initializing Telegram bot:", (error as Error)?.message);
      throw error;
    }
  }

  async sendMessage(chatId : MessageBody['chat']['id'], message : string) {
    const response = await axios.post(`${this.apiUrl}/sendMessage`, {
      chat_id: chatId,
      text: message,
    });
    return response.data;
  }

  async parseMessage(message : MessageBody) {
    const { from, chat, text } = message;
    if (!from?.id || !chat?.id) {
      return;
    }
    if (text[0] == "/") {
      await this.replyCommands(chat, text);
    } else {
      await this.replyAi(chat.id, text);
    }
  }

  async replyCommands(chat : MessageBody['chat'], text : MessageBody['text']) {
    try {
      let responseText = "";
      const commandText = text.split(" ");

      switch (commandText[0]) {
        case "/start":
          // await this.__createUser(chat.id, chat.username, chat.first_name);
          responseText =
            "👋 Welcome to the Job Listener!\n\nPlease share your resume text to store it.\n\nYou can also use the /help command to get started.";
          break;

        case "/help":
          responseText =
            "🧭 Here are my commands:\n/start - Start the bot\n/help - Get help\n/about - Learn about me\n/resume - Upload your resume text";
          break;

        case "/about":
          responseText =
            "🤖 I am a job listener bot that analyzes your resume using AI and notifies you when matching jobs are found!";
          break;

        case "/resume":
          const resumeText = text.split(" ").slice(1).join(" ");
          if (!resumeText) {
            responseText =
              "❗ Please provide your resume text after the command.\nExample: /resume Full Stack Developer skilled in React and Node.js";
          } else {
            // await this._updateResume(chat.id, resumeText);
            responseText = "✅ Resume saved successfully!";
          }
          break;

        case "/update":
          if (commandText.length > 1) {
            const textMessage = commandText.slice(1).join(' ').trim()
            // responseText = await this.updateJobDetails(chat.id, textMessage);
          } else responseText = "Invalid Command Format";
          break;
        default:
          responseText =
            "❌ Unknown command.\nUse /help to see the available commands.";
      }

      const response = await this.sendMessage(chat.id, responseText);
      return response;
    } catch (error: unknown) {
      console.error("Error replying to command:", (error as Error)?.message);
      await this.sendMessage(
        chat.id,
        "⚠️ Internal error. Please try again later."
      );
    }
  }

  async replyAi(chatId : MessageBody['chat']['id'], text : MessageBody['text']) {}


  async sendJobDetailsToUsers(jobData = "") {
    
  }

  async updateJobDetails(userId : number, resumeDetails : string) {
  }
}

const telegramController = new TelegramController(telegramBotToken);

export default telegramController;