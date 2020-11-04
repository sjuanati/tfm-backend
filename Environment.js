const env = () => {

    // Simulation - HTTP
    return 'LOCAL';

    // Production - HTTPS
    //return 'AWS';
}

module.exports = Object.freeze(env);