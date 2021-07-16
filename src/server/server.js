import Web3 from 'web3';
import express from 'express';
import { sample } from 'lodash';

import { abi as appAbi } from '../../build/contracts/FlightSuretyApp.json';
import { localhost as config } from './config.json';

const STATUS_CODES = [10, 20, 30, 40, 50];

const web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
const flightSuretyApp = new web3.eth.Contract(appAbi, config.appAddress);
const { OracleRequest } = flightSuretyApp.events;

OracleRequest({ fromBlock: 0 }, (error, event) => {
    if(error) {return}

    const statusCode = sample(STATUS_CODES);
    const { index, airline, flight, timestamp  } = event.returnValues;
    const intIndex = parseInt(index);

    let selectedOracles = [];

    for (let key in config.oracles) {
        if (config.oracles[key].includes(intIndex)) {
            selectedOracles.push(key);
        }
    }

    selectedOracles.forEach(oracle => {
        flightSuretyApp.methods
            .submitOracleResponse(intIndex, airline, flight, timestamp, statusCode)
            .send({from: oracle});
    });
});

const app = express();

app.get('/api', (req, res) => {
    res.send({
        message: 'An API for use with your Dapp!'
    });
});

export default app;