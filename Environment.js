const env = () => {

    // Simulation
    return 'SIM';

    // Production
    //return 'PROD';
}

module.exports = Object.freeze(env);