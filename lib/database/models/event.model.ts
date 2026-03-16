import { Schema, model, models } from "mongoose";
const EventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  location: { type: String },

  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },

  createdAt: { type: Date, default: Date.now },
  imageUrl: { type: String, required: true },
  startDateTime: { type: Date, default: Date.now },
  endDateTime: { type: Date, default: Date.now },
  url: { type: String },

  category: { type: Schema.Types.ObjectId, ref: "Category" },
  organizer: { type: Schema.Types.ObjectId, ref: "User" },

  postedBy: {
    type: String,
    enum: ["admin", "organizer", "student"],
    default: "organizer",
    required: true,
  },

  organizerInfo: {
    name: { type: String },
    email: { type: String },
    instagram: { type: String },
    linkedin: { type: String },
  },
})

/* add index AFTER schema */
EventSchema.index({
  "coordinates.lat": 1,
  "coordinates.lng": 1,
})

const Event = models.Event || model("Event", EventSchema)

export default Event;