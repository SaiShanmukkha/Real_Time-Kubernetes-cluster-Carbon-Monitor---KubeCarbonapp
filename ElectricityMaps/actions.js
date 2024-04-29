const { EMAPS_TOKEN } = require("../constants");


async function fetchCarbonIntensity(zone) {
    const authToken = EMAPS_TOKEN; 
    const url = `https://api.electricitymap.org/v3/carbon-intensity/latest?zone=${zone}`;
  
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'auth-token': authToken
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }
  
module.exports.fetchCarbonIntensity = fetchCarbonIntensity;
  