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
        [kb.ride.FROM_PK_TO_NAHABINO, kb.ride.TO_PK_FROM_NAHABINO],
        [kb.ride.FROM_PK_TO_MOSCOW, kb.ride.TO_PK_FROM_MOSCOW],
        [kb.ride.FROM_PK_TO_GLOBUS, kb.ride.TO_PK_FROM_GLOBUS],
        [kb.back]
    ]
}
