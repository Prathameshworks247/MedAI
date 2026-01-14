import { Schema, model, Document } from 'mongoose';

interface IReport {
  reportId: Schema.Types.ObjectId;
  uri: string;
  summary: string;
}

interface ITest {
  testId: Schema.Types.ObjectId;
  uri: string;
  summary: string;
}

export interface IAppointment extends Document {
  patientId: Schema.Types.ObjectId;
  doctorId: Schema.Types.ObjectId;
  status: 'scheduled' | 'completed' | 'cancelled';
  startTime: Date;
  endTime: Date;
  appointmentDate: Date;
  discussion: string;
  reports: IReport[];
  tests: ITest[];
  diagnosis: any;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Doctor',
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    discussion: {
      type: String,
      required: true,
    },
    reports: [
      {
        reportId: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: 'Report',
        },
        uri: {
          type: String,
          required: true,
        },
        summary: {
          type: String,
          required: true,
        },
      },
    ],
    tests: [
      {
        testId: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: 'Test',
        },
        uri: {
          type: String,
          required: true,
        },
        summary: {
          type: String,
          required: true,
        },
      },
    ],
    diagnosis: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model<IAppointment>('Appointment', AppointmentSchema);
