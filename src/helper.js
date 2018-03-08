module.exports = {

    logStart() {
        console.log('Bot has been started ...')
    },

    getChatId(msg) {
        return msg.chat.id
    },

    getItemUuid(source) {
        return source.substr(2, source.length)
    },

    getDateFromRide(ride) {
        let rideDate = ride.datetime

        let h = rideDate.getHours()
        let m = rideDate.getMinutes()
        let d = rideDate.getDay()

        m = checkTime(m)

        let dateString = `${h}:${m}`

        let now = new Date()

        if (d !== now.getDay()) {
            let month = rideDate.getMonth()
            dateString += `, ${formatDate(rideDate)}`
        }

        return dateString
    },

    helptext() {
        return '<b>Краткое руководство:</b>\n' +
            'Создатель поездки заказывает такси и ожидает сообщений от присоединившихся участников. Создатель поездки сообщает участникам стоимость, в какое время и в какое место встречи им подойти. Стоимость такси делится между всеми участниками поездки.' +
            '\n\n' +
            '<i>Просмотреть поездки:</i>  Просмотр поездок, созданных другими пользователями.' +
            ' Нажмите на ссылку вида (/rrX), чтобы узнать контакт организатора поездки' +
            ' Если видите, что желающих участников уже слишком много (больше 4) - возможно, лучше выбрать другую поездку\n' +
            '<i>Мои поездки:</i>  Просмотр и редактирование поездок, созданных Вами. ' +
            'Нажмите на ссылку вида (/rrX), чтобы увидеть контакты присоединившихся участников, редактировать поездку - назначить примерное время отправления, или удалить поездку\n' +
            '<i>Создать поездку:</i>  Создать новую поездку' +
            '\n\n<b>Автор бота:</b>\n' +
            '@v011d\n' +
            'Обращайтесь по любым вопросам'},

}

function checkTime(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function formatDate(date) {
    var monthNames = [
        "янв", "фев", "мар",
        "апр", "май", "июнь", "июль",
        "авг", "сен", "окт",
        "нов", "дек"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();

    return day + ' ' + monthNames[monthIndex];
}

