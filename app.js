// app.js

// THE CORRECTED BASE_URL FOR FAWAZ AHMED'S CURRENCY API
const BASE_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";

const dropdowns = document.querySelectorAll(".dropdown select");
const btn = document.querySelector("form button");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msg = document.querySelector(".msg");
const swapIcon = document.querySelector(".fa-arrow-right-arrow-left"); // Select the swap icon

// Populate dropdowns and set default selected options
for (let select of dropdowns) {
  for (let currCode in countryList) { // Use let for currCode
    let newOption = document.createElement("option");
    newOption.innerText = currCode;
    newOption.value = currCode;
    if (select.name === "from" && currCode === "USD") {
      newOption.selected = "selected";
    } else if (select.name === "to" && currCode === "INR") {
      newOption.selected = "selected";
    }
    select.append(newOption);
  }

  // Add event listener for dropdown change to update flag
  select.addEventListener("change", (evt) => {
    updateFlag(evt.target);
    updateExchangeRate(); // Trigger exchange rate update on currency change
  });
}

// Function to update flag image based on selected currency
const updateFlag = (element) => {
  let currCode = element.value;
  let countryCode = countryList[currCode];
  
  if (!countryCode) {
    // Fallback for codes that might not have a direct flag
    countryCode = currCode.substring(0, 2); // Use first two letters as a fallback
    console.warn(`No direct country code found for ${currCode} in countryList. Using fallback: ${countryCode}`);
  }

  let newSrc = `https://flagsapi.com/${countryCode}/flat/64.png`;
  let img = element.parentElement.querySelector("img");
  img.src = newSrc;
  
  // Handle image loading errors (e.g., flag not found for a given countryCode)
  img.onerror = () => {
    img.src = "https://via.placeholder.com/64x64?text=?&bg=lightgray&fg=gray"; // Generic placeholder image
    console.warn(`Flag not found for ${currCode} (country code: ${countryCode}). Displaying placeholder.`);
  };
};

// Function to fetch and update exchange rate
const updateExchangeRate = async () => {
  let amountInput = document.querySelector(".amount input");
  let amtVal = parseFloat(amountInput.value); 

  if (isNaN(amtVal) || amtVal < 1) {
    amtVal = 0;
    amountInput.value = "0";
  }

  msg.innerText = "Getting exchange rate..."; // Show loading message

  try {
    // Construct the URL to fetch data for the 'from' currency
    const URL = `${BASE_URL}/${fromCurr.value.toLowerCase()}.json`; 
    
    console.log("Fetching from URL:", URL); // Log the URL being fetched

    let response = await fetch(URL);

    if (!response.ok) {
      // Check for HTTP errors (e.g., 404, 500)
      const errorText = await response.text(); // Get response body for more info
      console.error("HTTP Error Response:", response.status, errorText);
      throw new Error(`HTTP error! Status: ${response.status}. Could not fetch data for ${fromCurr.value}.`);
    }

    let data = await response.json();
    console.log("API Response Data:", data); // Log the full API response

    // The rate you're looking for is nested under the base currency's property
    // Example: data = { "date": "...", "usd": { "inr": 83.5, ... } }
    let baseCurrencyKey = fromCurr.value.toLowerCase();
    let targetCurrencyKey = toCurr.value.toLowerCase();

    let baseCurrencyData = data[baseCurrencyKey];
    if (!baseCurrencyData) {
        throw new Error(`Data for base currency '${fromCurr.value}' not found in API response structure.`);
    }

    let rate = baseCurrencyData[targetCurrencyKey];

    if (rate === undefined) {
      throw new Error(`Exchange rate for '${toCurr.value}' not found within '${fromCurr.value}' data. Check currency codes.`);
    }

    let finalAmount = (amtVal * rate).toFixed(2); // Format to 2 decimal places
    msg.innerText = `${amtVal} ${fromCurr.value} = ${finalAmount} ${toCurr.value}`;
    console.log(`Conversion successful: ${amtVal} ${fromCurr.value} = ${finalAmount} ${toCurr.value} (Rate: ${rate})`);

  } catch (error) {
    console.error("Error fetching exchange rate:", error); // Log the full error
    msg.innerText = `Error: ${error.message || "Failed to get exchange rate. Please try again."}`;
  }
};

// Event listener for the "Get Exchange Rate" button
btn.addEventListener("click", (evt) => {
  evt.preventDefault(); // Prevent default form submission (page reload)
  updateExchangeRate();
});

// Event listener for amount input (updates rate on change)
document.querySelector(".amount input").addEventListener("input", () => {
  updateExchangeRate();
});

// Event listener for the swap icon
swapIcon.addEventListener("click", () => {
  let tempFromValue = fromCurr.value;
  let tempToValue = toCurr.value;

  fromCurr.value = tempToValue;
  toCurr.value = tempFromValue;

  // Update flags for both dropdowns after swapping
  updateFlag(fromCurr);
  updateFlag(toCurr);

  updateExchangeRate(); // Get the new exchange rate after swapping
});

// Initial call to update exchange rate when the window loads
window.addEventListener("load", () => {
  updateFlag(fromCurr); // Ensure initial flags are set
  updateFlag(toCurr);   // Ensure initial flags are set
  updateExchangeRate();
});