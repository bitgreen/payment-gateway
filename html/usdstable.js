"use strict";
let endTx = false;
window.addEventListener("load", async () => {
  init();
  document.querySelector("#btn-crypto").addEventListener("click", onCrypto);
});

async function onCrypto() {
  onConnect();
}

async function onLoadingStart() {
  hideElement("#msg");
  hideElement("#approve-btn");
  hideElement("#product-history");
  hideElement("#ViewExplorer");
  showLoading();
  makePayment();
}

async function hideElement(element) {
  let el = document.querySelector(element);

  if (!el) {
    console.log(`Element not found. `);
    return false;
  }
  el.style.display = "none";
}

async function showWalletTransfer(fromAdd, toAdd) {
  document.querySelector("#wallet-transfer ").innerHTML =
    '<div class="col-md-4  d-flex flex-column">                    <div class="d-flex justify-content-center align-items-center">                        <h6>MetaMask Wallet</h6>                    </div>                    <div class="d-flex align-items-center justify-content-start">' +
    fromAdd +
    '</div>                </div>         <div class="d-flex col-md-4 justify-content-center align-items-center"> <img src="./img/Arrow 1.png" /></div>                <div class="col-md-4  d-flex flex-column">                    <div class="d-flex justify-content-center align-items-center">                        <h6>Contract</h6>                    </div>                    <div class="d-flex justify-content-end align-items-center">' +
    toAdd +
    "</div>                </div>";
}
async function showHistory() {
  document.querySelector("#product-history").style.display = "block";
}
async function showApproveBtn() {
  document.querySelector("#approve-btn").innerHTML =
    '<button id="transaction-btn"                    class="col-md-4 d-flex justify-content-around align-items-center" onClick="onLoadingStart()" ><h6 style="font-weight:bold">Approve transaction</h6><img src="./img/arrow_forward.png" class="arrow-icon"/></button>';
}
async function showViewExplorerBtn() {
  let model = document.querySelector("#myModal");
  document.querySelector("#ViewExplorer").innerHTML =
    '<button id="transaction-btn"                    class="col-md-5 d-flex justify-content-around align-items-center" onClick=" " > View in explorer</button>';
  if (model) {
    document.querySelector("#ViewExplorer").innerHTML +=
      '<button id="closeWindow"                   class="col-md-5 d-flex justify-content-around align-items-center" onClick="onCloseModal() " > Close Window</button>';
  }
  document.querySelector("#ViewExplorer").style.display = "flex";
}
async function onCloseModal() {
  document.querySelector("#myModal").style.display = "none";
}
async function showLoading() {
  document.querySelector("#progress-load").innerHTML =
    '<div class="col-md-3 col-sm-6 d-flex justify-content-center align-items-center">                    <div class="spinner-border" role="status">  <span class="sr-only">Loading...</span></div>               </div>                <h3>Approve using your web3 </h3>                <div class="subtitle">once completed, this screen will update</div>';
  document.querySelector("#progress-load").style.display = "flex";
}
async function endLoad(fromAdd, toAdd) {
  hideElement("#progress-load");
  hideElement("#wallet-address");
  document.querySelector("#title").innerHTML =
    '<div class="col-md-12 d-flex justify-content-center align-items-center">' +
    '<h3 style="color:#224851;">Transaction Complete</h3>' +
    "</div>";
  showWalletTransfer(fromAdd, toAdd);
  showHistory();
  showViewExplorerBtn();
  document.querySelector(".payment-container").style.borderImageWidth = "10 10";
  document.querySelector(".payment-container").style.borderImageSlice = "23";
}

/**
 *  JavaScript code that interacts with the page and Web3 wallets
 */

// Unpkg imports
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;

// Web3modal instance
let web3Modal;

// Chosen wallet provider given by the dialog window
let provider;

// Address of the selected account
let selectedAccount;

let chainId;
/**
 * Setup the
 */

/**
 * Setup the
 */
function init() {
  console.log("Initializing");
  console.log("WalletConnectProvider is", WalletConnectProvider);
  console.log("Fortmatic is", Fortmatic);
  console.log(
    "window.web3 is",
    window.web3,
    "window.ethereum is",
    window.ethereum
  );

  // Check that the web page is run in a secure context,
  // as otherwise MetaMask won't be available
  // if (location.protocol !== "https:") {
  //   const alert = document.querySelector("#alert-error-https");
  //   alert.style.display = "block";
  //   document.querySelector("#btn-connect").setAttribute("disabled", "disabled");
  //   return;
  // }

  // Tell Web3modal what providers we have available.
  // Built-in web browser provider (only one can exist as a time)
  // like MetaMask, Brave or Opera is added automatically by Web3modal
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: "3a94cb95c0154e81bd0fa4eed4e16db4",
        // infuraID: "12846572d43c436caeef3d5033eb68f8", //testnet
      },
    },

    fortmatic: {
      package: Fortmatic,
      options: {
        key: "pk_live_BC8E55A98E2032FA",
        //key: pk_test_99D2798E73296FC8 //testnet
      },
    },
  };

  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
  });

  console.log("Web3Modal instance is", web3Modal);
  // get the parameters received
  let p = getCookie("p");
  let a = getCookie("a");
  let r = getCookie("r");
  let rp = getCookie("rp");
  let rnp = getCookie("rnp");
  let d = getCookie("d");
  let { amount, decimals } = getAmountDecimal(a);

  document.querySelector("#dollar").textContent = "$";
  document.querySelector("#amount").textContent = amount || 100;
  document.querySelector("#decimals").textContent = "." + decimals;
  document.querySelector("#reference").textContent = r || 123456;
  document.querySelector("#title").textContent = d || "Merchandise Purchase";
  let dp = [
    { id: "001" },
    { id: "001", desc: "product 001", qnt: 1, price: 100.0, currency: "USDT" },
  ];
  dp = getCookie("dp") || JSON.stringify(dp);
  let el = document.querySelector("#product-history");
  if (!el) {
    console.log(`Element not found. `);
    return false;
  }
  console.log("dp", dp);
  let dpArray;
  if (!Array.isArray(dp) && typeof dp == "string") {
    dpArray = JSON.parse(dp) || [];
  }
  for (var i = 0; i < dpArray.length; i++) {
    let item = dpArray[i];
    let { price = 0, qnt = 0, desc = "", currency = "USDT" } = item;
    if (desc == "") continue;
    let { amount = 0, decimals = 0 } = getAmountDecimal(price);

    el.innerHTML +=
      ' <div class="col-md-12  d-flex justify-content-between align-items-center p-0">' +
      '<div class="col-md-6 d-flex justify-content-between align-items-center p-0">' +
      " <h3>" +
      qnt +
      '</h3 > <img src="./img/close.png" />' +
      '<div style="font-size: 16px;">' +
      desc +
      "</div>" +
      "</div>" +
      '<div class=" col-md-4 d-flex align-items-center justify-content-end h5 asset-each p-0">' +
      "<h3>" +
      amount +
      '</h3><span class="decimals">' +
      "." +
      decimals +
      '</span><span class="suffix">' +
      currency +
      "</span></span>" +
      "     </div >" +
      "</div>";
  }
}

// function to get a cookie value
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

// function to remove all child of a parent element
async function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

/**
 * Connect wallet button pressed.
 */
async function onConnect() {
  console.log("Opening a dialog", web3Modal);
  try {
    provider = await web3Modal.connect();
  } catch (e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  await refreshAccountData();
}

/**
 * Disconnect wallet pressed.
 */
async function onDisconnect() {
  console.log("Killing the wallet connection", provider);

  if (provider.close) {
    await provider.close();

    // If the cached provider is not cleared,
    // WalletConnect will default to the existing session
    // and does not allow to re-scan the QR code with a new wallet.
    await web3Modal.clearCachedProvider();
    provider = null;
  }

  selectedAccount = null;

  // Set the UI back to the initial state
  // document.querySelector("#prepare").style.display = "block";
  // document.querySelector("#connected").style.display = "none";
}

/**
 * Fetch account data for UI when
 * - User switches accounts in wallet
 * - User switches networks in wallet
 * - User connects wallet initially
 */
async function refreshAccountData() {
  // If any current data is displayed when
  // the user is switching acounts in the wallet
  // immediate hide this data
  // document.querySelector("#connected").style.display = "none";
  // document.querySelector("#prepare").style.display = "block";

  // Disable button while UI is loading.
  // fetchAccountData() will take a while as it communicates
  // with Ethereum node via JSON-RPC and loads chain data
  // over an API call.
  document.querySelector("#btn-crypto").setAttribute("disabled", "disabled");
  await fetchAccountData(provider);
  document.querySelector("#btn-crypto").removeAttribute("disabled");
}
async function fetchAccountData() {
  // Get a Web3 instance for the wallet
  const web3 = new Web3(provider);

  console.log("Web3 instance is", web3);

  // Get connected chain id from Ethereum node
  chainId = await web3.eth.getChainId();
  console.log("chainId: ", chainId);
  // Load chain information over an HTTP API
  let chainName = "";
  try {
    const chainData = evmChains.getChain(chainId);
    chainName = chainData.name;
  } catch (e) {
    if (chainId == 11155111) chainName = "Sepolia Ethereum";
  }
  console.log(chainName);
  // Get list of accounts of the connected wallet
  const accounts = await web3.eth.getAccounts();

  // MetaMask does not give you all accounts, only the selected account
  console.log("Got accounts", accounts);
  selectedAccount = accounts[0];

  //document.querySelector("#selected-account").textContent = selectedAccount;

  // Get a handl
  // const template = document.querySelector("#template-balance");
  // const accountContainer = document.querySelector("#accounts");

  // // Purge UI elements any previously loaded accounts
  // accountContainer.innerHTML = "";
  // removeAllChildNodes(accountContainer);

  // // Go through all accounts and get their ETH balance
  // const rowResolvers = accounts.map(async (address) => {
  //   const balance = await web3.eth.getBalance(address);
  //   // ethBalance is a BigNumber instance
  //   // https://github.com/indutny/bn.js/
  //   const ethBalance = web3.utils.fromWei(balance, "ether");
  //   const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
  //   // Fill in the templated row and put in the document
  //   const clone = template.content.cloneNode(true);
  //   clone.querySelector(".address").textContent = address;
  //   clone.querySelector(".balance").textContent = humanFriendlyBalance;
  //   accountContainer.appendChild(clone);
  // });

  // Because rendering account does its own RPC commucation
  // with Ethereum node, we do not want to display any results
  // until data for all accounts is loaded
  //  await Promise.all(rowResolvers);

  //Display fully loaded UI for wallet data
  document.querySelector("#wallet-address").innerHTML =
    ' <div class="col-md-2 d-flex justify-content-center align-items-center p-0"  > <img  id="net-logo" />    </div>                <div class="col-md-10 d-flex justify-content-start align-items-center p-0">                    <div class="d-flex flex-column">                        <h4>Wallet Connected (' +
    chainName +
    ')</h4>                        <h5 class="subtitle" id="selected-account">' +
    formatAddress(selectedAccount) +
    "</h5>                    </div>        </div>";
  document.querySelector("#wallet-address").style.border = "1px solid black";
  document.querySelector("#merchandise-icon").style.display = "block";
  switch (chainId) {
    case 137:
      document.querySelector("#net-logo").src = "./img/Polygon.png";
      document.querySelector("#merchandise-icon").src = "./img/merchandise.png";
      break;
    case 1:
      document.querySelector("#net-logo").src = "./img/ETH.png";
      document.querySelector("#merchandise-icon").src = "./img/ETH.png";

      break;
    case 80091:
      document.querySelector("#net-logo").src = "./img/BSC.png";
      document.querySelector("#merchandise-icon").src = "./img/BSC.png";

      break;
    case 3:
      document.querySelector("#net-logo").src = "./img/USDT.png";
      document.querySelector("#merchandise-icon").src = "./img/USDT.png";

      break;
    case 5:
      document.querySelector("#net-logo").src = "./img/ETH.png";
      document.querySelector("#merchandise-icon").src = "./img/ETH.png";

      break;
    case 11155111:
      document.querySelector("#net-logo").src = "./img/ETH.png";
      document.querySelector("#merchandise-icon").src = "./img/ETH.png";

      break;
    case 43114:
      document.querySelector("#net-logo").src = "./img/BSC.png";
      document.querySelector("#merchandise-icon").src = "./img/BSC.png";

    default:
      document.querySelector("#net-logo").src = "./img/Polygon.png";
      document.querySelector("#merchandise-icon").src = "./img/merchandise.png";

      break;
  }

  showApproveBtn();
  hideElement("#payment-btn");
  hideElement("#alert");
}
async function makePayment() {
  let tokenAddress = "";
  let p = getCookie("p") || "USDT";
  let r = getCookie("r") || "123456";
  let originaddress = getCookie("o") || "0x07";
  if (chainId == 137 && p == "USDT")
    // Polygon Mainnet
    tokenAddress = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f"; //USDT on Polygon
  if (chainId == 80091 && p == "USDT")
    // Avalanche C-Chain Mainnet
    tokenAddress = "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7"; //USDT on Avalanche
  if (chainId == 1 && p == "USDT")
    //Ethereum Mainnet
    tokenAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7"; //USDT on Ethereum
  if (chainId == 5 && p == "USDT")
    //Ethereum Testnet
    tokenAddress = "0xe583769738b6dd4E7CAF8451050d1948BE717679"; //USDT on Ethereum
  if (chainId == 137 && p == "USDC")
    // Polygon Mainnet
    tokenAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"; //USDC on Polygon
  if (chainId == 43114 && p == "USDC")
    // Avalanche C-Chain Mainnet
    tokenAddress = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"; //USDC on Avalanche
  if (chainId == 1 && p == "USDC")
    //Ethereum Mainnet
    tokenAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb487"; //USDC on Ethereum
  if (chainId == 5 && p == "USDC")
    //Ethereum testnet Goerlli
    tokenAddress = "0x07865c6e87b9f70255377e024ace6630c1eaa37f"; //USDC on Ethereum
  if (chainId == 11155111 && p == "USDT")
    //Ethereum testnet Sepolia
    tokenAddress = "0xef632af93FF9cEDc7c40069861b67c13b31aeb8E"; //USDT on Ethereum Sepolia
  if (tokenAddress == "") {
    console.log("Network not supported for the payment");
    document.querySelector("#msg").innerHTML =
      '<div class="alert alert-danger" role="alert"  >Selected network is not yet supported for payments. Chainid: [' +
      chainId +
      "]</div>";
    hideElement("#progress-load");
    document.querySelector("#msg").style.display = "block";
    document.querySelector("#approve-btn").style.display = "flex";
    return;
  } else {
    //document.querySelector("#msg").innerHTML = "";
  }
  const toAddress = "0x78A4C8624Ba26dD5fEC90a8Dc9B75B4E3D630035"; // Bitgreen Wallet
  const web3 = new Web3(provider);
  let decimals = web3.utils.toBN(6);
  let a = getCookie("a") || 1;
  let amount = web3.utils.toBN(parseFloat(a));
  // console.log("amount ", amount);

  // construct contract call
  let ABI = [
    {
      constant: true,
      inputs: [],
      name: "name",
      outputs: [{ name: "", type: "string" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [{ name: "_upgradedAddress", type: "address" }],
      name: "deprecate",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "_spender", type: "address" },
        { name: "_value", type: "uint256" },
      ],
      name: "approve",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "deprecated",
      outputs: [{ name: "", type: "bool" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [{ name: "_evilUser", type: "address" }],
      name: "addBlackList",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "totalSupply",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "_from", type: "address" },
        { name: "_to", type: "address" },
        { name: "_value", type: "uint256" },
      ],
      name: "transferFrom",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "upgradedAddress",
      outputs: [{ name: "", type: "address" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [{ name: "", type: "address" }],
      name: "balances",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "decimals",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "maximumFee",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "_totalSupply",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [],
      name: "unpause",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [{ name: "_maker", type: "address" }],
      name: "getBlackListStatus",
      outputs: [{ name: "", type: "bool" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [
        { name: "", type: "address" },
        { name: "", type: "address" },
      ],
      name: "allowed",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "paused",
      outputs: [{ name: "", type: "bool" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [{ name: "who", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [],
      name: "pause",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "getOwner",
      outputs: [{ name: "", type: "address" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "owner",
      outputs: [{ name: "", type: "address" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "symbol",
      outputs: [{ name: "", type: "string" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "_to", type: "address" },
        { name: "_value", type: "uint256" },
      ],
      name: "transfer",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "newBasisPoints", type: "uint256" },
        { name: "newMaxFee", type: "uint256" },
      ],
      name: "setParams",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: false,
      inputs: [{ name: "amount", type: "uint256" }],
      name: "issue",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: false,
      inputs: [{ name: "amount", type: "uint256" }],
      name: "redeem",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [
        { name: "_owner", type: "address" },
        { name: "_spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ name: "remaining", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "basisPointsRate",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [{ name: "", type: "address" }],
      name: "isBlackListed",
      outputs: [{ name: "", type: "bool" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [{ name: "_clearedUser", type: "address" }],
      name: "removeBlackList",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "MAX_UINT",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [{ name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: false,
      inputs: [{ name: "_blackListedUser", type: "address" }],
      name: "destroyBlackFunds",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { name: "_initialSupply", type: "uint256" },
        { name: "_name", type: "string" },
        { name: "_symbol", type: "string" },
        { name: "_decimals", type: "uint256" },
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: "amount", type: "uint256" }],
      name: "Issue",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: "amount", type: "uint256" }],
      name: "Redeem",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: "newAddress", type: "address" }],
      name: "Deprecate",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: false, name: "feeBasisPoints", type: "uint256" },
        { indexed: false, name: "maxFee", type: "uint256" },
      ],
      name: "Params",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: false, name: "_blackListedUser", type: "address" },
        { indexed: false, name: "_balance", type: "uint256" },
      ],
      name: "DestroyedBlackFunds",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: "_user", type: "address" }],
      name: "AddedBlackList",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: "_user", type: "address" }],
      name: "RemovedBlackList",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "owner", type: "address" },
        { indexed: true, name: "spender", type: "address" },
        { indexed: false, name: "value", type: "uint256" },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "from", type: "address" },
        { indexed: true, name: "to", type: "address" },
        { indexed: false, name: "value", type: "uint256" },
      ],
      name: "Transfer",
      type: "event",
    },
    { anonymous: false, inputs: [], name: "Pause", type: "event" },
    { anonymous: false, inputs: [], name: "Unpause", type: "event" },
  ];
  let contract = new web3.eth.Contract(ABI, tokenAddress);
  let value = amount.mul(web3.utils.toBN(10).pow(decimals));
  const accounts = await web3.eth.getAccounts();
  let fromAddress = accounts[0];
  console.log("fromAddress: ", fromAddress);
  //update the server about the payment in progress
  let url = "https://pay.bitgreen.org/paymentrequest?token=" + p;
  url = url + "&referenceid=" + r;
  url = url + "&sender=" + fromAddress;
  url = url + "&recipient=" + toAddress;
  url = url + "&originaddress=" + originaddress;
  url = url + "&amount=" + 0.01;
  url = url + "&chainid=" + chainId;
  console.log(url);
  fetch(url);
  // get current gas price
  let gasprice = await web3.eth.getGasPrice();
  console.log("Gasprice: ", gasprice);
  // call transfer function in the contract
  let isRefuse = false;
  contract.methods
    .transfer(toAddress, value)
    .send({ from: fromAddress, gas: 200000, gasPrice: gasprice })
    .on("transactionHash", function (hash) {
      console.log(hash);
      endLoad(formatAddress(fromAddress), formatAddress(toAddress));

      // document.querySelector("#msg").innerHTML =
      //   '<div class="alert alert-success" role="alert" id="msg"> Tx Hash: ' +
      //   hash +
      //   "</div>";
    })
    .catch(function (error) {
      let x = error["message"].indexOf('"message":');
      let e = error["message"].substring(x);
      e = e.replace('"message":', "");
      e = e.replace("}", "");
      isRefuse = true;
      document.querySelector("#msg").innerHTML =
        '<div class="alert alert-danger" role="alert" > Error: ' + e + "</div>";
      hideElement("#progress-load");
      document.querySelector("#approve-btn").style.display = "flex";
      document.querySelector("#msg").style.display = "block";
    });
}

const formatAddress = (address, first = 15, last = 6) => {
  return (
    address?.substring(0, first) +
    "..." +
    address?.substring(address?.length - last)
  );
};
const getAmountDecimal = (amount, decimals = 2) => {
  let amount_info = null;
  if (typeof amount === "string") {
    amount_info = amount.split(".");
  } else {
    amount_info = parseFloat(amount).toFixed(decimals).toString().split(".");
  }

  return {
    amount: amount_info[0] || "0",
    decimals: amount_info[1]?.substring(0, 2) || "00",
  };
};
