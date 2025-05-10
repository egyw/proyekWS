require('dotenv').config();
const express = require('express');
const router = require('./src/routes');
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);


// run server
const port = 3000;
app.listen(port, () =>  {
    console.log(`Server jalan di port ${port} yaa :)`);
});

