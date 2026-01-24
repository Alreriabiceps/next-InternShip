import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIntern extends Document {
  name: string;
  email: string;
  studentId: string;
  password: string;
  phone?: string;
  company: string;
  companyAddress: string;
  mustChangePassword: boolean;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InternSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    mustChangePassword: {
      type: Boolean,
      default: true,
    },
    company: {
      type: String,
      required: true,
    },
    companyAddress: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Delete cached model so hot-reload uses current schema (e.g. profilePicture).
// Otherwise mongoose.models.Intern keeps the old schema and profilePicture is never persisted.
if (mongoose.models.Intern) {
  mongoose.deleteModel('Intern');
}
const Intern: Model<IIntern> = mongoose.model<IIntern>('Intern', InternSchema);

export default Intern;


