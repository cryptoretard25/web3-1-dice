const ethers = require("ethers");
const { provider, wallet } = require("./connect");
const tokenBuild = require("../../build/contracts/ERC20Token.json");

const tokenAbi = tokenBuild.abi;
const tokenAddress = Object.values(tokenBuild.networks).pop().address;
const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);

async function name() {
  try {
    return await tokenContract.name();
  } catch (error) {
    console.error(error);
  }
}

async function symbol() {
  try {
    return await tokenContract.symbol();
  } catch (error) {
    console.error(error);
  }
}

async function decimals() {
  try {
    return await tokenContract.decimals();
  } catch (error) {
    console.error(error);
  }
}

async function totalSupply() {
  try {
    return ethers.formatUnits(
      await tokenContract.totalSupply(),
      await decimals()
    );
  } catch (error) {
    console.error(error);
  }
}

async function balanceOf(_address) {
  try {
    const balance = await tokenContract.balanceOf(_address);
    return ethers.formatUnits(balance, await decimals());
  } catch (error) {
    console.error(error);
  }
}

async function allowance(_owner, _spender) {
  try {
    const allowance = await tokenContract.allowance(_owner, _spender);
    return ethers.formatUnits(allowance, await decimals());
  } catch (error) {
    console.error(error);
  }
}

async function approve(_spender) {
  const signedContract = tokenContract.connect(await wallet);
  try {
    const maxUint256 = ethers.MaxUint256;
    const tx = await signedContract.approve(_spender, maxUint256);
    const res = await tx.wait();
    return `Approved. ${res.hash}`;
  } catch (error) {
    console.error(error);
  }
}

async function transfer(_to, _amount) {
  const signedContract = tokenContract.connect(await wallet);
  try {
    const amount = ethers.parseUnits(_amount.toString(), 9);

    const tx = await signedContract.transfer(_to, amount);
    const res = await tx.wait();
    return `Success. ${res.hash}`;
  } catch (error) {
    console.error(error.info.error.message);
  }
}

async function transferFrom(_from, _to, _amount) {
  const signedContract = tokenContract.connect(await wallet);
  try {
    const amount = ethers.parseUnits(_amount.toString(), 9);

    const tx = await signedContract.transferFrom(_from, _to, amount);
    const res = await tx.wait();
    return `Success. ${res.hash}`;
  } catch (error) {
    console.error(error);
  }
}

async function listGanacheAccounts() {
  console.log(await provider.listAccounts());
}

module.exports = {
  name,
  symbol,
  decimals,
  totalSupply,
  balanceOf,
  allowance,
  approve,
  transfer,
  transferFrom,
};

// listGanacheAccounts()

// name().then((r) => console.log('Name: ', r));

// symbol().then((r) => console.log("Symbol: ", r));

// decimals().then((r) => console.log("Decimals: ", r));

// totalSupply().then((r) => console.log("Total supply: ", r));

// balanceOf("0xcaddb334005bf15b6386f281236af6c6b08754ae")
//   .then((r) =>
//     console.log("Balance 0 0xcaddb334005bf15b6386f281236af6c6b08754ae: ", r)
//   )
//   .then(() => balanceOf("0x3576a979fD20A2147Ff42c0D4a588e00377B257C"))
//   .then((r) =>
//     console.log("Balance 1 0x3576a979fD20A2147Ff42c0D4a588e00377B257C: ", r)
//   )
//   .then(() => balanceOf("0x8c287adCD3B6873F833D514A3EF49762A51437E3"))
//   .then((r) =>
//     console.log("Balance 2 0x8c287adCD3B6873F833D514A3EF49762A51437E3: ", r)
//   );

// allowance(
//   "0x3576a979fd20a2147ff42c0d4a588e00377b257c",
//   "0x6fcFaD635134c8D8d6e19234aCE420b6dD6CA72e"
// ).then((r) => console.log(r));

// approve("0x6fcFaD635134c8D8d6e19234aCE420b6dD6CA72e").then((r) =>
//   console.log(r)
// );

// transfer("0x0B42C973d645DCe9a74899eF372eFC47dA8d8FCD", 250000000)
//   .then((res) => console.log(res))

// transferFrom(
//   "0xcaddb334005bf15b6386f281236af6c6b08754ae",
//   "0x3576a979fd20a2147ff42c0d4a588e00377b257c",
//   60000
// )
//   .then((res) => console.log(res))
//   .then(() => balanceOf("0x3576a979fd20a2147ff42c0d4a588e00377b257c"))
//   .then((res) => console.log("0x3576a979fd20a2147ff42c0d4a588e00377b257c:", res));
