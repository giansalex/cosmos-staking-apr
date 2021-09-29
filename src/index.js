const axios = require('axios').default;

const API_URL = "https://lcd.juno.giansalex.dev";

async function getParams(denom) {
  const lcdApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json'
    }
  });
  let response = await lcdApi.get("/cosmos/mint/v1beta1/annual_provisions");

  const annualProvisions = response.data.annual_provisions; //string
  response = await lcdApi.get("/cosmos/mint/v1beta1/params");
  const blocksPerYear =  response.data.params.blocks_per_year; //string

  response = await lcdApi.get("/cosmos/mint/v1beta1/inflation");
  const inflation = response.data.inflation; //string

  response = await lcdApi.get("/cosmos/staking/v1beta1/pool");
  const bondedTokens = response.data.pool.bonded_tokens; //string

  response = await lcdApi.get("/cosmos/bank/v1beta1/supply");
  const supply = response.data.supply.find(p => p.denom === denom).amount; //string

  response = await lcdApi.get("/cosmos/distribution/v1beta1/params");
  const communityTax = response.data.params.community_tax; //string

  return {
    annualProvisions,
    blocksPerYear,
    inflation,
    bondedTokens,
    supply,
    communityTax
  }
}

async function start() {
  try {
      const params = await getParams("ujuno");
      console.log(params);
  } catch (error) {
      console.log(error);
      return process.exit(-1);
  }   
}

start();