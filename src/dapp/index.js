
import Web3 from 'web3';
import {html, render} from 'lit-html';

import config from './config.json';
import Contract from './contract';

import './flightsurety.css';

const STATUS_CODES = {
    "0": "UNKNOWN",
    "10": "ON_TIME",
    "20": "LATE_AIRLINE",
    "30": "LATE_WEATHER",
    "40": "LATE_TECHNICAL",
    "50": "LATE_OTHER"
}

class App {
    constructor() {
        this.web3 = null;
        this.appContract = null;
        this.networkName = 'localhost';
        this.flights = [];

        this.start = this.start.bind(this);
        this.renderFlights = this.renderFlights.bind(this);
        this.airlineTableTemplate = this.airlineTableTemplate.bind(this);
        this.renderAction = this.renderAction.bind(this);
        this.addEventListeners = this.addEventListeners.bind(this);
        this.flightStatusInfoEventHandler = this.flightStatusInfoEventHandler.bind(this);
        this.onInsurancePurchase = this.onInsurancePurchase.bind(this);
        this.fetchStatusHandler = this.fetchStatusHandler.bind(this);
        this.claimHandler = this.claimHandler.bind(this);
        this.withdrawHandler = this.withdrawHandler.bind(this);
    }

    async start() {
        if (window.ethereum) {
            this.web3 = new Web3(Web3.givenProvider || new Web3.providers.HttpProvider(config[networkName].url)); // use MetaMask's provider
            await window.ethereum.enable(); // get permission to access accounts
        } else {
            console.warn('No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live');
            this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'));
        }

        // Initialize contract
        const accounts = await this.web3.eth.getAccounts();
        this.appContract = new Contract(this.web3, this.networkName, accounts[0]);
        const { FlightStatusInfo } = this.appContract.contract.events;
        FlightStatusInfo({ fromBlock: 0 }, this.flightStatusInfoEventHandler);

        // Fetch flights
        this.flights = await this.appContract.loadFlights();
        this.renderFlights();

        // Add Event Listerners
        this.addEventListeners();
    }

    renderFlights() {
        const { airlineTableTemplate, flights } = this;
        
        render(
            airlineTableTemplate(flights), 
            document.querySelector("#tableAirline tbody")
        );
    }

    airlineTableTemplate(flights) {
        const { renderAction } = this;

        return(
            html`
                ${flights.map((flight) => html`
                    <tr data-airline=${flight.airline} data-flight=${flight.name} data-timestamp=${flight.timestamp}>
                        <td>${flight.name}</td>
                        <td>${flight.airlineName}</td>
                        <td>${new Date(flight.timestamp*1000).toLocaleString("en-US")}</td>
                        <td>${renderAction(flight)}</td>
                    </tr>
                `)}
            `
        );
    }

    renderAction(flight) {
        const { openModal, fetchStatusHandler, claimHandler, withdrawHandler } = this;

        if(flight.amount === "0") {
            return(
                html`<button type="button" class="btn btn-primary" @click=${openModal}>BUY</button>`
            )  
        }
    
        switch(flight.statusCode) {
            case "0":
                return(
                    html`<button type="button" class="btn btn-info" @click=${fetchStatusHandler}>CHECK STATUS</button>`
                );
            case "20":
                switch(flight.insuranceStatus) {
                    case "0":
                        return(
                            html`<button type="button" class="btn btn-info" @click=${claimHandler}>CLAIM</button>`
                        );
                    case "1":
                        return(
                            html`<button type="button" class="btn btn-info" @click=${withdrawHandler}>
                                    WITHDRAW ${Web3.utils.fromWei(flight.claimAmount)} Ether
                                </button>`
                        );
                    case "2":
                        return(`WITHDRAWN ${Web3.utils.fromWei(flight.claimAmount)} Ether`);
                }
            default:
                return STATUS_CODES[flight.statusCode];
        }
    }

    addEventListeners() {
        document.querySelector("#formInsurance").addEventListener("submit", this.onInsurancePurchase);

        $('#modalInsurance').on('hidden.bs.modal', function (e) {
            document.querySelector("#amount").value = "";
            document.querySelector("#airline").value = "";
            document.querySelector("#flight").value = "";
            document.querySelector("#timestamp").value = "";
        });
    }
  
    flightStatusInfoEventHandler(error, event) {
        if(error) { return; }

        const { flights, renderFlights } = this;

        flights.forEach(flight => { 
            if(flight.name === event.returnValues.flight) { flight.statusCode = event.returnValues.status; }
        });

        renderFlights(flights);
    }

    onInsurancePurchase(event) {
        event.preventDefault();

        const { appContract } = this;
        const amount = event.target.querySelector("#amount").value;
        const airline = event.target.querySelector("#airline").value;
        const flight = event.target.querySelector("#flight").value;
        const timestamp = event.target.querySelector("#timestamp").value;
    
        appContract.buyInsuranceFor(airline, flight, timestamp, amount, _ => {
            $('#modalInsurance').modal('hide');
            location.reload();
        });
    }

    fetchStatusHandler(event) {
        event.preventDefault();
    
        const { airline, flight, timestamp } = event.target.closest('tr').dataset;
    
        this.appContract.fetchFlightStatus(airline, flight, timestamp, console.log);
    }

    claimHandler(event) {
        event.preventDefault();
    
        const { airline, flight, timestamp } = event.target.closest('tr').dataset;
    
        this.appContract.claimInsuranceFor(airline, flight, timestamp, _ => {
            location.reload();
        });
    }

    withdrawHandler(event) {
        event.preventDefault();
    
        const { airline, flight, timestamp } = event.target.closest('tr').dataset;
    
        this.appContract.withdrawInsuranceFor(airline, flight, timestamp, _ => {
            location.reload();
        });
    }

    openModal(event) {
        event.preventDefault();
        const { airline, flight, timestamp } = event.target.closest('tr').dataset;
        
        document.querySelector("#airline").value = airline;
        document.querySelector("#flight").value = flight;
        document.querySelector("#timestamp").value = timestamp;
    
        $('#modalInsurance').modal('show');
    }
}

const app = new App();
window.addEventListener("load", app.start);
