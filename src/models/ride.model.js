const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RideSchema = new Schema({
    uuid: {
        type: String,
        required: true
    },
    routeType: {
        type: Number,
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
    datetime: {
        type: Date,
        required: false
    },
    createdAt: {
        type: Date,
        required: true
    }
})

mongoose.model('rides', RideSchema)
