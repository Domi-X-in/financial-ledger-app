const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://financial-ledger-app.onrender.com'
    : 'http://localhost:5003'
};

export default config; 