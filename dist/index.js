
const request = require('request');
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const _ = require('underscore');
const moment = require('moment');
const CronJob = require('cron').CronJob;

// Vars
let isVoting;
let lastVoting;
let currentAction;
let currentVoting;
let mainResponseUrl;

// Constants
const COLOR = '#2980b9';
const TIME_NEXT_VOTE = 30;

// Enum
const ACTIONS = {
  TURN_ON: 'ligar',
  TURN_OFF: 'desligar'
};

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('port', process.env.PORT || 3000);

const server = app.listen(app.get('port'), () => {
  console.log('Running Bot server...', app.get('port'));
});

const startVoting = action => {
  isVoting = true;
  currentAction = action;
  currentVoting = {
    yes: [],
    no: []
  };
};

const updateMessage = (url, message, callback) => {
  const options = {
    uri: url,
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    json: message
  };

  request(options, (err, res, body) => {
    callback(err, body);
  });
};

const getAttachments = action => {
  let attachments = [];

  if (action === ACTIONS.TURN_ON) {
    attachments.push({
      text: 'Olá, foi solicitado o meu ligamento, porem para acontece-lo, necessito de votação:' + '\n:white_check_mark: - Continuar desligado ' + '`' + currentVoting.yes.length + '`' + '\n:negative_squared_cross_mark: - Ligar ' + '`' + currentVoting.no.length + '`'
    });
  } else if (action === ACTIONS.TURN_OFF) {
    attachments.push({
      text: 'Olá, foi solicitado o meu desligamento, porem para acontece-lo, necessito de votação:' + '\n:white_check_mark: - Continuar ligado' + '`' + currentVoting.yes.length + '`' + '\n:negative_squared_cross_mark: - Desligar' + '`' + currentVoting.no.length + '`'
    });
  }

  attachments.push({
    "text": "Selecione:",
    "fallback": "Você ja votou :)",
    "callback_id": "voting",
    "color": COLOR,
    "attachment_type": "default",
    "actions": [{
      "name": "vote",
      "text": ":white_check_mark:",
      "type": "button",
      "value": "yes"
    }, {
      "name": "vote",
      "text": ":negative_squared_cross_mark:",
      "type": "button",
      "value": "no"
    }]
  });

  return attachments;
};

const canStartNewVote = () => {
  if (!lastVoting) {
    return true;
  }

  const lastVotingTime = moment(lastVoting);
  const now = moment();
  var duration = moment.duration(now.diff(lastVotingTime));
  var minutes = duration.asMinutes();
  return lastVotingTime.fromNow(true);
};

const setVoteEnd = () => {
  let job;
  job = new CronJob({
    cronTime: '0 */1 * * * *',
    onTick: function () {
      job.stop();
      isVoting = false;
      lastVoting = new Date();
      calcAction();
    },
    start: true,
    timeZone: 'America/Sao_Paulo'
  });
};

const sendMessageToDoSomething = () => {};

const sendMessageToDoNothing = () => {
  let data = {
    response_type: 'ephemeral',
    attachments: [{
      color: COLOR,
      text: 'Sua solicitação não foi efetuada pois não obetive votos suficientes :('
    }, {}]
  };
  updateMessage(mainResponseUrl, data);
};

const calcAction = () => {
  if (currentVoting.yes > currentVoting.no) {
    sendMessageToDoSomething();
  } else {
    sendMessageToDoNothing();
  }
};

app.post('/', (req, res) => {
  let actionRequested = req.body.text;
  mainResponseUrl = req.body.response_url;

  let data = {
    response_type: 'ephemeral',
    attachments: [{
      color: COLOR
    }, {}]
  };

  if (actionRequested !== ACTIONS.TURN_ON && actionRequested !== ACTIONS.TURN_OFF) {
    data.attachments[0].text = 'Comando inválido, comandos disponiveis `ligar` e `desligar`';
    returnres.json(data);
  }

  if (!canStartNewVote()) {
    data.attachments[0].text = 'A ultima votação foi muito recente, aguarde um momento para poder solicitar a votação novamente';
    return res.json(data);
  }

  if (isVoting === true) {
    data.attachments[0].text = 'Uma votação já esta acontecendo, por favor, aguarde';
    return res.json(data);
  }

  startVoting(actionRequested);

  data.attachments = getAttachments(actionRequested);
  data.response_type = 'in_channel';

  updateMessage(mainResponseUrl, data, (err, result) => {
    if (err) {
      return res.status(500).send({
        message: err,
        status: 'error'
      });
    }

    setVoteEnd();
    return res.status(200).end();
  });
});

app.post('/vote', (req, res) => {
  const body = req.body;
  const payload = JSON.parse(body.payload);
  const action = payload.actions[0];
  const responseUrl = payload.response_url;
  let data;

  if (isVoting === true && !_.contains(_.union(currentVoting.yes, currentVoting.no), payload.user.id)) {
    if (action.value === 'yes') {
      currentVoting.yes.push(payload.user.id);
    } else if (action.value === 'no') {
      currentVoting.no.push(payload.user.id);
    }

    data = {
      attachments: getAttachments(currentAction)
    };

    updateMessage(responseUrl, data, (err, result) => {
      if (err) {
        return res.status(500).send({
          message: err,
          status: 'error'
        });
      }

      return res.status(200).end();
    });
  }
});