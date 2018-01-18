const TelegramBot = require('node-telegram-bot-api')
const mongoose = require('mongoose')
const config = require('./config')
const token = require('./token')
const helper = require('./helper')
const keyboard = require('./keyboard')
const kb = require('./keyboard-buttons')
const database = require('../database.json')

helper.logStart()

mongoose.Promise = global.Promise
mongoose.connect(config.DB_URL, {
  useMongoClient: true
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err))

require('./models/ride.model')
require('./models/user.model')

const Ride = mongoose.model('rides')
const User = mongoose.model('users')

// -- Uncomment following line to transfer database.json to mongodb
// database.rides.forEach(r => new Ride(r).save().catch(e => console.log(e)))
// database.users.forEach(u => new User(u).save().catch(e => console.log(e)))

// -- Create User manually
// let userPromise = new User({
//   telegramId: 9342934,
//   rides: ["r1", "r2"]
// })
//
// userPromise.save().catch(e => console.log(e) )


// =============================================
// *********************************************
//             BOT START
// *********************************************
// =============================================

const bot = new TelegramBot(token.TOKEN, {
  polling: true
})


// ===============================
// MAIN BOT LISTENER
// ===============================

bot.on('message', msg => {
  console.log('Working', msg.from.first_name)


  const chatId = helper.getChatId(msg)

  switch (msg.text) {
    case kb.home.rides:
      console.log('chatId = ', chatId)
      console.log('msg.from.id = ', msg.from.id)
      showRides(chatId, msg.from.id)
      break
    case kb.home.myRides:
      console.log('chatId = ', chatId)
      console.log('msg.from.id = ', msg.from.id)
      showMyRides(chatId, msg.from.id)
      break

    case kb.back:
      bot.sendMessage(chatId, `Создайте поездку или присоединитесь к созданным`, {
        reply_markup: {keyboard: keyboard.home}
      })
      break
    default:
      console.log(msg.text)
      break
  }

})



// ===============================
// PARSE USER INPUT METHODS
// ===============================

bot.onText(/\/start/, msg => {

  console.log('bot.onText')

  const text = `Здравствуйте, ${msg.from.first_name}\nВыберите команду для начала работы:`
  bot.sendMessage(helper.getChatId(msg), text, {
    reply_markup: {
      keyboard: keyboard.home
    }
  })

})


// ===============================
// HELPER METHODS
// ===============================

function sendHTML(chatId, html, kbName = null) {
  const options = {
    parse_mode: 'HTML'
  }

  if (kbName) {
    options['reply_markup'] = {
      keyboard: keyboard[kbName]
    }
  }

  bot.sendMessage(chatId, html, options)
}

function showRides(chatId, telegramId) {

  Ride.find().then(rides => {

    let html
    if (rides.length) {
      html = rides.map((r, i) => {
        return `<b>${i + 1}.</b> ${r.fromPK === true? "From PK" : "To PK"} - <b>${r.price} руб</b> (/r${r.uuid})`
      }).join('\n')
    } else {
      html = 'Никто пока не создал поездок'
    }

    sendHTML(chatId, html, 'home')
  }).catch(e => console.log(e))

}

function showMyRides(chatId, telegramId) {

  User.findOne({telegramId})
    .then(user => {
      if (user) {
        Ride.find({uuid: {'$in': user.rides}}).then(rides => {
          let html

          if (rides.length) {
            html = rides.map((r, i) => {
              return `<b>${i + 1}.</b> ${r.fromPK === true? "From PK" : "To PK"} - <b>${r.price} руб</b> (/r${r.uuid})`
            }).join('\n')
          } else {
            html = 'Нет поездок с Вашим участием'
          }

          sendHTML(chatId, html, 'home')
        }).catch(e => console.log(e))
      } else {
        console.log('showMyRides.noUser')
        sendHTML(chatId, 'Нет поездок с Вашим участием', 'home')
      }

    }).catch(e => console.log(e))

}
