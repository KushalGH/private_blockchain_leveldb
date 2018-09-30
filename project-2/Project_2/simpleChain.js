/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const {
  addLevelDBData,
  getLevelDBData,
  getCompleteBlocksDBData,
  addDataToLevelDB
} = require('./levelSandbox.js');

const SHA256 = require('crypto-js/sha256');


/* ===== Block Class ==============================
|  Class with a constructor for block          |
|  ===============================================*/

class Block {
  constructor(data){
   this.hash = "",
   this.height = 0,
   this.body = data,
   this.time = 0,
   this.previousBlockHash = "0x"
 }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain    |
|  ================================================*/

class Blockchain{


  constructor() {

    var self = this;
    this.getBlockHeight()
    .then(function(data) {
      if(data == 0) {            
        self.addBlock(new Block("First block in the chain - Genesis block"))
        .then(function() {

        })
        .catch(function(err) {
          console.log(err);
        })
      }
    })
  }

  comments() {
    return "||" + "=".repeat(20) + " {0} " + "=".repeat(20) + "||";
  }

  // Add new block
  addBlock(newBlock){

    var self = this;
    return new Promise(function(resolve, reject) {
      console.log(newBlock);
      if(typeof newBlock === 'object') { 
        getCompleteBlocksDBData().then(function(data) {
          console.log("addBlock entered: ", data);
            // Block height
            if(typeof newBlock === 'object') {
              newBlock.height = data.length;
            // UTC timestamp
            newBlock.time = new Date().getTime().toString().slice(0,-3);
            // previous block hash
            if(data.length > 0){
              newBlock.previousBlockHash = JSON.parse(data[data.length-1].value).hash;
            }
            else {
              var welcome_message = "Welcome to your private Blockchain";
              console.log(self.comments().replace("{0}", "Welcome to your private Blockchain"));
              console.log(self.comments().replace("{0}", "=".repeat(welcome_message.length)));         
            }
            // Block hash with SHA256 using newBlock and converting to a string
            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
            console.log("IMPORTANT: newBlock structure", JSON.stringify(newBlock));
            // Adding block object to chain
            addDataToLevelDB(JSON.stringify(newBlock))
            .then(function(result)  {
              resolve("addBlock resolved", result);
            });              
          }
          else {
            reject();
          }        
        })
      }
      else {
        var error = "It is not a Block object. Please enter a Block. example: obj.addBlock(new Block('My First Block'))";
        console.log(error)
        reject(error);
      }

    });


  }

  // Get block height
  getBlockHeight()
  {
    return getCompleteBlocksDBData().then(function(data) {
      console.log(data);
      return data ? data.length : -1;
    })
      //return this.chain.length-1;
    }

    // get block
    getBlock(blockHeight){
      return getLevelDBData(blockHeight).then(function(data) {
        return data;
      })
      // return object as a single string
      //return JSON.parse(JSON.stringify(this.chain[blockHeight]));
    }

    // validate block
    validateBlock(blockHeight){

      return new Promise(function(resolve, reject) {
        getCompleteBlocksDBData().then(function(data) {
            // get block object
            let block = JSON.parse(data[blockHeight].value); 
            // get block hash
            let blockHash = block.hash;
            // remove block hash to test block integrity
            block.hash = '';
            // generate block hash
            let validBlockHash = SHA256(JSON.stringify(block)).toString();
            // Compare
            console.log("validBlockHash : ", validBlockHash);
            console.log("blockHash      : ", blockHash);
            if (blockHash===validBlockHash) {
             return resolve(true);
           } else {
            console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
            return reject(false);
          }
        })
      })
    }


    validateBlockConnection(height) {
      var self = this;
      return new Promise(function(resolve, reject) {
        self.validateBlock(height).then(function(result) {
          if(!result) {
            console.error("validateBlockConnection not valid");
            return reject(false);
          }
          else {
            self.getBlock(height).then(function(data) {
              console.log("current block", data);
              var currentBlockPrevHash = (JSON.parse(data).previousBlockHash).toString();
              console.log("current blockHash", currentBlockPrevHash);
              if(height > 0 ) {
                self.getBlock(height - 1).then(function(prevdata) {

                  console.log("previous block", prevdata);

                  let prevBlockCurrentHash = (JSON.parse(prevdata).hash).toString();

                  console.log("compare var 1: prevBlockCurrentHash: ", prevBlockCurrentHash);                  
                  console.log("compare var 2: currentBlockPrevHash: ", currentBlockPrevHash);

                  if(prevBlockCurrentHash == undefined || prevBlockCurrentHash == null ||
                   currentBlockPrevHash == undefined || currentBlockPrevHash == null ||
                   prevBlockCurrentHash != currentBlockPrevHash) 
                  {
                    console.log("validateBlockConnection no valid");
                    return reject(false);
                  }
                  else {
                    console.log("validateBlockConnection valid");
                    return resolve(true);
                  }
                })                
              }
              else if(height == 0){
                console.log("validateBlockConnection valid");
                return resolve(true);
              }
            })
          }
        })
      })
    }

   // Validate blockchain
   validateChain(){
    var self = this;
    return(new Promise(function(resolve, reject) {
      getCompleteBlocksDBData().then(function(data) {
        let errorLog = [];
        var promiseArray = [];
        for (var i = 0; i < data.length; i++) {
              // validate block
              promiseArray.push(self.validateBlockConnection(i))
            }

            Promise.all(promiseArray).then(function(result) {
              console.log(result);
              if (data.length == promiseArray.length) {
                console.log('No errors detected');
                return resolve(true);

              } else {
                console.log('Block errors = ' + errorLog.length);
                console.log('Blocks: '+errorLog);
                return resolve(false);
              }
            })
            .catch(function(err) {
              console.log("Your Blockchain is not valid");
              return resolve(false);
            })
          })
    }));
  }
}


(function theLoop (i) {
      let myBlockChain = new Blockchain();
    setTimeout(function () {

        let blockTest = new Block("Test Block - " + (i + 1));
        myBlockChain.addBlock(blockTest).then((result) => {
            console.log(result);
            i++;
            if (i < 10) theLoop(i);
        });
    }, 10000);
  })(0);
  