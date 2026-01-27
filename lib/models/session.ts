import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
    sessionId: string;
    userId: string;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    lastActiveAt: Date;
    isRevoked: boolean;
    // Additional metadata for better UX
    browser?: string;
    os?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    location?: {
        city?: string;
        country?: string;
    };
}

const SessionSchema = new Schema<ISession>(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        userId: {
            type: String,
            required: true,
            index: true
        },
        ipAddress: {
            type: String,
            required: true
        },
        userAgent: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now,
            required: true
        },
        lastActiveAt: {
            type: Date,
            default: Date.now,
            required: true
        },
        isRevoked: {
            type: Boolean,
            default: false,
            index: true
        },
        // Parsed metadata
        browser: String,
        os: String,
        deviceType: {
            type: String,
            enum: ['desktop', 'mobile', 'tablet']
        },
        location: {
            city: String,
            country: String
        }
    },
    {
        timestamps: false, // We handle our own timestamps
        collection: "sessions"
    }
);

// Compound indexes for efficient queries
SessionSchema.index({ userId: 1, isRevoked: 1, lastActiveAt: -1 });
SessionSchema.index({ sessionId: 1, userId: 1 });

export default mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);