const express = require("express");
const morgan = require("morgan");

const app = express();
const PORT = 3000;

app.use(express.json());

function simpleLogger(req, res, next) {
  console.log(req.method, req.originalUrl);
  next();
}

app.use(morgan("dev"));

let movies = [
  { id: 1, title: "Inception", year: 2010, genre: "Sci-Fi" },
  { id: 2, title: "The Matrix", year: 1999, genre: "Sci-Fi" },
  { id: 3, title: "Parasite", year: 2019, genre: "Thriller" },
  { id: 4, title: "Interstellar", year: 2014, genre: "Sci-Fi" },
  { id: 5, title: "Gladiator", year: 2000, genre: "Action" },
];

let nextId = Math.max(...movies.map((m) => m.id)) + 1;

function validateMovie(body, partial = false) {
  const errors = [];
  const maximumYear = new Date().getFullYear() + 5;

  if (!partial && body.title === undefined) {
    errors.push("title is required");
  }

  if (
    body.title !== undefined &&
    (typeof body.title !== "string" || body.title.trim().length === 0)
  ) {
    errors.push("title must be a non-empty string");
  }

  if (!partial && body.year === undefined) {
    errors.push("year is required");
  }

  if (
    body.year !== undefined &&
    (!Number.isInteger(body.year) ||
      body.year < 1888 ||
      body.year > maximumYear)
  ) {
    errors.push("year must be a valid integer");
  }

  if (!partial && body.genre === undefined) {
    errors.push("genre is required");
  }

  if (
    body.genre !== undefined &&
    (typeof body.genre !== "string" || body.genre.trim().length === 0)
  ) {
    errors.push("genre must be a non-empty string");
  }

  return errors;
}

function sendValidationError(res, details) {
  return res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Movie data is invalid",
      details: details,
    },
  });
}

function sendMovieNotFound(res) {
  return res.status(404).json({
    error: {
      code: "MOVIE_NOT_FOUND",
      message: "Movie not found",
    },
  });
}

function findMovieIndex(idParam) {
  const id = Number(idParam);
  return movies.findIndex((m) => m.id === id);
}

// GET /movies - return movies
app.get("/movies", (req, res) => {
  const { genre, minYear, sort } = req.query;
  const details = [];

  if (
    genre !== undefined &&
    (typeof genre !== "string" || genre.trim().length === 0)
  ) {
    details.push("genre must be a non-empty string");
  }

  let minYearNumber;
  if (minYear !== undefined) {
    if (typeof minYear !== "string" || !/^\d+$/.test(minYear.trim())) {
      details.push("minYear must be a whole number");
    } else {
      minYearNumber = Number(minYear.trim());
    }
  }

  if (sort !== undefined && sort !== "year" && sort !== "title") {
    details.push("sort must be year or title");
  }

  if (details.length > 0) {
    return res.status(400).json({
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "Query parameters are invalid",
        details: details,
      },
    });
  }

  let result = [...movies];

  if (genre !== undefined) {
    const wantedGenre = genre.trim().toLowerCase();
    result = result.filter((m) => m.genre.toLowerCase() === wantedGenre);
  }

  if (minYearNumber !== undefined) {
    result = result.filter((m) => m.year >= minYearNumber);
  }

  if (sort === "year") {
    result.sort((a, b) => a.year - b.year);
  } else if (sort === "title") {
    result.sort((a, b) => a.title.localeCompare(b.title));
  }

  res.status(200).json(result);
});

// GET /movies/:id
app.get("/movies/:id", (req, res) => {
  const index = findMovieIndex(req.params.id);

  if (index === -1) {
    return sendMovieNotFound(res);
  }

  res.status(200).json(movies[index]);
});

// POST /movies
app.post("/movies", (req, res) => {
  const body = req.body || {};
  const errors = validateMovie(body, false);

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const newMovie = {
    id: nextId,
    title: body.title.trim(),
    year: body.year,
    genre: body.genre.trim(),
  };

  nextId += 1;
  movies.push(newMovie);

  res.status(201).json(newMovie);
});

// PUT /movies/:id
app.put("/movies/:id", (req, res) => {
  const index = findMovieIndex(req.params.id);

  if (index === -1) {
    return sendMovieNotFound(res);
  }

  const body = req.body || {};
  const errors = validateMovie(body, false);

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const replacedMovie = {
    id: movies[index].id,
    title: body.title.trim(),
    year: body.year,
    genre: body.genre.trim(),
  };

  movies[index] = replacedMovie;

  res.status(200).json(replacedMovie);
});

// PATCH /movies/:id
app.patch("/movies/:id", (req, res) => {
  const index = findMovieIndex(req.params.id);

  if (index === -1) {
    return sendMovieNotFound(res);
  }

  const body = req.body || {};
  const errors = validateMovie(body, true);

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const movie = movies[index];

  if (body.title !== undefined) movie.title = body.title.trim();
  if (body.year !== undefined) movie.year = body.year;
  if (body.genre !== undefined) movie.genre = body.genre.trim();

  res.status(200).json(movie);
});

// DELETE /movies/:id
app.delete("/movies/:id", (req, res) => {
  const index = findMovieIndex(req.params.id);

  if (index === -1) {
    return sendMovieNotFound(res);
  }

  movies.splice(index, 1);

  res.status(204).send();
});

// Unknown route middleware
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "The requested route does not exist",
    },
  });
});

// Error-handling middleware
app.use((err, req, res, next) => {

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "The request body is not valid JSON",
      },
    });
  }

  console.error(err);

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred",
    },
  });
});

app.listen(PORT, (error) => {
  if (error) {
    console.error("Server could not start:", error.message);
    process.exit(1);
  }
  console.log(`Server is running on http://localhost:${PORT}`);
});