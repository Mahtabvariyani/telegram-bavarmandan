import { Bot } from "grammy";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

bot.command("start", (ctx) => ctx.reply("سلام! من ربات شما هستم."));

bot.on("message:text", async (ctx) => {
  await ctx.reply(`پیامت: ${ctx.message.text}`);
});

export default bot;
