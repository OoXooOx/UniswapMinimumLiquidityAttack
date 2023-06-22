First of all I delete calculation and mint of Minimum Liquidity LP tokens in pair SC  - 385 and 387 line/
then I fork mainnet through hh by command      
npx hardhat node --fork https://eth-mainnet.g.alchemy.com/v2/ENTER_HERE_YOUR_API_KEY --fork-block-number 17370579

next we need deploy all SC 
npx hardhat run scripts/deploy.js --network localhost
next we start test file 
npx hardhat test --network localhost

You must be aware, that init_code_hash in Router SC (277 line) must be equal to  info from test  ✔ init code hash (it's 9 test)
Ofcourse you need install all dependencies by command 
npm i

From this test we can see that owner address can add 1wei ETH and 2million tokens as liquidity. This will lead to enable add liquidity from other address in proportions different from proportions of added liquidity from owner address. And in the end we can successfully remove all liquidity and get our TST tokens and 1 wei ETH.
