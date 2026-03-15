import mongoose from 'mongoose';

// connection helper for the whole application.  Next.js will import
// `connectDB` from here whenever a route or helper needs a database
// operation.  mongoose keeps a global cache so that we don't open a new
// socket on every request in development (which would otherwise exhaust
// the connection limit).

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Environment variable MONGODB_URI must be defined in .env.local');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        mongoose.set('strictQuery', true);
        cached.promise = mongoose
            .connect(MONGODB_URI, {
                // useNewUrlParser and useUnifiedTopology are always true in
                // mongoose ^6, but we set options here if you want to track
                // them later.
                bufferCommands: false,
            })
            .then((mongooseInstance) => {
                return mongooseInstance;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
