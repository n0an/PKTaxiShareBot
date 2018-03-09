const kb = require('./keyboard-buttons')

module.exports = {
    home: [
        [kb.home.createRide],
        [kb.home.rides, kb.home.myRides],
        [kb.help]
    ],
    createRide: [
        [kb.ride.FROM_PK_TO_NAHABINO, kb.ride.TO_PK_FROM_NAHABINO],
        [kb.ride.FROM_PK_TO_MOSCOW, kb.ride.TO_PK_FROM_MOSCOW],
        [kb.ride.FROM_PK_TO_GLOBUS, kb.ride.TO_PK_FROM_GLOBUS],
        [kb.back]
    ],
    viewRide: [
        [kb.viewRide.FROM_PK_TO_NAHABINO, kb.viewRide.TO_PK_FROM_NAHABINO],
        [kb.viewRide.FROM_PK_TO_MOSCOW, kb.viewRide.TO_PK_FROM_MOSCOW],
        [kb.viewRide.FROM_PK_TO_GLOBUS, kb.viewRide.TO_PK_FROM_GLOBUS],
        [kb.back]
    ]
}
