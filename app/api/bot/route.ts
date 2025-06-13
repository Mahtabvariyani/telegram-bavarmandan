export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { Bot, webhookCallback, InlineKeyboard } from 'grammy'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) throw new Error('TELEGRAM_BOT_TOKEN environment variable not found.')

const bot = new Bot(token)

const TARGET_CHANNEL = "@salebeyekoliyeh"

// حالت انتخاب بین فایل یا پیام
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("📄 ارسال فایل", "send_file")
    .text("💬 ارسال پیام", "send_message")

  await ctx.reply("سلام! به ربات خوش آمدید. لطفاً یکی از گزینه‌ها را انتخاب کنید:", {
    reply_markup: keyboard,
  })
})

const userStates = new Map<number, "awaiting_file" | "awaiting_text">()

// واکنش به انتخاب گزینه‌ها
bot.callbackQuery("send_file", async (ctx) => {
  userStates.set(ctx.from.id, "awaiting_file")
  await ctx.answerCallbackQuery()
  await ctx.reply("لطفاً فایل PDF خود را ارسال کنید.")
})

bot.callbackQuery("send_message", async (ctx) => {
  userStates.set(ctx.from.id, "awaiting_text")
  await ctx.answerCallbackQuery()
  await ctx.reply("لطفاً پیام خود را بنویسید.")
})

// مدیریت پیام‌ها بسته به حالت کاربر
bot.on("message", async (ctx) => {
  const state = userStates.get(ctx.from.id)

  if (state === "awaiting_file") {
    if (ctx.message.document && ctx.message.document.mime_type === "application/pdf") {
      try {
        await ctx.api.forwardMessage(TARGET_CHANNEL, ctx.chat.id, ctx.message.message_id)
        await ctx.reply("فایل شما با موفقیت ارسال شد. متشکرم!")
      } catch (err) {
        await ctx.reply("خطا در ارسال فایل. لطفاً دوباره تلاش کنید.")
      }
    } else {
      await ctx.reply("فقط فایل PDF مجاز است. لطفاً مجدداً امتحان کنید.")
    }
    userStates.delete(ctx.from.id)
  }

  else if (state === "awaiting_text") {
    if (ctx.message.text) {
      try {
        await ctx.api.sendMessage(TARGET_CHANNEL, `پیام از ${ctx.from.first_name}:\n${ctx.message.text}`)
        await ctx.reply("پیام شما با موفقیت ارسال شد. متشکرم!")
      } catch (err) {
        await ctx.reply("خطا در ارسال پیام. لطفاً دوباره تلاش کنید.")
      }
    } else {
      await ctx.reply("لطفاً فقط پیام متنی ارسال کنید.")
    }
    userStates.delete(ctx.from.id)
  }

  else {
    await ctx.reply("لطفاً ابتدا دستور /start را بزنید.")
  }
})

export const POST = webhookCallback(bot, 'std/http')
