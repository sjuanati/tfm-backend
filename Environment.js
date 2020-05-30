const env = () => {

    // Simulation
    //return 'LOCAL';

    // Production
    return 'AWS';
}

module.exports = Object.freeze(env);