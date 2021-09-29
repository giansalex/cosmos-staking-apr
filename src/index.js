const axios = require('axios').default;

async function getParams(lcdApi, denom) {
  let response = await lcdApi.get("/cosmos/mint/v1beta1/annual_provisions");

  const annualProvisions = Number(response.data.annual_provisions); //string
  response = await lcdApi.get("/cosmos/mint/v1beta1/params");
  const blocksPerYear =  Number(response.data.params.blocks_per_year); //string

  response = await lcdApi.get("/cosmos/mint/v1beta1/inflation");
  const inflation = Number(response.data.inflation); //string

  response = await lcdApi.get("/cosmos/staking/v1beta1/pool");
  const bondedTokens = Number(response.data.pool.bonded_tokens); //string

  response = await lcdApi.get("/cosmos/bank/v1beta1/supply");
  const supply = Number(response.data.supply.find(p => p.denom === denom).amount); //string

  response = await lcdApi.get("/cosmos/distribution/v1beta1/params");
  const communityTax = Number(response.data.params.community_tax); //string

  return {
    annualProvisions,
    blocksPerYear,
    inflation,
    bondedTokens,
    supply,
    communityTax
  }
}

function calculateNominalAPR(params) {
  const bondedRatio = params.bondedTokens / params.supply;
  return params.inflation * (1 - params.communityTax) / bondedRatio;
}

async function getBlocksPerYearActual(lcdApi) {
  let response = await lcdApi.get("/blocks/latest");
  const block1 = response.data.block.header;

  response = await lcdApi.get("/blocks/" + (Number(block1.height) - 1));
  const block2 = response.data.block.header;

  const yearMilisec = 31536000000;
  const blockMilisec = new Date(block1.time) - new Date(block2.time);
  return Math.ceil(yearMilisec / blockMilisec);
}

function calculateActualAPR(params, nominalAPR, blocksYearActual) {
  const blockProvision = params.annualProvisions / params.blocksPerYear;
  const actualProvision = blockProvision * blocksYearActual;
  return nominalAPR * (actualProvision / params.annualProvisions);
}

async function start() {
  try {
      const API_URL = "https://lcd.juno.giansalex.dev";
      const lcdApi = axios.create({
        baseURL: API_URL,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json'
        }
      });

      const params = await getParams(lcdApi, "ujuno");
      const blocksYearActual = await getBlocksPerYearActual(lcdApi);
      console.log(blocksYearActual);
      console.log(params);
      const nominalAPR = calculateNominalAPR(params);
      console.log(nominalAPR * 100, "%");
      console.log(calculateActualAPR(params, nominalAPR, blocksYearActual) * 100, "%");
  } catch (error) {
      console.log(error);
      return process.exit(-1);
  }   
}

start();