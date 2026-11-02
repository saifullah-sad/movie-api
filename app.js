const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());

let movies = [
  {
    id: 1,
    title: "Inception",
    director: "Christopher Nolan",
    year: 2010,
  },
  {
    id: 2,
    title: "The Matrix",
    director: "The Wachowskis",
    year: 1999,
  },
  {
    id: 3,
    title: "Parasite",
    director: "Bong Joon-ho",
    year: 2019,
  },
];

// GET /movies - return all movies
app.get("/movies", (req, res) => {
  res.status(200).json(movies);
});

// GET /movies/:id - return one movie
app.get("/movies/:id", (req, res) => {
  const id = Number(req.params.id);
  const movie = movies.find((m) => m.id === id);

  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  res.status(200).json(movie);
});

// POST /movies - add a new movie
app.post("/movies", (req, res) => {
  const { title, director, year } = req.body || {};

  if (!title || !director || !year) {
    return res
      .status(400)
      .json({ error: "title, director and year are required" });
  }

  const newId =
    movies.length > 0 ? Math.max(...movies.map((m) => m.id)) + 1 : 1;

  const newMovie = { id: newId, title, director, year };
  movies.push(newMovie);

  res.status(201).json(newMovie);
});
// PATCH /movies/:id - update some fields of a movie
app.patch("/movies/:id", (req, res) => {
  const id = Number(req.params.id);
  const movie = movies.find((m) => m.id === id);

  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  const { title, director, year } = req.body || {};

  if (title === undefined && director === undefined && year === undefined) {
    return res
      .status(400)
      .json({ error: "Provide at least one of title, director or year" });
  }

  if (title !== undefined) movie.title = title;
  if (director !== undefined) movie.director = director;
  if (year !== undefined) movie.year = year;

  res.status(200).json(movie);
});

// DELETE /movies/:id - delete a movie
app.delete("/movies/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = movies.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Movie not found" });
  }

  movies.splice(index, 1);

  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});