#!/usr/bin/env node

/**
 * Contract Address Setup Script
 * 
 * This script helps you quickly update contract addresses in the UI
 * after deploying the smart contracts.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const contractsFile = path.join(__dirname, '../src/config/contracts.js');

const contractNames = [
  'GAME_REGISTRY',
  'YIELD_TOKEN', // Note: This is now the RDY token
  'ITEMS_1155',
  'PLAYER_STORE',
  'RNG_HUB',
  'BANKER',
  'FARMING',
  'VENDOR',
  'SAGE',
  'DEX'
];

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function validateAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function updateContractAddresses() {
  console.log('🚀 Abstract Valley Contract Address Setup');
  console.log('==========================================\n');
  
  console.log('This script will help you update the contract addresses in the UI.');
  console.log('Please enter the deployed contract addresses:\n');

  const addresses = {};

  for (const contractName of contractNames) {
    let address;
    let isValid = false;

    while (!isValid) {
      address = await askQuestion(`${contractName}: `);
      
      if (address === '') {
        console.log('⚠️  Skipping this contract (empty input)');
        addresses[contractName] = '0x0000000000000000000000000000000000000000';
        isValid = true;
      } else if (validateAddress(address)) {
        addresses[contractName] = address;
        isValid = true;
      } else {
        console.log('❌ Invalid address format. Please enter a valid Ethereum address (0x...)');
      }
    }
  }

  // Read the current contracts.js file
  let contractsContent = fs.readFileSync(contractsFile, 'utf8');

  // Update the addresses
  for (const [contractName, address] of Object.entries(addresses)) {
    const regex = new RegExp(`(${contractName}:\\s*")[^"]*(")`, 'g');
    contractsContent = contractsContent.replace(regex, `$1${address}$2`);
  }

  // Write the updated file
  fs.writeFileSync(contractsFile, contractsContent);

  console.log('\n✅ Contract addresses updated successfully!');
  console.log('\nUpdated addresses:');
  for (const [contractName, address] of Object.entries(addresses)) {
    console.log(`  ${contractName}: ${address}`);
  }

  console.log('\n🎉 Setup complete! You can now start the UI with: npm start');
}

async function main() {
  try {
    await updateContractAddresses();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

