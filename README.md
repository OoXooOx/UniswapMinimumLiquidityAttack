First of all I deleted calculation and mint of Minimum Liquidity LP tokens in pair SC - 385 and 387 line/ then I forked mainnet through hh by command
npx hardhat node --fork https://eth-mainnet.g.alchemy.com/v2/ENTER_HERE_YOUR_API_KEY --fork-block-number 17370579

next we need deploy all SC npx hardhat run scripts/deploy.js --network localhost

next we start test file npx hardhat test --network localhost

You must be aware, that init_code_hash in Router SC (277 line) must be equal to info from test ✔ init code hash (it's 9 test)

Ofcourse you need install all dependencies by command npm i

From this test we can see that owner address can add 1wei ETH and 2million tokens as liquidity. This will lead to unenable add liquidity from other address in proportions different from proportions of added liquidity from owner address. And in the end we can successfully remove all liquidity and get our TST tokens and 1 wei ETH.








https://ethereum.stackexchange.com/questions/132491/why-minimum-liquidity-is-used-in-dex-like-uniswap

0x1. Problem

When users decide to become a liquidity provider, they should deposit paired tokens in proportion to the exchange rate, that is:

enter image description here

Imagining an attacker who holds large sums of money wants to prevent anyone else from providing liquidity into ETH / USDT pool by depositing a small amount of ETH and a large amount of USDT, or vice versa, this changes the exchange rate to, let's say:

enter image description here

What does it mean? Well, it means whenever you depoist 1 wei in ETH, you should also deposit the equivalent of 2 million USDT into the liquidity pool.

Now the attacker is rewarded with LP tokens as a pool share, he could redeem the funds by burning the corresponding LP tokens:

enter image description here

How much is a LP token worth? If we denominate it in USDT, that is:

enter image description here

Suppose that there is only 1 LP token minted in the pool, then the unit price is:

enter image description here

In other words, attackers can raise the price of LP token by increasing the amount of deposited token x or y. This is what the situation mentioned in the whitepaper:

    However, it is possible for the value of a liquidity pool share to grow over time, either by accumulating trading fees or through “donations” to the liquidity pool. In theory, this could result in a situation where the value of the minimum quantity of liquidity pool shares (1e-18 pool shares) is worth so much that it becomes infeasible for small liquidity providers to provide any liquidity.

In general, we can look at this problem from different perspectives:

    If you want to depoist 1 wei in ETH, you must also deposit 2 millions USDT.
    If you expect to acquire 1 pool share, you must deposit 2 millions USDT.

0x2. Solution

Attackers couldn't deposit arbitrary amount of token x or y by simply calling the addLiquidity function due to the restriction of the price ratio formula. Instead, attackers can accomplish the attack through following approaches:

    Initialize a new liquidity pool: anyone who creates a new liquidity pool can determine the initial ratio of the token pair by design.

    Directly transfer token into an existing UniswapV2Pair contract: that is, this is so called "donation" since you won't be getting any pool share.

In order to spare no effort to increase the price of the LP tokens, the attacker combines both approaches to manipulate the price:

    Attacker deposits 10,000 wei ETH and 10,000 wei NextGenUSDT by creating a new liquidity pool, the pool also minted 10,000 LP token as a pool share:

enter image description here

    Attacker then signed a transaction to transfer 2 millions NextGenUSDT into the contract, which is the liquidity pool.

    With 10,000 wei ETH and 2 millions NextGenUSDT (we ignore the first 10,000 wei which deposited at the initial stage) within the pool, now a single LP token is worth 200 dollars:

enter image description here

    The attacker can still withdraw all tokens including that of transfered directly into the pool, since he held 100% of shares.

To mitigate this situation, Uniswap V2 reduces a small proportion of LP tokens, which is defined as MINIMUM_LIQUIDITY = 1000, from the first user who initialized the liquidity pool.

As one LP token equals to 200 dollars, the attacker will totally loss of:

enter image description here

If the attacker transfers more tokens into the pool, causing the price of a LP token hikes up to 300 dollars, the attacker now losses of $300,000 dollars.

Getting back to the whitepaper, this is the consequence that author has described:

    To mitigate this, Uniswap v2 burns the first 1e-15 (0.000000000000001) pool shares that are minted (1000 times the minimum quantity of pool shares), sending them to the zero address instead of to the minter. This should be a negligible cost for almost any token pair. But it dramatically increases the cost of the above attack. In order to raise the value of a liquidity pool share to $100, the attacker would need to donate $100,000 to the pool, which would be permanently locked up as liquidity.

0x3. Answers

    What is the MINIMUM_LIQUIDITY value used for?

    It is used for mitigate the situation where someone tries to make a large discrepancy in quantities between a trading pair.

    Why did they chose this numerical value?

    Because every pool's founding father sustains losses, this should be a affordable price for a normal user.

    Why should it be burned?

    The number of MINIMUM_LIQUIDITY minted to the zero address will never be burnt even though the liquidity provider withdrew all funds.

0x4. Conclusion

In my opinion, this scenario is unlikely to happen because it gives an opportunity to arbitrageurs that take advance of the price differences between various marketplaces. I hope this long story will help.

