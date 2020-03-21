// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require("firebase-functions");

const { admin } = require("./src/utils/admin");

const needRoutes = require("./src/routes/need");

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.addMessage = functions.https.onRequest(async (req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into the Realtime Database using the Firebase Admin SDK.
  const snapshot = await admin
    .database()
    .ref("/messages")
    .push({ original: original });
  // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
  res.redirect(303, snapshot.ref.toString());
});

// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.makeUppercase = functions.database
  .ref("/messages/{pushId}/original")
  .onCreate((snapshot, context) => {
    // Grab the current value of what was written to the Realtime Database.
    const original = snapshot.val();
    console.log("Uppercasing", context.params.pushId, original);
    const uppercase = original.toUpperCase();
    // You must return a Promise when performing asynchronous tasks inside a Functions such as
    // writing to the Firebase Realtime Database.
    // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
    return snapshot.ref.parent.child("uppercase").set(uppercase);
  });

const express = require("express");
const cors = require("cors");
const { ValidationError } = require("express-validation");

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
app.use(express.json());

const movies = [
  { id: 1, title: "Spiderman" },
  { id: 2, title: "Matrix" },
  { id: 3, title: "Lord of the Rings" }
];

// build multiple CRUD interfaces:
app.get("/movies/:id", (req, res) =>
  res.send(movies.find(movie => movie.id === req.params.id))
);
app.post("/movies", (req, res) => {
  movies.push(req.body);
  res.send(movies);
});
app.get("/movies", (req, res) => res.send(movies));
app.use("/needs", needRoutes);

app.use(function(err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json(err);
  }

  return res.status(500).json(err);
});

// Expose Express API as a single Cloud Function:
exports.api = functions.https.onRequest(app);
