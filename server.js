'use strict';

require('dotenv').config();

const superagent = require('superagent');
const express = require('express');
const methodOverride = require('method-override');
const app = express();
const PORT = process.env.PORT || 3001;
const cors = require('cors');
const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();

app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); 

app.get('/book/:id', oneBookDetails);
app.get('/', getBooks);
app.get('/searches/new', searchBooks);
app.get('*', errorFunc);

app.post('/books', newBook);
app.post('/searches', handleBooks);

// app.put
app.put('/book/:id', updateBook);

// app.delete
app.delete('/book/:id', deleteBook);


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
     .catch(error => errorFunc(error, res));
 }

function Books (book) {
    this.title = book.volumeInfo.title;
    this.authors= book.volumeInfo.authors;
    this.description = book.volumeInfo.description;
    // ? usage is --> some condition, a value if condition is true, value if false
    let img = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail.replace('https://i.imgur.com/J5LVHEL.jpg') : '';
    this.img_url = img;
    this.publisher = book.volumeInfo.publisher;
    this.published_date = book.volumeInfo.publishedDate;
    this.isbn = book.volumeInfo.industryIdentifiers ? book.volumeInfo.industryIdentifiers[1].identifier : 'Not Available';
    this.page_count = book.volumeInfo.pageCount;
    this.genre = book.volumeInfo.categories;
    this.avg_rating = book.volumeInfo.averageRating;
}


function searchBooks (req, res) {
    res.render('pages/searches/new');
}

// client request to DB
function getBooks (req, res) {
    client.query('SELECT * FROM book')
    .then(retrieve => {
        console.log(retrieve);
        res.render('pages/index', {books: retrieve.rows});
    });
}
//client one book function
function oneBookDetails (req, res) {
    client.query('SELECT * FROM book WHERE id=$1;', [req.params.id])
        .then(singleResult => {
            console.log(singleResult);
            res.render('pages/books/detail', {books: singleResult.rows[0]});
        })
        .catch(error => errorFunc(error, res));
}

// client new book function
function newBook (req, res) {
    const {title, author, description, image_url, isbn} = req.body;
    console.log(author);
    let sql = `INSERT INTO book (title, author, description, image_url, isbn) VALUES ($1, $2, $3, $4, $5) returning id`;
    let bookArr = [title, author, description, image_url, isbn];
    console.log(bookArr);
    client.query(sql, bookArr)
    .then(response => {
        res.redirect(`/book/${response.rows[0].id}`);
        })
        .catch(error => errorFunc(error, res));
}

// delete function that redirects to the homepage
function deleteBook (req, res) {
    let id = req.params.id;
    let sqlDelete = 'DELETE FROM book WHERE id=$1';
    client.query(sqlDelete, [id])
        .then(() => {
            res.redirect('/');
        })
        .catch(error => errorFunc(error, res));
}

// update function for books
function updateBook (req, res) {
    let {title, author, description, image_url, isbn} = req.body;
    console.log(req.body, ('update book'));
    let sqlUpdate = `UPDATE book SET title=$1, author=$2, description=$3, image_url=$4, isbn=$5 WHERE id=$6`;
    let bookArr = [title, author, description, image_url, isbn, req.params.id];
    console.log(bookArr);
    client.query(sqlUpdate, bookArr)
        .then(() => {
            res.redirect(`/book/${req.params.id}`)
        })
        .catch(error => errorFunc(error, res));
}


app.listen(PORT, () => {
    console.log(`server is up on ${PORT}`);
});

function errorFunc (error, res){
    res.render('pages/error', {error: 'server error'});
}