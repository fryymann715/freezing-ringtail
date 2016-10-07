const express = require('express');
const router = express.Router();
const { Book, Author, Genre, Search } = require('../database/db.js');


/* GET home page. */
router.get('/', ( request, response ) => {

  const { query } = request
  const { search_query } = request.query
  const page = parseInt( query.page || 1 )
  const size = parseInt( query.size || 8 )
  const nextPage = page + 1
  const previousPage = page - 1 > 0 ? page - 1 : 1

  if (search_query === undefined ){
    Book.getAll( size, page )
      .then( books => response.render( 'index', { books, page, size, nextPage, previousPage } ) )

  }
else {
  Search.forBooks( search_query, size, page ).then( books => {
    response.render( "index", {books, page, size, nextPage, previousPage} )
  })
}

});

/* GET book detail. */
router.get('/book/:book_id', ( request, response ) => {
  const { book_id } = request.params

  Promise.all([ Book.getBookById( book_id ), Book.getAuthors( book_id ), Book.getGenres( book_id ) ])
    .then( data => {
      const [ book, authors, genres ] = data

      response.render( 'book_details', { book, authors, genres }  )
    })
});
router.get('/admin/book/update/:book_id', ( request, response ) => {
  const { book_id } = request.params
  response.render('update_book.hbs', {book_id})
})


router.post('/book/update/:book_id', ( request, response ) => {

  const { book_id, title, description, author } = request.body

  if ( author ) {
    Promise.all([ Author.getIdByBookId( book_id ) ])
    .then( data => {
      const author_id = data[0]['author_id']
      Author.updateName( author_id, author )
    })
  }

  Book.update( book_id, title, description )
  .then( () => response.redirect( '/book/' + book_id))
})

router.get('/admin', ( request, response ) => {
  response.render( 'admin' )
} )

router.get('/admin/book/delete/:book_id', ( request, response ) => {
  const { book_id } = request.params

  Book.delete( book_id )
    .then( () => response.redirect('/'))
    .catch( error => error )
} )

/* GET create author page. */
router.get( '/admin/author/create', ( request, response ) => {
  response.render( 'create_author' )
} )

/* POST new author data. */
router.post( '/author/create', ( request, response ) => {
   const { name, bio } = request.body

   Author.create(  name, bio  )
    .then( author => {
      response.redirect( '/author/' + author.id )
    })
})

router.get( '/author/:author_id', ( request, response ) => {
  const { author_id } = request.params
  Author.getOne( author_id )
    .then( author => {
      response.render( 'author_details', { author } )
    } )
})

/* GET create book page. */
router.get( '/admin/book/create', ( request, response ) => {
  response.render( 'create_book' )
})


router.get('/search/books', ( request, response ) => {

})



// })

/* POST new book data. */
router.post( '/book/create', ( request, response ) => {
  const { title, description, author, genre } = request.body

  Book.create( title, description )
    .then( book => {
      const book_id = book.id

      Promise.all([ Author.getName( author ), Genre.getName( genre ) ])
        .then( data => {
            const [ authorData, genreData ] = data

            if ( authorData === null || []) {
              Author.create( author ).then( author => {
                const author_id = author.id

                Book.joinAuthor( author_id, book_id )
              })
            } else {
              Book.joinAuthor( authorData.id, book_id )
            }

            if ( genreData === null || [] ) {
              Genre.create( genre ).then( genre => {
                const genre_id = genre.id

                Book.joinGenre( genre_id, book_id )
              })
            } else {
              Book.joinGenre( genreData.id, book_id )
            }

            response.redirect( `/book/${book_id}` )
        })
    })
})

module.exports = router;
