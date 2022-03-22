import React, { useEffect, useState } from "react";
import PairContract from "./contracts/Pair.json";
import Can01Contract from "./contracts/CAN01.json";
import Can02Contract from "./contracts/CAN02.json";
import getWeb3 from "./getWeb3";

import "./App.css";

const App = () => {
  const tokenPrice = 100000000000000000;

  const [web3, setWeb3] = useState(null);
  const [pairContract, setPairContract] = useState(null);
  const [can01Contract, setCan01Contract] = useState(null);
  const [can02Contract, setCan02Contract] = useState(null);
  const [pairData, setPairData] = useState({});
  const [can01Data, setCan01Data] = useState({});
  const [can02Data, setCan02Data] = useState({});
  const [account, setAccount] = useState({});
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [amount, setAmount] = useState(null);
  const [swapAmount, setSwapAmount] = useState(0);
  const [expected, setExpected] = useState(0);
  const [price, setPrice] = useState(0);
  const [fee, setFee] = useState(null);
  const [swapLogs, setSwapLogs] = useState([]);
  const [buyLogs, setBuyLogs] = useState([]);

  const init = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = 1337;
      const pairNetwork = PairContract.networks[networkId];
      const pair = new web3.eth.Contract(
        PairContract.abi,
        pairNetwork && pairNetwork.address,
      );

      setAccount(accounts[0]);
      setWeb3(web3);
      setPairContract(pair);
    } catch (error) {
      alert(`Failed to load web3, accounts, or contract. Check console for details.`);
      console.error(error);
    }
  }

  const fetchData = async () => {
    if (web3 && pairContract) {
      const balance = await pairContract.methods.balanceOf().call({from: account});
      const _fee = await pairContract.methods.fee().call();
      const can01Address = await pairContract.methods.can01().call();
      const can02Address = await pairContract.methods.can02().call();
      const logCnts = await pairContract.methods.getLogCount().call();
      const buyLog = await pairContract.methods.getBuyLog(logCnts.buys).call();
      const swapLog = await pairContract.methods.getSwapLog(logCnts.swaps).call();

      pairData.buys != logCnts.buys > 0 && buyLogs.push(buyLog);
      pairData.swaps != logCnts.swaps > 0 && swapLogs.push(swapLog);

      const can01 = new web3.eth.Contract(
        Can01Contract.abi,
        can01Address,
      );
      const can02 = new web3.eth.Contract(
        Can02Contract.abi,
        can02Address,
      );
      const balanceEth = await web3.eth.getBalance(account);
      const balanceCan01 = await can01.methods.balanceOf(account).call({from: account});
      const balanceCan02 = await can02.methods.balanceOf(account).call({from: account});
 
      setCan01Contract(can01);
      setCan02Contract(can02);
      setPairData({
        name: await pairContract.methods.name().call(),
        balances: [balance._can01, balance._can02],
        buys: logCnts.buys,
        swaps: logCnts.swaps
      });
      setCan01Data({
        address: can01Address,
        rate: await can01.methods.rate().call()
      });
      setCan02Data({
        address: can02Address,
        rate: await can02.methods.rate().call()
      });
      setBalances({
        eth: balanceEth / tokenPrice / 10,
        can01: balanceCan01 / tokenPrice,
        can02: balanceCan02 / tokenPrice
      });
      setBuyLogs(buyLogs);
      setSwapLogs(swapLogs);
      setFee(_fee / 100 + '%');
      setToken(can01Address);
      setLoading(false);
    }
  }

  const calcPrice = () => {
    setPrice(amount / (token === can01Data.address ? can01Data.rate : can02Data.rate));
    calcExpected();
  }

  const calcExpected = () => {
    swapAmount && setExpected(
      swapAmount * (
        token === can01Data.address
          ? can02Data.rate / can01Data.rate
          : can01Data.rate / can02Data.rate
      )
    );
  }

  useEffect(init, []);
  useEffect(fetchData, [web3, pairContract]);
  useEffect(calcPrice, [amount]);
  useEffect(calcPrice, [token]);
  useEffect(calcExpected, [swapAmount]);

  const buyToken = () => {
    return pairContract.methods
      .buy(token, amount)
      .send({from: account, value: price * tokenPrice * 10 })
      .then(fetchData);
  }

  const swapToken = () => {
    const token1 = token;
    const token2 = 
      token === can01Data.address
      ? can02Data.address
      : can01Data.address;

    return pairContract.methods
      .swap(token1, token2, swapAmount )
      .send({from: account})
      .then(fetchData);
  }

  return (
    loading ?
      <div>Loading...</div> :
      <div className="container">
        <div className="info">
          <div className="pair">
            <h3>Pair</h3>
            <p>Name: {pairData.name}</p>
            <p>Balance:
              CAN01 - {pairData.balances[0] / tokenPrice}, 
              CAN02 - {pairData.balances[1] / tokenPrice}
            </p>
            <p>
              Price: 1 can01 = {1 / can01Data.rate} ether, 1 can02 = {1 / can02Data.rate} ether
            </p>
            <input value={fee} disabled />
            <select onChange={e => setToken(e.target.value)}>
              <option value={can01Data.address}>CAN01 - {can01Data.address}</option>
              <option value={can02Data.address}>CAN02 - {can02Data.address}</option>
            </select>
            <div className="buy">
              <input onChange={e => setAmount(e.target.value)} />
              <input value={`${price} ethers`} disabled />
              <button onClick={buyToken}>BUY</button>
            </div>
            <div className="swap">
              <input onChange={e => setSwapAmount(e.target.value)} />
              <input value={expected} disabled />
              <button onClick={swapToken}>SWAP</button>
            </div>
          </div>
          <div className="account">
            <h3>Your Account</h3>
            <p>address: {account}</p>
            <p>balance: ETH - {balances.eth}, CAN01 - {balances.can01}, CAN02 - {balances.can02}</p>
          </div>
        </div>
        <h3>Logs</h3>
        <div className="logs">
          <ul className="buy-logs">
            <h4>Buy(user/token/amount)</h4>
            {buyLogs.map((b, ind) => <li key={ind}>{b.user} / {b.token} / {b.amount}</li>)}
          </ul>
          <ul className="swap-logs">
            <h4>Swaps (user/token1/amount1/token2/amount2)</h4>
            {swapLogs.map((s, ind) => <li key={ind}>{s.user} / {s.token1} / {s.amount1} / {s.token2} / {s.amount2}</li>)}
          </ul>
        </div>
      </div>
  );
}

export default App;
