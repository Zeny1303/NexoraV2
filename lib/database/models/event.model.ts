import { Document, Schema, model, models } from "mongoose";

export interface IEvent extends Document {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  createdAt: Date;
  imageUrl: string;
  startDateTime: Date;
  endDateTime: Date;
  url?: string;
  category: { _id: string; name: string };
  organizer: { _id: string; firstName: string; lastName: string };
  postedBy: 'admin' | 'organizer';
  organizerInfo?: {
    name: string;
    email: string;
    instagram?: string;
    linkedin?: string;
  };
}

const EventSchema = new Schema({
  title:       { type: String, required: true },
  description: { type: String },
  location:    { type: String },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  createdAt:     { type: Date, default: Date.now },
  imageUrl:      { type: String, required: true },
  startDateTime: { type: Date, default: Date.now },
  endDateTime:   { type: Date, default: Date.now },
  url:           { type: String },
  category:      { type: Schema.Types.ObjectId, ref: "Category" },
  organizer:     { type: Schema.Types.ObjectId, ref: "User" },
  postedBy: {
  type: String,
  enum: ['admin', 'organizer', 'student'], 
  default: 'organizer',
  required: true,
  },
  organizerInfo: {
    name:      { type: String },
    email:     { type: String },
    instagram: { type: String },
    linkedin:  { type: String },
  },
});

const Event = models.Event || model("Event", EventSchema);
export default Event;