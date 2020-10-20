'use strict';

require('dotenv').config();

const superagent = require('superagent');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;
const cors = require('cors');
const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();


app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); 



app.get('/', (req, res) => {
    res.render('pages/searches/new');
});

app.get('/hello', (req, res) => {
    res.render('pages/index');
});

app.get('/searches/new', (req, res) => {
    res.render('pages/searches/new');
});


 app.post('/searches', handleBooks);


 // FUNCTIONS 

 function handleBooks(req, res) {
     console.log(req.body);
     const title = req.body.title;
     const url = `https://www.googleapis.com/books/v1/volumes?q=+intitle:${title}`;

     superagent.get(url)
     .then(bookResults => {
         const bookData = bookResults.body.items;
         let mapBooks = bookData.map(bookObject => {
             const createBook = new Books(bookObject);
             return createBook;
         });
         res.render('pages/searches/show', {results : mapBooks});
     })
     .catch(error => {
        
        res.render('pages/error')
    });
 }

function Books (book) {
    this.title = book.volumeInfo.title;
    this.authors= book.volumeInfo.author;
    this.description = book.volumeInfo.description;
    // ? usage is --> some condition, a value if condition is true, value if false
    let img = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail.replace('https://i.imgur.com/J5LVHEL.jpg') : '';
    this.img_url = img;
}




app.listen(PORT, () => {
    console.log(`server is up on ${PORT}`);
});
