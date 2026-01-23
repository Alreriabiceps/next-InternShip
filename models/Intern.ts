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
  },
  {
    timestamps: true,
  }
);

const Intern: Model<IIntern> = mongoose.models.Intern || mongoose.model<IIntern>('Intern', InternSchema);

export default Intern;


