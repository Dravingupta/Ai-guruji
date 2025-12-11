import 'dotenv/config'; // Load env vars before anything else
import connectDB from './config/database.js';
import initializeFirebase from './config/firebase.js';
import app from './app.js';


// Initialize services
connectDB();
initializeFirebase();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
