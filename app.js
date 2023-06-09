const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan= require('morgan');
const bodyParser = require('body-parser');
const cors= require('cors');
var cookieParser = require('cookie-parser');
const expressValidator = require('express-validator');
const dotenv =require('dotenv');


dotenv.config();

mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser: true
})
.then(()=> console.log('DB Connected'));

mongoose.connection.on('error', err => {
    console.log(`DB conneciton error: ${err.message}`)
})
// bring in Routes
const authRoutes = require('./routes/auth');

// middleware 
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());
app.use('/api', authRoutes);
const port = process.env.PORT || 8000;

app.listen(port, ()=>{
    console.log(`App is listening on port : ${port}`)
});