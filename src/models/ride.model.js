const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RideSchema = new Schema({
    uuid: {
        type: String,
        required: true
    },
    fromPK: {
        type: Boolean,
        required: true
    },
    owner: {
        type: Number,
        required: true
    },
    ownerName: {
        type: String,
        required: true
    },
    users: {
        type: [Number],
        default: []
    },
    usernames: {
        type: [String],
        default: []
    },
    deleted: {
        type: Boolean,
        required: true
    },
    time: {
        type: Number,
        required: false
    }
})

mongoose.model('rides', RideSchema)
