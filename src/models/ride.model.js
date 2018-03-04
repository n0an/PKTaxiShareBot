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
    users: {
        type: [Number],
        default: []
    }
})

mongoose.model('rides', RideSchema)
