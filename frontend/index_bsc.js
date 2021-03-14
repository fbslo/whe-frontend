var deposit_account;
var min_amount;
var max_amount;
var fee;

async function isEthereumAddressCorrect(){
  var web3 = new Web3(Web3.givenProvider || "https://bsc-dataseed.binance.org/");
  try {
    let raw_address = document.getElementById("eth").value
    const address = web3.utils.toChecksumAddress(raw_address)
    document.getElementById("invalid_eth_address").innerHTML = ''
    processHiveDeposit(address)
  } catch(e) {
    console.error('Invalid ethereum address:', e.message)
    document.getElementById("invalid_eth_address").innerHTML = 'Please provide a valid Ethereum address.'
  }
}

function processHiveDeposit(address){
  let hiveAccount = document.getElementById("hive").innerText
  let token = document.getElementById("symbol").innerText
  Swal.fire({
    text: 'How much '+token+' would you like to deposit?',
    input: 'text',
  }).then(async function(result) {
    if (!isNaN(result.value)) {
      const amount = parseFloat(result.value).toFixed(3)
      if (amount > max_amount || amount < min_amount) alert("Max amount is "+max_amount+" and min amount is "+min_amount)
      else {
        Swal.fire({text: 'You will receive '+(Number(amount) - 1)+' b'+token+' (1 '+token+' transaction fee)!', showCancelButton: true,}).then((isConfirmed) => {
          if (isConfirmed.isConfirmed){
            if(window.hive_keychain) {
              requestKeychain(amount, address, token, hiveAccount)
            } else {
              requestHiveSigner(amount, address, token, hiveAccount)
            }
          }
        })
      }
    } else alert("use numbers")
  })
}

function requestHiveSigner(amount, address, token, hiveAccount){
  let json = {
    contractName: 'tokens',
    contractAction: 'transfer',
    contractPayload: {
      symbol: token,
      to: hiveAccount,
      quantity: parseFloat(amount).toFixed(3),
      memo: address
    }
  }
  json = JSON.stringify(json)
  let domain = location.protocol + "//" + location.host
  Swal.fire({
    text: 'What is you HIVE username?',
    input: 'text'
  }).then(function(result) {
    let url = `https://hivesigner.com/sign/custom-json?authority=active&required_auths=["${result.value}"]&required_posting_auths=[]&id=ssc-mainnet-hive&json=${encodeURIComponent(json)}&redirect_uri=`+domain
    var win = window.open(url, '_blank');
    win.focus();
  })
}

function requestKeychain(amount, address, token, hiveAccount){
  let symbol = document.getElementById("symbol").innerText
  Swal.fire({
    text: 'What is you HIVE username?',
    input: 'text'
  }).then(function(result) {
    let json = {
      contractName: 'tokens',
      contractAction: 'transfer',
      contractPayload: {
        symbol: token,
        to: hiveAccount,
        quantity: parseFloat(amount).toFixed(3),
        memo: address
      }
    }
    json = JSON.stringify(json)
    hive_keychain.requestCustomJson(result.value, 'ssc-mainnet-hive', 'Active', json, symbol+' transfer', function(response) {
      console.log(response);
    })
  })
}

function displayDetails(){
  var html = `<div class="row">
    <div class="col-md-2">
    </div>
    <div class="col-md-8">
      <div class="main-card mb-3 card">
        <div class="card-body"><h4 class="card-title">Conversion details</h4>
          <button class="mt-1 btn" onClick='requestMetaMask()'><img srcset="/assets/images/metamask.png 10x"></button>
        </div>
      </div>
    </div>
    <div class="col-md-2">
    </div>
  </div>`
  document.getElementById('deposit_data').innerHTML = html
}

function copy(address){
  navigator.clipboard.writeText(address);
}

// document.addEventListener('DOMContentLoaded', function() {
//   if (localStorage.getItem("disclaimer") != 'true'){
//     Swal.fire({
//       title: 'Disclaimer',
//       html: "This app is still in beta, use at your own risk!<br><small>You will not see this message again</small>",
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#3085d6',
//       cancelButtonColor: '#d33',
//       confirmButtonText: 'I understand!'
//     }).then((result) => {
//       if (result.value) {
//         localStorage.setItem("disclaimer", 'true');
//       } else {
//         window.location.href = "http://hive.io";
//       }
//     })
//   }
// }, false);

async function requestMetaMask(deposit_address){
  let hiveAccount = document.getElementById("hive").innerText
  let symbol = document.getElementById("symbol").innerText
  if (typeof window.ethereum !== 'undefined') {
    let accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    Swal.fire({
      text: 'How much b'+symbol+' would you like to convert?',
      input: 'text'
    }).then(function(result) {
      if (!isNaN(result.value)) {
        const amount = parseFloat(result.value).toFixed(3)
        sendTx(account, hiveAccount, amount)
      } else alert("use numbers")
    })
  } else {
    alert("MetaMask is not installed!")
  }
}

async function sendTx(account, hiveAccount, amount){
  let contract = document.getElementById("contract").innerText
  let abiArray = await getAbiArray()
  let chainId = await ethereum.request({ method: 'eth_chainId' });
  if (chainId != 56){
    alert(`Chain ID is not 56, you are using wrong network. Please switch to Binance Smart Chain Mainnet!`)
  } else {
    const Web3 = window.Web3;
    const web3 = new Web3(window.web3.currentProvider);
    var contract = new web3.eth.Contract(abiArray, contract);
    const contractFunction = contract.methods.convertTokenWithTransfer(amount * 1000, hiveAccount);
    const functionAbi = contractFunction.encodeABI();
    const transactionParameters = {
      nonce: '0x00', // ignored by MetaMask
      to: contract, // Required except during contract publications.
      from: account, // must match user's active address.
      data: functionAbi, // Optional, but used for defining smart contract creation and interaction.
      chainId: 56, // Used to prevent transaction reuse across blockchains. Auto-filled by MetaMask.
    };

    // txHash is a hex string
    // As with any RPC call, it may throw an error
    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });
  }
}

function getAbiArray(){
  return [
	{
		"constant": true,
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "spender",
				"type": "address"
			},
			{
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "from",
				"type": "address"
			},
			{
				"name": "to",
				"type": "address"
			},
			{
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "account",
				"type": "address"
			}
		],
		"name": "removeMinter",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"name": "",
				"type": "uint8"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "cap",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "spender",
				"type": "address"
			},
			{
				"name": "addedValue",
				"type": "uint256"
			}
		],
		"name": "increaseAllowance",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "unpause",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "account",
				"type": "address"
			},
			{
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "mint",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "account",
				"type": "address"
			}
		],
		"name": "isPauser",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "paused",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "account",
				"type": "address"
			}
		],
		"name": "removePauser",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "renouncePauser",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "account",
				"type": "address"
			}
		],
		"name": "addPauser",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "pause",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "amount",
				"type": "uint256"
			},
			{
				"name": "username",
				"type": "string"
			}
		],
		"name": "convertTokenWithTransfer",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "isOwner",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "account",
				"type": "address"
			}
		],
		"name": "addMinter",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "renounceMinter",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "spender",
				"type": "address"
			},
			{
				"name": "subtractedValue",
				"type": "uint256"
			}
		],
		"name": "decreaseAllowance",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "to",
				"type": "address"
			},
			{
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "account",
				"type": "address"
			}
		],
		"name": "isMinter",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "owner",
				"type": "address"
			},
			{
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "sender",
				"type": "address"
			},
			{
				"name": "recipient",
				"type": "address"
			},
			{
				"name": "amount",
				"type": "uint256"
			},
			{
				"name": "username",
				"type": "string"
			}
		],
		"name": "convertTokenFromWithTransfer",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "account",
				"type": "address"
			}
		],
		"name": "Paused",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "account",
				"type": "address"
			}
		],
		"name": "Unpaused",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "account",
				"type": "address"
			}
		],
		"name": "PauserAdded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "account",
				"type": "address"
			}
		],
		"name": "PauserRemoved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "account",
				"type": "address"
			}
		],
		"name": "MinterAdded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "account",
				"type": "address"
			}
		],
		"name": "MinterRemoved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "username",
				"type": "string"
			}
		],
		"name": "convertToken",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	}
]
}
