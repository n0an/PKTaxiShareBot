const kb = require('./keyboard-buttons')

module.exports = {
    home: [
        [kb.home.createRide],
        [kb.home.rides, kb.home.myRides],
        [kb.help]
    ],
    allRides: [
        [kb.ride.joinRide],
        [kb.back]
    ],
    myRides: [
        [kb.ride.leave],
        [kb.back]
    ],
    createRide: [
        [kb.ride.fromPk, kb.ride.toPk],
        [kb.back]
    ]
}
