'use strict';

const express = require('express');
const app = express();

dotenv.config();
app.set('view engine', 'ejs'); // this is new, it grabs ejs and sets it

const PORT = process.env.PORT || 3001;




app.listen(PORT, () => {
    console.log(`server is up on ${PORT}`);
});
