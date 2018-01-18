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
  time: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  users: {
    type: [String],
    default: []
  }
})

mongoose.model('rides', RideSchema)
