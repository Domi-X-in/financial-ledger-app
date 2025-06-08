require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ledgerApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  const users = await User.find({});
  console.log('All users:');
  users.forEach(user => {
    console.log({
      _id: user._id,
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      role: user.role
    });
  });
  process.exit(0);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 