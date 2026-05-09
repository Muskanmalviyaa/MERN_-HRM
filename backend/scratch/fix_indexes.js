import 'dotenv/config';
import mongoose from 'mongoose';

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    const userCollExists = collections.some(c => c.name === 'users');

    if (userCollExists) {
      console.log('Dropping indexes on users collection...');
      await mongoose.connection.db.collection('users').dropIndexes();
      console.log('Successfully dropped all indexes on users collection.');
    } else {
      console.log('Users collection not found.');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

fixIndexes();
