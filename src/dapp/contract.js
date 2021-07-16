import config from './config.json';
import appArtifact from '../../build/contracts/FlightSuretyApp.json';

class Contract {
    constructor(web3, networkName, account) {
        this.web3 = web3;
        this.networkName = networkName;
        this.account = account;
        this.contract = new this.web3.eth.Contract(appArtifact.abi, config[networkName].appAddress);  
    }

    async buyInsuranceFor(airline, flight, timestamp, amount, callback) {
        const { buyInsurance } = this.contract.methods;
        
        buyInsurance(airline, flight, timestamp)
            .send({from: this.account, value: this.web3.utils.toWei(amount)})
            .on("receipt", callback)
            .on("error", this.onError);
    }

    async claimInsuranceFor(airline, flight, timestamp, callback) {
        const { claimInsurance } = this.contract.methods;
        
        claimInsurance(airline, flight, timestamp)
            .send({ from: this.account })
            .on("receipt", callback)
            .on("error", this.onError);
    }

    async withdrawInsuranceFor(airline, flight, timestamp, callback) {
        const { withDrawInsurance } = this.contract.methods;
        
        withDrawInsurance(airline, flight, timestamp)
            .send({ from: this.account })
            .on("receipt", callback)
            .on("error", console.error);
    }

    async loadFlights() {
        const { fetchFlight, getInsurance } = this.contract.methods;
        let flights = [];

        await Promise.all(
            config[this.networkName].flights.map(async flight => {
                const { name, timestamp, airline } = flight;
                const results = await fetchFlight(airline, name, timestamp).call();
                const {amount: insuranceAmount, status: insuranceStatus, claimAmount} = await getInsurance(airline, name, timestamp).call({from: this.account});
                
                flights.push({ 
                    name, 
                    airline,
                    timestamp: results.timestamp, 
                    airlineName: results.airlineName,
                    statusCode: results.statusCode,
                    amount: this.web3.utils.fromWei(insuranceAmount),
                    claimAmount,
                    insuranceStatus
                });
            })
        );

        return flights;
    }

    async fetchFlightStatus(airline, flight, timestamp) {
        const { fetchFlightStatus } = this.contract.methods;

        await fetchFlightStatus(airline, flight, timestamp).send({ from: this.account });
    }

    onError(error, receipt) {
        alert(`${error.code}: ${error.message}`);
    }
}

export default Contract;