const express = require('express');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const specs = require('./swagger.js');
// const db = require('./config/db');
require('dotenv').config();

// Import routes
const animalRoutes = require('./routes/animals');
const userRoutes = require('./routes/users');
const adoptionRoutes = require('./routes/adoptions');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
// db.connect()
//     .then(() => console.log('Connected to PostgreSQL'))
//     .catch(err => console.error('Connection error', err));

// Middleware
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/animals', animalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/adoptions', adoptionRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Server error!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});