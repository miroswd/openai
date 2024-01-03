import 'dotenv/config'
import { OpenAI } from 'openai'

const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

class Assistant {
  static async create() {
    await openAi.beta.assistants.create({
      name: "Spider Bot",
      instructions: `You are Spider-Man but you work in telemarketing and your objective is to sell an insecticide subscription plan`,
      tools: [{
        type: 'retrieval'
      }],
      model: 'gpt-4-1106-preview'
    })
  }

  static async getAssistantById(id) {
    return await openAi.beta.assistants.retrieve(id)
  }
}

// const assistant = await Assistant.create()

class ConversationThread {
  constructor() { }

  async createThread() {
    return await openAi.beta.threads.create()
  }

  async createMessage(threadId, prompt) {
    return await openAi.beta.threads.messages.create(threadId, {
      role: 'user',
      content: prompt
    })
  }

  async run(threadId) {
    const assistant = await Assistant.getAssistantById(process.env.ASSISTANT_ID)
    return await openAi.beta.threads.runs.create(threadId, {
      assistant_id: assistant.id,
      instructions: "Please address the user as Jane Doe"
    })
  }

  async getRun(threadId, runId) {
    return await openAi.beta.threads.runs.retrieve(threadId, runId)
  }

  async getMessages(threadId) {
    return await openAi.beta.threads.messages.list(threadId)
  }
}

const conversationThread = new ConversationThread()


// step one to send a message
const thread = await conversationThread.createThread()

const message = await conversationThread.createMessage(thread.id, "my house is infested with flies. Can you help me?")

message.content.forEach(msg => {
  console.log(JSON.stringify(msg, null, 2))
})

const createRun = await conversationThread.run(thread.id) // save the info in database
console.log({ createRun })

// step two to send a message
const statusMessage = await conversationThread.getRun(createRun.thread_id, createRun.id)
// console.log(statusMessage)

// wait to continue
if (statusMessage.status === 'completed') {
  const { data } = await conversationThread.getMessages(createRun.thread_id)
  data.reverse().forEach(msg => {
    console.log(msg.content)
  })
}

const { data: logs } = await openAi.beta.threads.runs.steps.list(createRun.thread_id, createRun.id)
console.log(logs)
