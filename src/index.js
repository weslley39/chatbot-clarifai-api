const request = require("request");
const bodyParser = require("body-parser");
const express = require("express");
const http = require("http");
const _ = require("underscore");
const Clarifai = require("clarifai");

const PREFIX = "/api/";

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("port", process.env.PORT || 3010);

const server = app.listen(app.get("port"), () => {
  console.log("The Magic Happens on Port: ", app.get("port"));
});

const clarifai = new Clarifai.App({
  apiKey: 'YOUR API KEY HERE'
});

app.get(`${PREFIX}celebrities`, (req, res) => {
  let imageUrl = req.query.imageUrl;

  if (!imageUrl) {
    return res.status(500).send({
      message: "You should pass a url with a identify",
      status: "error"
    });
  }

  clarifai.models.predict("e466caa0619f444ab97497640cefc4dc", imageUrl).then(
    function(response) {
      if (!response) {
        return res.status(200).send([
          {
            text: "Viiish! Não a menor ideia de quem seja..."
          }
        ]);
      }
      let messages = [
        { text: "Ah! mas é claro, nessa imagem que você mandou temos:" }
      ];
      response.outputs[0].data.regions.forEach(region => {
        messages.push({
          text: region.data.face.identity.concepts[0].name
        });
      });
      return res.status(200).send(messages);
    },
    function(err) {
      if (err) {
        return res.status(200).send([
          {
            text: err
          }
        ]);
      }
    }
  );
});

app.get(`${PREFIX}predilect`, (req, res) => {
  let imageUrl = req.query.imageUrl;
  if (!imageUrl) {
    return res.status(500).send({
      message: "You should pass a url with a identify",
      status: "error"
    });
  }

  clarifai.models.predict(Clarifai.GENERAL_MODEL, imageUrl).then(
    function(response) {
      if (!response) {
        return res.status(200).send([
          {
            text: "Viiish! Não a menor ideia de quem seja..."
          }
        ]);
      }
      let messages = [];

      const uniqConcepts = _.uniq(response.outputs[0].data.concepts, obj => {
        return obj.name;
      });

      for (let i = 0; i < 5; i++) {
        const concept = uniqConcepts[i];
        messages.push({
          text: concept.name
        });
      }
      return res.status(200).send(messages);
    },
    function(err) {
      if (err) {
        return res.status(200).send([
          {
            text: err
          }
        ]);
      }
    }
  );
});
