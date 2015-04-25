var mongoose = require('mongoose');
var User = require('./userModel.js');
var Review = require('./reviewModel.js');

var ClassesSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  rate: { type: String, default: 0 },
  date: { type: Date },
  start_time: { type: Date },
  end_time: { type: Date },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: { type: String },
  is_booked: { type: Boolean },
  picture_url: { type: String },
  avg_rating: { type: Number, default: null },
  total_ratings: { type: Number, default: null },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
});

// compile schema into a model, which is a class from which we construct documents.
// export the model to make available to others.
module.exports = mongoose.model('Class', ClassesSchema);
