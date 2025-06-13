export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { Bot, webhookCallback, InlineKeyboard } from 'grammy'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) throw new Error('TELEGRAM_BOT_TOKEN environment variable not found.')

const bot = new Bot(token)

const TARGET_CHANNEL = "-1002667114289" // ID of your group (must start with -100...)

const userStates = new Map<number, "awaiting_file" | "awaiting_text">()
const messageMap = new Map<number, number>() // groupMessageId => userId

// Start command with keyboard
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("\uD83D\uDCC4 \u0627\u0631\u0633\u0627\u0644 \u0641\u0627\u06CC\u0644", "send_file")
    .text("\uD83D\uDCAC \u0627\u0631\u0633\u0627\u0644 \u067E\u06CC\u0627\u0645", "send_message")

  await ctx.reply("\u0633\u0644\u0627\u0645! \u0628\u0647 \u0631\u0628\u0627\u062A \u062E\u0648\u0634 \u0622\u0645\u062F\u06CC\u062F. \u0644\u0637\u0641\u0627\u064B \u06CC\u06A9\u06CC \u0627\u0632 \u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F:", {
    reply_markup: keyboard,
  })
})

// Handle option selection
bot.callbackQuery("send_file", async (ctx) => {
  userStates.set(ctx.from.id, "awaiting_file")
  await ctx.answerCallbackQuery()
  await ctx.reply("\u0644\u0637\u0641\u0627 \u0641\u0627\u06CC\u0644 PDF \u062E\u0648\u062F \u0631\u0627 \u0627\u0631\u0633\u0627\u0644 \u06A9\u0646\u06CC\u062F.")
})

bot.callbackQuery("send_message", async (ctx) => {
  userStates.set(ctx.from.id, "awaiting_text")
  await ctx.answerCallbackQuery()
  await ctx.reply("\u0644\u0637\u0641\u0627 \u067E\u06CC\u0627\u0645 \u062E\u0648\u062F \u0631\u0627 \u0628\u0646\u0648\u06CC\u0633\u06CC\u062F.")
})

// Handle messages from users or admins
bot.on("message", async (ctx) => {
  const isGroup = ctx.chat.id.toString() === TARGET_CHANNEL
  const reply = ctx.message.reply_to_message

  if (isGroup && reply) {
    // Admin replying to a forwarded message
    const userId = messageMap.get(reply.message_id)
    if (userId) {
      try {
        await ctx.api.sendMessage(userId, `\uD83D\uDC64 \u067E\u0627\u0633\u062E \u0627\u0632 \u0627\u062F\u0645\u06CC\u0646:\n${ctx.message.text}`)
        await ctx.reply("\u067E\u0627\u0633\u062E \u0628\u0647 \u06A9\u0627\u0631\u0628\u0631 \u0627\u0631\u0633\u0627\u0644 \u0634\u062F.", {
          reply_to_message_id: ctx.message.message_id,
        })
      } catch (err) {
        await ctx.reply("\u062E\u0637\u0627 \u062F\u0631 \u0627\u0631\u0633\u0627\u0644 \u067E\u0627\u0633\u062E \u0628\u0647 \u06A9\u0627\u0631\u0628\u0631.")
      }
    }
    return
  }

  // From users
  const state = userStates.get(ctx.from.id)

  if (state === "awaiting_file") {
    if (ctx.message.document && ctx.message.document.mime_type === "application/pdf") {
      try {
        const sent = await ctx.api.forwardMessage(TARGET_CHANNEL, ctx.chat.id, ctx.message.message_id)
        messageMap.set(sent.message_id, ctx.from.id)
        await ctx.reply("\u0641\u0627\u06CC\u0644 \u0634\u0645\u0627 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0631\u0633\u0627\u0644 \u0634\u062F. \u0645\u062A\u0634\u06A9\u0631\u0645!")
      } catch (err) {
        await ctx.reply("\u062E\u0637\u0627 \u062F\u0631 \u0627\u0631\u0633\u0627\u0644 \u0641\u0627\u06CC\u0644. \u0644\u0637\u0641\u0627 \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F.")
      }
    } else {
      await ctx.reply("\u0641\u0642\u0637 \u0641\u0627\u06CC\u0644 PDF \u0645\u062C\u0627\u0632 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627 \u0645\u062C\u062F\u062F\u0627\u064B \u0627\u0645\u062A\u062D\u0627\u0646 \u06A9\u0646\u06CC\u062F.")
    }
    userStates.delete(ctx.from.id)
  } else if (state === "awaiting_text") {
    if (ctx.message.text) {
      try {
        const sent = await ctx.api.sendMessage(TARGET_CHANNEL, `\u067E\u06CC\u0627\u0645 \u0627\u0632 ${ctx.from.first_name} (@${ctx.from.username || "بدون نام کاربری"}):\n${ctx.message.text}`)
        messageMap.set(sent.message_id, ctx.from.id)
        await ctx.reply("\u067E\u06CC\u0627\u0645 \u0634\u0645\u0627 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0631\u0633\u0627\u0644 \u0634\u062F. \u0645\u062A\u0634\u06A9\u0631\u0645!")
      } catch (err) {
        await ctx.reply("\u062E\u0637\u0627 \u062F\u0631 \u0627\u0631\u0633\u0627\u0644 \u067E\u06CC\u0627\u0645. \u0644\u0637\u0641\u0627 \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F.")
      }
    } else {
      await ctx.reply("\u0644\u0637\u0641\u0627 \u0641\u0642\u0637 \u067E\u06CC\u0627\u0645 \u0645\u062A\u0646\u06CC \u0627\u0631\u0633\u0627\u0644 \u06A9\u0646\u06CC\u062F.")
    }
    userStates.delete(ctx.from.id)
  } else {
    await ctx.reply("\u0644\u0637\u0641\u0627 \u0627\u0628\u062A\u062F\u0627 \u062F\u0633\u062A\u0648\u0631 /start \u0631\u0627 \u0627\u062C\u0631\u0627 \u06A9\u0646\u06CC\u062F.")
  }
})

export const POST = webhookCallback(bot, 'std/http')
