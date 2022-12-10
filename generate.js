/*
 * @Author: goooajw@gmail.com
 * @Date: 2022-12-08 15:43:19
 * @LastEditors: Solid Ji
 * @LastEditTime: 2022-12-10 20:44:02
 * @Description: Description
 * @FilePath: /openai/chatgpt-tgbot/generate.js
 */
import dotenv from 'dotenv-safe'
import { logger } from './logger.js'
dotenv.config()
import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)
const response = await openai.listModels()

export default async function (prompt) {
  try {
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      // 'The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: Hello, who are you?\nAI: I am an AI created by OpenAI. How can I help you today?\nHuman: ',
      temperature: 0.9,
      max_tokens: 1500, //2048
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6,
      stop: [' Human:', ' AI:'],
    })
    // res.status(200).json({ result: completion.data.choices[0].text })
    logger('🚀 ~ file: generate.js:25 ~ completion', completion?.data)
    return JSON.stringify({
      status: 200,
      text: completion?.data?.choices?.[0]?.text,
    })
  } catch (error) {
    console.error(error)
    return JSON.stringify({
      status: error?.response?.status ?? 400,
      text: error?.response?.data?.error?.message,
    })
  }
}
function generatePrompt(animal) {
  const capitalizedAnimal =
    animal[0].toUpperCase() + animal.slice(1).toLowerCase()
  return `Suggest three names for an animal that is a superhero.

Animal: Cat
Names: Captain Sharpclaw, Agent Fluffball, The Incredible Feline
Animal: Dog
Names: Ruff the Protector, Wonder Canine, Sir Barks-a-Lot
Animal: ${capitalizedAnimal}
Names:`
}
