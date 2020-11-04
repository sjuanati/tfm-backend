const Web3 = require('web3');
import env = require('../Environment');
const Cons = require((env() === 'AWS') ? '/home/ubuntu/.ssh/Constants' : '../Constants');

// Blockchain settings (Ganache)
const web3 = new Web3(Cons.BLOCKCHAIN.URL_HTTP);

/**
 * @dev Generic function to execute Ethereum transactions with signature
 * @returns @result: true if transaction was executed successfuly, or false otherwise
 * @returns @error: error description if transaction failed
 * @returns @res: transaction response  
 * @param params.fromAddress        From account
 * @param params.fromAddressKey     From private key   
 * @param params.encodedABI         Contract data 
 * @param params.contractAddress    Contract address
 */
const executeTX = (params: any) => {
    return new Promise(async (resolve) => {

        // Prepare transaction
        const nonce = await web3.eth.getTransactionCount(params.fromAddress);
        const tx = {
            gas: 1500000,
            gasPrice: '30000000000',
            from: params.fromAddress,
            data: params.encodedABI,
            chainId: Cons.BLOCKCHAIN.chainId,
            to: params.contractAddress,
            nonce: nonce,
        };

        // Sign transaction
        web3.eth.accounts.signTransaction(tx, params.fromAddressKey)
            .then((signed: any) => {
                // Send transaction
                web3.eth.sendSignedTransaction(signed.rawTransaction)
                    .then(async (res: any) => {
                        resolve({ result: true, error: null, output: res });
                    })
                    .catch((err: string) => {
                        console.log('Error in ethUtils.js (A) -> executeTX(): ', err);
                        resolve({ result: false, error: err, output: null });
                    });
            })
            .catch((err: string) => {
                console.log('Error in ethUtils.js (B) -> executeTX(): ', err);
                resolve({ result: false, error: err, output: null });
            });
    })
}

module.exports = {
    executeTX
}

