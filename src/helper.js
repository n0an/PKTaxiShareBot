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
    }
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