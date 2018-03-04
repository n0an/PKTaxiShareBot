// ===========================================
//                 IMPORTS
// ===========================================

const TelegramBot = require('node-telegram-bot-api')
const mongoose = require('mongoose')
const config = require('./config')
const token = require('./token')
const helper = require('./helper')
const keyboard = require('./keyboard')
const kb = require('./keyboard-buttons')
const database = require('../database.json')

// ===========================================
//                 PROPERTIES
// ===========================================

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


// -- ACTION_TYPE ENUM
const ACTION_TYPE = {
    TOGGLE_JOIN_RIDE: 'tjr',
    // SHOW_CINEMAS: 'sc',
    // SHOW_CINEMAS_MAP: 'scm',
    // SHOW_FILMS: 'sf'
}


// =============================================
// *********************************************
//             BOT START
// *********************************************
// =============================================

const bot = new TelegramBot(token.TOKEN, {
    polling: true
})


// ===========================================
// ************ MAIN BOT LISTENER ************
// ===========================================

bot.on('message', msg => {
    console.log('Working', msg.from.first_name)


    const chatId = helper.getChatId(msg)

    switch (msg.text) {
        case kb.home.createRide:
            console.log('createRide')
            bot.sendMessage(chatId, `Выберите маршрут:`, {
                reply_markup: {keyboard: keyboard.createRide}
            })
            break

        case kb.ride.fromPk:
            console.log('kb.ride.fromPk')
            createRideFromPK(chatId, msg.from.id)
            break

        case kb.ride.toPk:
            console.log('kb.ride.toPk')
            createRideToPK(chatId, msg.from.id)
            break

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


// ==========================
// ===== callback_query =====
// ==========================

bot.on('callback_query', query => {

    const userId = query.from.id

    console.log('query.data = ',query.data)

    let data
    try {
        data = JSON.parse(query.data)
    } catch (e) {
        throw new Error('Data is not an object')
    }

    const { type } = data

    if (type === ACTION_TYPE.TOGGLE_JOIN_RIDE) {
        toggleJoinRide(userId, query.id, data)
    }


// if (type === ACTION_TYPE.SHOW_CINEMAS_MAP) {
//   const {lat, lon} = data
//   bot.sendLocation(query.message.chat.id, lat, lon)
// } else if (type === ACTION_TYPE.SHOW_CINEMAS) {
//   sendCinemasByQuery(userId, {uuid: {'$in': data.cinemaUuids}})
// } else if (type === ACTION_TYPE.TOGGLE_FAV_FILM) {
//   toggleFavouriteFilm(userId, query.id, data)
// } else if (type === ACTION_TYPE.SHOW_FILMS) {
//   sendFilmsByQuery(userId, {uuid: {'$in': data.filmUuids}})
// }
})


// ====================================
// ===== PARSE USER INPUT METHODS =====
// ====================================

bot.onText(/\/start/, msg => {

    console.log('bot.onText')

    const text = `Здравствуйте, ${msg.from.first_name}\nВыберите команду для начала работы:`
    bot.sendMessage(helper.getChatId(msg), text, {
        reply_markup: {
            keyboard: keyboard.home
        }
    })

})

// -- Rides inline section
bot.onText(/\/r(.+)/, (msg, [source, match]) => {
    const rideUuid = helper.getItemUuid(source)
    const chatId = helper.getChatId(msg)

    Promise.all([
        Ride.findOne({uuid: rideUuid}),
        User.findOne({telegramId: msg.from.id})
    ])
        .then(([ride, user]) => {

            console.log(ride)

            let userIsJoined = false

            // if (user) {
            //     userIsJoined = user.rides.indexOf(ride.uuid) !== -1
            // }

            if (user) {
                userIsJoined = ride.users.indexOf(telegramId) !== -1
            }

            const joinMessageText = userIsJoined ? 'Отказаться от поездки' : 'Присоединиться к поездке'

            // const caption = `Маршрут: ${ride.fromPK === true ? "ПК -> ст. Нахабино" : "ст. Нахабино -> ПК"}\nЦена за такси: ${ride.price}\nУчастников: 1/3\nВзнос с участника: ${ride.price/2}`
            const caption = `Маршрут: ${ride.fromPK === true ? "ПК -> ст. Нахабино" : "ст. Нахабино -> ПК"}`

            bot.sendMessage(chatId, caption, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: joinMessageText,
                                callback_data: JSON.stringify({
                                    type: ACTION_TYPE.TOGGLE_JOIN_RIDE,
                                    rideUuid: ride.uuid,
                                    userIsJoined: userIsJoined
                                })
                            }
                        ]
                    ]
                }

            })


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
                return `<b>${i + 1}.</b> ${r.fromPK === true ? "ПК -> ст. Нахабино" : "ст. Нахабино -> ПК"} - <b>${r.price} руб</b> (/r${r.uuid})`
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
                Ride.find({uuid: {'$in': user.owner}}).then(rides => {
                    let html

                    if (rides.length) {
                        html = rides.map((r, i) => {
                            return `<b>${i + 1}.</b> ${r.fromPK === true? "From PK" : "To PK"} - <b>${r.price} руб</b> (/r${r.uuid})`
                        }).join('\n')
                    } else {
                        html = 'Нет созданных Вами поездок'
                    }

                    sendHTML(chatId, html, 'home')
                }).catch(e => console.log(e))
            } else {
                console.log('showMyRides.noUser')
                sendHTML(chatId, 'Нет созданных Вами поездок', 'home')
            }

        }).catch(e => console.log(e))

}

// ====================
// ===== CREATION =====
// ====================

function createRideFromPK(chatId, telegramId) {
    createRide(true, chatId, telegramId)
}

function createRideToPK(chatId, telegramId) {
    createRide(false, chatId, telegramId)
}

function createRide(fromPK, chatId, telegramId) {

    let newRideUuid = guid()

    console.log(newRideUuid)

    User.findOne({telegramId})
        .then(user => {
            if (user) {

                console.log('newRideUuid = ', newRideUuid)

                user.rides.push(newRideUuid)

                saveUserWithCreatedRide(user, fromPK, telegramId, newRideUuid, chatId)

            } else {
                console.log('createRideFromPK.noUser')

                let user = new User({
                    telegramId: telegramId,
                    rides: [newRideUuid]
                })

                saveUserWithCreatedRide(user, fromPK, telegramId, newRideUuid, chatId)
            }

        }).catch(e => console.log(e))
}

function saveUserWithCreatedRide(user, fromPK, telegramId, newRideUuid, chatId) {

    user.save().then(_ => {

        let ride = new Ride({
            "uuid": newRideUuid,
            "fromPK": fromPK,
            "owner": telegramId,
            "users": [telegramId]
        })

        ride.save().then(_ => {
            bot.sendMessage(chatId, 'Вы создали поездку', {
                reply_markup: {keyboard: keyboard.home}
            })

        }).catch(e => console.log(e))

    }).catch(err => console.log(err))
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

// ====================
// ======= JOIN =======
// ====================

function toggleJoinRide(userId, queryId, {rideUuid, userIsJoined}) {

    console.log('queryId = ', queryId)

    let userPromise

    User.findOne({telegramId: userId})
        .then(user => {
            if (user) {
                if (userIsJoined) {
                    user.rides = user.rides.filter(rUuid => rUuid !== rideUuid)
                } else {
                    user.rides.push(rideUuid)
                }
                userPromise = user
            } else {
                userPromise = new User({
                    telegramId: userId,
                    rides: [rideUuid]
                })
            }

            const answerText = userIsJoined ? 'Вы отказались от поездки' : 'Вы присоединились к поездке'

            userPromise.save().then(_ => {
                bot.answerCallbackQuery({
                    callback_query_id: queryId,
                    text: answerText
                })
            }).catch(err => console.log(err))
        }).catch(err => console.log(err))
}
