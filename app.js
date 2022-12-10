/*
 * @Author: goooajw@gmail.com
 * @Date: 2022-12-07 16:52:36
 * @LastEditors: Solid Ji
 * @LastEditTime: 2022-12-11 00:39:26
 * @Description: Description
 * @FilePath: /openai/chatgpt-tgbot/app.js
 */
// require('dotenv-safe').config()
import dotenv from 'dotenv-safe'
dotenv.config()
import { logger } from './logger.js'
import generate from './generate.js'

import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'

import { SocksProxyAgent } from 'socks-proxy-agent'

// SOCKS proxy to connect to
// create an instance of the `SocksProxyAgent` class with the proxy server information
var agent =
  process.env.NODE_ENV === 'production'
    ? undefined
    : new SocksProxyAgent(process.env.SOCKS_PROXY)

const bot = new Telegraf(process.env.BOT_TOKEN)
// const bot = new Telegraf(process.env.BOT_TOKEN, {
//   telegram: {
//     agent: agent,
//   },
// })

bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.command('hipster', Telegraf.reply('λ'))

bot.command('quit', async (ctx) => {
  // Explicit usage
  await ctx.telegram.leaveChat(ctx.message.chat.id)

  // Using context shortcut
  await ctx.leaveChat()
})
let group_prompt = ''
let private_prompt = ''
let answer = ''
bot.on(message('text'), async (ctx) => {
  try {
    // Explicit usage
    // console.log('🚀 ~ file: app.js:55 ~ bot.on ~ chatType', ctx.chat.type)
    logger('🚀 ~ file: app.js:48 ~ bot.on ~ message', ctx.message.text)
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
      // logger(ctx.botInfo)
      if (ctx.message?.entities?.length > 0) {
        logger(ctx.message?.entities)
        for (const entitie of ctx.message.entities) {
          if (
            entitie.type === 'mention' &&
            ctx.message.text.startsWith(`@${ctx.botInfo.username}`)
          ) {
            const replace_prompt = ctx.message.text.replace(
              `@${ctx.botInfo.username}`,
              ''
            )
            group_prompt = `${group_prompt}\nHuman: ${replace_prompt}\nAI: `
            logger('🚀 ~ file: app.js:56 ~ bot.on ~ group_prompt', group_prompt)
            const completion = await generate(group_prompt)
            answer = JSON.parse(completion)
            // cope answer to next prompt
            group_prompt = `${group_prompt} \n ${answer?.text}`
            if (answer?.status != 200) {
              // The maximum number of tokens to generate in the completion.
              // The token count of your prompt plus max_tokens cannot exceed the model's context length.
              // Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
              group_prompt = ''
            }
            await ctx.telegram.sendMessage(
              ctx.message.chat.id,
              `AI: ${answer?.text}`
            )
          }
        }
      }
    } else if (ctx.chat.type === 'private') {
      private_prompt = `${private_prompt}\nHuman: ${ctx.message.text}\nAI: `
      logger('🚀 ~ file: app.js:56 ~ bot.on ~ private_prompt', private_prompt)
      const completion = await generate(private_prompt)
      answer = JSON.parse(completion)
      // cope answer to next prompt
      private_prompt = `${private_prompt} \n ${answer?.text}`
      if (answer?.status != 200) {
        // The maximum number of tokens to generate in the completion.
        // The token count of your prompt plus max_tokens cannot exceed the model's context length.
        // Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
        private_prompt = ''
      }
      await ctx.telegram.sendMessage(ctx.message.chat.id, `AI: ${answer?.text}`)
    }
    // await ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`)

    // Using context shortcut
    // await ctx.reply(`Hello ${ctx.state.role}`)
  } catch (error) {
    console.error(error)
  }
})

bot.on('callback_query', async (ctx) => {
  // Explicit usage
  await ctx.telegram.answerCbQuery(ctx.callbackQuery.id)

  // Using context shortcut
  await ctx.answerCbQuery()
})

bot.on('inline_query', async (ctx) => {
  const result = []
  // Explicit usage
  await ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)

  // Using context shortcut
  await ctx.answerInlineQuery(result)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
