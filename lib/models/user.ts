import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
    profilePictureData?: string; // Stores Base64 string
    preferences?: {
        emailNotifications?: boolean;
        weeklySummary?: boolean;
        defaultBoardView?: string;
        theme?: "light" | "dark" | "system";
        accentColor?: "red" | "blue" | "green" | "yellow" | "gray" | "pink";
    };
    // 2FA fields
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string; // Encrypted TOTP secret
    twoFactorBackupCodes?: string[]; // Hashed backup codes
    twoFactorVerifiedAt?: Date;
    lastTwoFactorAt?: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        image: {
            type: String, // Will store URL /api/avatar/:id
        },
        profilePictureData: {
            type: String, // Large Base64
        },
        preferences: {
            emailNotifications: { type: Boolean, default: true },
            weeklySummary: { type: Boolean, default: false },
            defaultBoardView: { type: String, default: "kanban" },
            theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
            accentColor: { type: String, enum: ["red", "blue", "green", "yellow", "gray", "pink"], default: "pink" },
        },
        // 2FA fields
        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorSecret: { type: String }, // Encrypted TOTP secret
        twoFactorBackupCodes: [{ type: String }], // Hashed backup codes
        twoFactorVerifiedAt: { type: Date },
        lastTwoFactorAt: { type: Date },
    },
    {
        timestamps: true,
        collection: "user", // Explicitly match Better Auth's default collection name
    }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
