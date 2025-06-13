export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { Bot, webhookCallback, Keyboard } from 'grammy'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) throw new Error('TELEGRAM_BOT_TOKEN environment variable not found.')

const bot = new Bot(token)
const TARGET_CHANNEL = "-1002667114289"

const userStates = new Map<number, "awaiting_file" | "awaiting_text" | "feedback">()
const messageMap = new Map<number, number>()

// Main menu keyboard
const mainKeyboard = new Keyboard()
  .text("📄 ارسال فایل پی‌دی‌اف")
  .text("💬 ارسال پیام")
  .row()
  .text("✏️ نظرات و پیشنهادات")
  .text("ℹ️ درباره ما")
  .row()
  .text("🌐 لینک سایت")
  .resized()

bot.command("start", async (ctx) => {
  await ctx.reply("سلام! به ربات خوش آمدید. لطفاً یکی از گزینه‌ها را انتخاب کنید:", {
    reply_markup: mainKeyboard,
  })
})

// Main menu handler
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text

  if (text === "📄 ارسال فایل پی‌دی‌اف") {
    userStates.set(ctx.from.id, "awaiting_file")
    await ctx.reply("لطفاً فایل PDF خود را ارسال کنید.")
  }

  else if (text === "💬 ارسال پیام") {
    userStates.set(ctx.from.id, "awaiting_text")
    await ctx.reply("لطفاً پیام خود را بنویسید.")
  }

  else if (text === "✏️ نظرات و پیشنهادات") {
    userStates.set(ctx.from.id, "feedback")
    await ctx.reply("لطفاً نظر یا پیشنهاد خود را ارسال نمایید.")
  }

  else if (text === "ℹ️ درباره ما") {
    await ctx.reply("این ربات جهت ارتباط راحت‌تر با ما طراحی شده است. می‌توانید پیام یا فایل خود را ارسال کنید.")
  }

  else if (text === "🌐 لینک سایت") {
    await ctx.reply("برای بازدید از سایت ما اینجا کلیک کنید:", {
      reply_markup: {
        inline_keyboard: [[{ text: "ورود به سایت", url: "https://canyoutell.vercel.app/" }]]
      }
    })
  }

  else {
    const state = userStates.get(ctx.from.id)

    if (state === "awaiting_file") {
      if (ctx.message.document && ctx.message.document.mime_type === "application/pdf") {
        try {
          const sent = await ctx.api.forwardMessage(TARGET_CHANNEL, ctx.chat.id, ctx.message.message_id)
          messageMap.set(sent.message_id, ctx.from.id)
          await ctx.reply("فایل شما با موفقیت ارسال شد. متشکرم!")
        } catch {
          await ctx.reply("خطا در ارسال فایل. لطفاً دوباره تلاش کنید.")
        }
      } else {
        await ctx.reply("فقط فایل PDF مجاز است. لطفاً مجدداً امتحان کنید.")
      }
      userStates.delete(ctx.from.id)
    }

    else if (state === "awaiting_text" || state === "feedback") {
      if (ctx.message.text) {
        try {
          const label = state === "feedback" ? "نظر/پیشنهاد" : "پیام"
          const sent = await ctx.api.sendMessage(TARGET_CHANNEL, `${label} از ${ctx.from.first_name} (@${ctx.from.username || "بدون نام کاربری"}):\n${ctx.message.text}`)
          messageMap.set(sent.message_id, ctx.from.id)
          await ctx.reply(`${label} شما با موفقیت ارسال شد. متشکرم!`)
        } catch {
          await ctx.reply("خطا در ارسال پیام. لطفاً دوباره تلاش کنید.")
        }
      } else {
        await ctx.reply("لطفاً فقط پیام متنی ارسال کنید.")
      }
      userStates.delete(ctx.from.id)
    }
  }
})

export const POST = webhookCallback(bot, 'std/http')
