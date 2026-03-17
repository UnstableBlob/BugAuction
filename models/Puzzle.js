import mongoose from 'mongoose';

const PuzzleSchema = new mongoose.Schema(
    {
        puzzleId: { type: String, required: true, unique: true },
        type: {
            type: String,
            enum: ['logic', 'handshake', 'schema'],
            required: true,
        },
        title: { type: String, required: true },
        prompt: { type: String, required: true },
        uiConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
        answer: { type: mongoose.Schema.Types.Mixed, required: true },
        points: { type: Number, default: 0 },
        basePrice: { type: Number, default: 0 },
        penaltySecondsOnWrong: { type: Number, default: 300 },
    },
    { timestamps: true }
);

export default mongoose.models.Puzzle || mongoose.model('Puzzle', PuzzleSchema);
