const express = require('express');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const specs = require('./swagger.js');
const { pool } = require('./config/db');

// Load .env file only in non-Docker environment
if (!process.env.DOCKER_ENV) {
    require('dotenv').config();
}

// Import routes
const animalRoutes = require('./routes/animals');
const userRoutes = require('./routes/users');
const adoptionRoutes = require('./routes/adoptions');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection check
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
    }
});

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