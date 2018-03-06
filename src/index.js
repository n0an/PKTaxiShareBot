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
    RIDE_DELETE: 'ride_delete',
    RIDE_TOGGLE_JOIN: 'ride_toggle_join',
    RIDE_DELETE_ALL: 'ride_delete_all'
}

const bot = new TelegramBot(token.TOKEN, {
    polling: true
})


// ===========================================
//              MAIN BOT LISTENER
// ===========================================

bot.on('message', msg => {
    console.log('Working', msg.from.first_name)

    const chatId = helper.getChatId(msg)

    switch (msg.text) {
        case kb.home.createRide:
            console.log('createRide')
            bot.sendMessage(chatId, 'Выберите маршрут:', {
                reply_markup: {keyboard: keyboard.createRide}
            })
            break

        case kb.ride.fromPk:
            console.log('kb.ride.fromPk')
            console.log('msg = ', msg)
            createRideFromPK(chatId, msg.from.id, msg.from.username)
            break

        case kb.ride.toPk:
            console.log('kb.ride.toPk')
            createRideToPK(chatId, msg.from.id, msg.from.username)
            break

        case kb.home.rides:
            console.log('chatId = ', chatId)
            console.log('kb.home.rides')

            showRides(chatId, msg.from.id)
            break

        case kb.home.myRides:
            console.log('chatId = ', chatId)
            console.log('kb.home.myRides')
            showMyRides(chatId, msg.from.id)
            break

        case kb.back:
            bot.sendMessage(chatId, 'Создайте поездку или присоединитесь к созданным', {
                reply_markup: {keyboard: keyboard.home}
            })
            break

        default:
            console.log(msg.text)
            break
    }

})

// ====================================
//       PARSE USER INPUT METHODS
// ====================================

bot.onText(/\/start/, msg => {

    console.log('bot.onText')

    const text = `Здравствуйте, ${msg.from.first_name}\nВыберите команду для начала работы`
    bot.sendMessage(helper.getChatId(msg), text, {
        reply_markup: {
            keyboard: keyboard.home
        }
    })
})

// ====================================
//        RIDES COMMAND LISTENER
// ====================================

bot.onText(/\/r(.+)/, (msg, [source, match]) => {
    const rideUuid = helper.getItemUuid(source)
    const chatId = helper.getChatId(msg)

    Promise.all([
        Ride.findOne({uuid: rideUuid}),
        User.findOne({telegramId: msg.from.id})
    ])
        .then(([ride, user]) => {

            let userIsOwner = false
            let userIsJoined = false

            if (user) {
                userIsOwner = ride.owner === msg.from.id
                userIsJoined = ride.users.indexOf(msg.from.id) !== -1
            }

            let inlineKeyboardText

            let caption = `Маршрут: ${ride.fromPK === true ? "ПК->Нахабино" : "Нахабино->ПК"}\n`

            if (userIsOwner) {
                inlineKeyboardText = 'Удалить поездку'
                caption += 'Участники:\n'

                participants = ride.usernames.filter(uName => uName != msg.from.username)

                console.log('participants = ',participants)

                html = participants.map((p, i) => {
                    return `<b>${i + 1}.</b> @${p}`
                }).join('\n')

                caption += html


            } else {
                inlineKeyboardText = !userIsJoined ? 'Присоединиться к поездке' : 'Отказаться от поездки'
                caption += `Организатор: @${ride.ownerName}\n`
                caption += `Участников: ${ride.users.length}`
            }



            let actionType = userIsOwner ? ACTION_TYPE.RIDE_DELETE : ACTION_TYPE.RIDE_TOGGLE_JOIN

            bot.sendMessage(chatId, caption, {
                reply_markup: {

                    inline_keyboard: [
                        [
                            {
                                text: inlineKeyboardText,
                                callback_data: JSON.stringify({
                                    type: actionType,
                                    rideUuid: ride.uuid,
                                    userIsJoined: userIsJoined
                                })
                            }
                        ]
                    ]
                },
                parse_mode: 'HTML'
            })
        })
})

// ====================================
//         CALLBACK LISTENER
// ====================================

bot.on('callback_query', query => {

    const userId = query.from.id
    const username = query.from.username

    console.log('query.data = ',query.data)

    let data
    try {
        data = JSON.parse(query.data)
    } catch (e) {
        throw new Error('Data is not an object')
    }

    const { type } = data

    if (type === ACTION_TYPE.RIDE_DELETE) {
        rideDelete(userId, query.id, data)
    } else if (type === ACTION_TYPE.RIDE_TOGGLE_JOIN) {
        toggleJoinRide(userId, username,  query.id, data)
    } else if (type === ACTION_TYPE.RIDE_DELETE_ALL) {
        rideDeleteAll(userId, query.id, data)
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


// ===============================
//         HELPER METHODS
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

// --------------------
//         SHOW
// --------------------

function showRides(chatId, telegramId) {

    Ride.find({owner: {'$nin': [telegramId]}, deleted: false})
        .then(rides => {

            let html
            if (rides.length) {
                html = rides.map((r, i) => {
                    return `<b>${i + 1}.</b> ${r.fromPK === true ? "ПК->Нахабино" : "Нахабино->ПК"} - ${r.users.length} чел (/r${r.uuid})`
                }).join('\n')
            } else {
                html = 'Никто пока не создал поездок'
            }

            sendHTML(chatId, html, 'home')
        }).catch(e => console.log(e))
}

function showMyRides(chatId, telegramId) {

    Ride.find({owner: {'$in': [telegramId]}, deleted: false})
        .then(rides => {
            let html

            if (rides.length) {
                html = rides.map((r, i) => {
                    return `<b>${i + 1}.</b> ${r.fromPK === true? "ПК->Нахабино" : "Нахабино->ПК"} - ${r.users.length} чел (/r${r.uuid})`
                }).join('\n')

                let inlineKeyboardText = 'Удалить мои поездки'

                let actionType = ACTION_TYPE.RIDE_DELETE_ALL

                let rideUuids = rides.map((r) => r.uuid)

                console.log('rideUuids = ', rideUuids)

                bot.sendMessage(chatId, html, {
                    reply_markup: {

                        inline_keyboard: [
                            [
                                {
                                    text: inlineKeyboardText,
                                    callback_data: JSON.stringify({
                                        type: actionType,
                                        rides: rideUuids
                                    })
                                }
                            ]
                        ]
                    },
                    parse_mode: 'HTML'
                })


            } else {
                html = 'Нет созданных Вами поездок'
                sendHTML(chatId, html, 'home')

            }

        }).catch(e => console.log(e))
}

// --------------------
//       CREATE
// --------------------

function createRideFromPK(chatId, telegramId, username) {
    createRide(true, chatId, telegramId, username)
}

function createRideToPK(chatId, telegramId, username) {
    createRide(false, chatId, telegramId, username)
}

function createRide(fromPK, chatId, telegramId, username) {

    console.log('ownername = ', username)

    Ride.find()
        .then(rides => {
            console.log('rides count = ', rides.length)

            let newRideUuid = `r${rides.length + 1}`
            console.log('newRideUuid = ', newRideUuid)

            User.findOne({telegramId})
                .then(user => {
                    if (user) {

                        console.log('newRideUuid = ', newRideUuid)

                        user.rides.push(newRideUuid)

                        if (username) {
                            saveUserWithCreatedRide(user, fromPK, telegramId, username, newRideUuid, chatId)
                        } else {
                            alertCreateNoUsername(chatId)
                        }

                    } else {
                        console.log('createRideFromPK.noUser')

                        let user = new User({
                            telegramId: telegramId,
                            rides: [newRideUuid]
                        })

                        if (username) {
                            saveUserWithCreatedRide(user, fromPK, telegramId, username, newRideUuid, chatId)
                        } else {
                            alertCreateNoUsername(chatId)
                        }
                    }

                }).catch(e => console.log(e))
        })
        .catch(err => console.log(err))
}

function alertCreateNoUsername(chatId) {
    alertNoUsername(chatId, 'создать поездку')
}

function alertJoinNoUsername(chatId) {
    alertNoUsername(chatId, 'присоединиться к поездке')
}

function alertNoUsername(chatId, caption) {
    bot.sendMessage(chatId, 'Нельзя', caption, ' без имени пользователя.\n' +
        'Добавьте имя пользователя в настройках Телеграм', {
        reply_markup: {keyboard: keyboard.home}
    })
}


function saveUserWithCreatedRide(user, fromPK, telegramId, username, newRideUuid, chatId) {

    user.save().then(_ => {

        let ride = new Ride({
            "uuid": newRideUuid,
            "fromPK": fromPK,
            "owner": telegramId,
            "ownerName": username,
            "users": [telegramId],
            "usernames": [username],
            "deleted": false
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

// -----------------------------
//        DELETE MY RIDE
// -----------------------------

function rideDelete(userId, queryId, {rideUuid}) {

    console.log('queryId = ', queryId)

    let userPromise

    Promise.all([
        Ride.findOne({uuid: rideUuid}),
        User.findOne({telegramId: userId})
    ])
        .then(([ride, user]) => {

            if (user) {

                user.rides = user.rides.filter(rUuid => rUuid !== rideUuid)

                userPromise = user


            } else {
                // smth wrong happened
            }

            const answerText = 'Поездка удалена'

            ride.deleted = true

            ride.save().then(_ => {
                userPromise.save().then(_ => {
                    bot.answerCallbackQuery({
                        callback_query_id: queryId,
                        text: answerText
                    })
                }).catch(err => console.log(err))
            }).catch(err => console.log(err))

        })
        .catch(err => console.log(err))
}

function rideDeleteAll(userId, queryId, {rides}) {

    console.log('queryId = ', queryId)
    console.log('ridesUuids = ', rides)

    Ride.find({uuid: {'$in': rides}, deleted: false})
        .then(rides => {

            console.log('rides = ', rides)


            const answerText = 'Ваши поездки удалены'

            for (let i = 0; i < rides.length; i++) {
                ride = rides[i]

                ride.deleted = true

                console.log('ride = ', ride)
                ride.save().catch(e => console.log(e))
            }

            bot.answerCallbackQuery({
                callback_query_id: queryId,
                text: answerText
            })

        }).catch(err => console.log(err))
}

// -----------------------------
//        JOIN RIDE
// -----------------------------

function toggleJoinRide(userId, username, queryId, {rideUuid, userIsJoined}) {

    let userPromise

    Promise.all([
        Ride.findOne({uuid: rideUuid}),
        User.findOne({telegramId: userId})
    ])
        .then(([ride, user]) => {

            if (user) {
                if (userIsJoined) {
                    user.rides = user.rides.filter(rUuid => rUuid !== rideUuid)
                    ride.users = ride.users.filter(uUuid => uUuid != userId)

                    if (username) {
                        ride.usernames = ride.usernames.filter(uName => uName != username)
                    } else {
                        alertJoinNoUsername(chatId)
                    }


                } else {
                    user.rides.push(rideUuid)
                    ride.users.push(userId)

                    if (username) {
                        ride.usernames.push(username)
                    } else {
                        alertJoinNoUsername(chatId)
                    }
                }

                userPromise = user

            } else {
                userPromise = new User({
                    telegramId: userId,
                    rides: [rideUuid]
                })
                ride.users.push(userId)
                ride.usernames.push(username)
            }

            const answerText = userIsJoined ? 'Вы отказались от поездки' : 'Вы присоединились к поездке'

            ride.save().then(_ => {
                userPromise.save().then(_ => {


                    bot.answerCallbackQuery({
                        callback_query_id: queryId,
                        text: answerText
                    })
                }).catch(err => console.log(err))
            }).catch(err => console.log(err))
        })
}