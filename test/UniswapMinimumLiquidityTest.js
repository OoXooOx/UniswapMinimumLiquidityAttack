const { expect } = require("chai");
const { ethers } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { log } = require("mathjs");
const fs = require('fs');


// WETH mainnet 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
// FACTORY 0x97fd63D049089cd70D9D139ccf9338c81372DE68
// Router 0xC0BF43A4Ca27e0976195E6661b099742f10507e5

describe("forktest", function () {
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const FACTORY = "0x97fd63D049089cd70D9D139ccf9338c81372DE68";
    const ROUTER = "0xC0BF43A4Ca27e0976195E6661b099742f10507e5";
    const TSTtoken = "0x43cA9bAe8dF108684E5EAaA720C25e1b32B0A075";
    let owner
    let second
    let third
    let CONTRACT_FACTORY
    let CONTRACT_ROUTER
    let CONTRACT_WETH
    let CONTRACT_TST

    function timeConverter(UNIX_timestamp) {
        var a = new Date(UNIX_timestamp * 1000);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var year = a.getFullYear();
        var month = months[a.getMonth()];
        var date = a.getDate();
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
        return time;
    }

    async function getTimestamp(bn) {
        return (
            await ethers.provider.getBlock(bn)
        ).timestamp
    }

    beforeEach(async function () {
        [owner, second, third] = await ethers.getSigners()
        const FACTORY_CONTRACT = await ethers.getContractFactory("UniswapFactory");
        CONTRACT_FACTORY = FACTORY_CONTRACT.attach(FACTORY);
        const ROUTER_CONTRACT = await ethers.getContractFactory("UniswapRouter02");
        CONTRACT_ROUTER = ROUTER_CONTRACT.attach(ROUTER);
        const WETH_CONTRACT = await ethers.getContractFactory("WETH9");
        CONTRACT_WETH = WETH_CONTRACT.attach(WETH);
        const TST_CONTRACT = await ethers.getContractFactory("TestSwapToken");
        CONTRACT_TST = TST_CONTRACT.attach(TSTtoken);
    })

    it("should be right feeTo and feeToSetter address", async function () {
        const result = await CONTRACT_FACTORY.feeTo();
        console.log(result);
        expect(result).to.eq(ethers.constants.AddressZero)
        const result1 = await CONTRACT_FACTORY.feeToSetter();
        console.log(result1);
        // console.log(owner);
        expect(result1).to.eq(owner.address)
    })

    it("should be right factory address in Router SC", async function () {
        const factory = await CONTRACT_ROUTER.factory();
        expect(factory).to.eq(FACTORY)
        // console.log(ROUTER_CONTRACT);
    })

    it("just add and check balance of owner acc and second", async function () {
        const tx = await CONTRACT_WETH.connect(owner).deposit({ value: ethers.utils.parseEther("20") });
        await tx.wait();
        const tz = await CONTRACT_WETH.connect(second).deposit({ value: ethers.utils.parseEther("20") });
        await tz.wait();
        const balance1 = await CONTRACT_WETH.connect(owner).balanceOf(owner.address)
        const balanceInWEther = ethers.utils.formatEther(balance1);
        console.log("Account Balance:", balanceInWEther, "WETH");

        const balance = await ethers.provider.getBalance(owner.address);
        const balanceInEther = ethers.utils.formatEther(balance);
        console.log("Account Balance:", balanceInEther, "ETH");

    })
    it("we need time in blockchain", async function () {
        const tx = await ethers.provider.getBalance(owner.address);
        const tp = await getTimestamp(tx.blockNumber)
        console.log(timeConverter(tp)); // 30 May 2023 12:8:25
        //1685437403 
    })

    it("get bytecode from WETH SC)", async function () {
        const bytecode = await ethers.provider.getCode(WETH);
        // console.log("Bytecode:", bytecode);
    })

    it("mint TST tokens and give approve to Router SC)", async function () {
        const tx = await CONTRACT_TST.connect(owner).mint(owner.address, ethers.utils.parseEther("20000000"));
        await tx.wait();
        const tc = await CONTRACT_TST.connect(owner).mint(second.address, ethers.utils.parseEther("20000000"));
        await tc.wait();
        // expect (await CONTRACT_TST.connect(owner).balanceOf(owner.address))
        // .to.eq(ethers.utils.parseEther("2000"));
        const tr = await CONTRACT_TST.connect(owner).approve(ROUTER, ethers.utils.parseEther("20000000"));
        await tr.wait();
        const te = await CONTRACT_TST.connect(second).approve(ROUTER, ethers.utils.parseEther("20000000"));
        await te.wait();
        // expect (await CONTRACT_TST.connect(owner).allowance(owner.address, ROUTER))
        // .to.eq(ethers.utils.parseEther("2000"));
    })

    it("I want create SC pair via factory)", async function () {
        const result = await CONTRACT_FACTORY.createPair(WETH, TSTtoken);
        await result.wait();

        const addressPair = await CONTRACT_FACTORY.getPair(WETH, TSTtoken)
        console.log(addressPair); // 0xD7b1513264808f196c84343984798e44ffd493F1
    })

    it("we creating swapFee receiver via Router)", async function () {
        const tx = await CONTRACT_ROUTER.connect(owner).setSwapFeeReward(third.address)
        await tx.wait();
        expect (await CONTRACT_ROUTER.swapFeeReward()).to.eq(third.address)
    })

    it("init code hash)", async function () {
        const result = await CONTRACT_FACTORY.INIT_CODE_HASH();
        //0x66cffb04c862503b4aac507a08c8073ab34698cc1495aabe77f9a07cef790a43
        console.log(result); 

    })

    it("get bytecode pair SC)", async function () {
        const result = await CONTRACT_FACTORY.getBytecode();
        // console.log(result); //
        fs.writeFile('bytecode.json', result, (err) => {
            if (err) throw err;
          })
    })

    it("add liquidity (1 wei WETH and 2 000 000 of TST token)", async function () {

        await CONTRACT_ROUTER.connect(owner).addLiquidityETH(
            TSTtoken,                                            //Token Address
            ethers.utils.parseEther("2000000"),                  // amountTokenDesired /amountTokenADesired
            ethers.utils.parseEther("2000000"),                  // amountTokenMin / amountTokenAMin
            1,                                                   // amountETHMin / amountTokenBMin
            owner.address,                                       // address receiver of LP tokens
            1691089536,                                          // deadline
            {value:1})                                          // ETH amount / amountTokenBDesired
    })



    it("just check balance of LP tokens", async function () {
        const addressPair = await CONTRACT_FACTORY.getPair(WETH, TSTtoken)
        const PAIR_CONTRACT = await ethers.getContractFactory("UniswapPair");
        const CONTRACT_PAIR = PAIR_CONTRACT.attach(addressPair);
        const balance = await CONTRACT_PAIR.connect(owner).balanceOf(owner.address)
        console.log("owner balance in LP tokens=>",balance);
        reserves = await CONTRACT_PAIR.connect(owner).getReserves();
        console.log("Reserves:", reserves);
        const totalSupply=await CONTRACT_PAIR.connect(owner).totalSupply()
        console.log("totalSupply LP tokens=>",totalSupply);
    })




    it("add liquidity from second  ", async function () {


        await expect(CONTRACT_ROUTER.connect(second).addLiquidityETH(
            TSTtoken,                                            //Token Address
            ethers.utils.parseEther("10"),                        // amountTokenDesired /amountTokenADesired
            ethers.utils.parseEther("10"),                  // amountTokenMin / amountTokenAMin
            ethers.utils.parseEther("5"),                                                    // amountETHMin / amountTokenBMin
            second.address,                                       // address receiver of LP tokens
            1691089536,                                          // deadline
            { value: ethers.utils.parseEther("5") })).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_B_AMOUNT")                                        // ETH amount / amountTokenBDesired
    })

    it("add liquidity from second in same proportion ", async function () {

        const tx = await CONTRACT_ROUTER.connect(second).callStatic.addLiquidityETH(
            TSTtoken,                                            //Token Address
            ethers.utils.parseEther("2000000"),                  // amountTokenDesired /amountTokenADesired
            ethers.utils.parseEther("2000000"),                  // amountTokenMin / amountTokenAMin
            1,                                                   // amountETHMin / amountTokenBMin
            owner.address,                                       // address receiver of LP tokens
            1691089536,                                          // deadline
            {value:1})                                          // ETH amount / amountTokenBDesired
        expect(tx).to.not.throw;
    })

    it("owner can remove successfully liquidity  ", async function () {
        const addressPair = await CONTRACT_FACTORY.getPair(WETH, TSTtoken)
        const PAIR_CONTRACT = await ethers.getContractFactory("UniswapPair");
        const CONTRACT_PAIR = PAIR_CONTRACT.attach(addressPair);
       
       
       
        const beforeETH = await ethers.provider.getBalance(owner.address);
        const beforeWETH = await CONTRACT_WETH.connect(owner).balanceOf(owner.address);
        const beforeTST = await CONTRACT_TST.connect(owner).balanceOf(owner.address);
        const balanceLP = await CONTRACT_PAIR.connect(owner).balanceOf(owner.address)
        const balanceLP3 = await CONTRACT_PAIR.connect(owner).balanceOf(third.address)
        const beforeWETH_PAIR = await CONTRACT_WETH.connect(owner).balanceOf(addressPair);
        const beforeTST_PAIR = await CONTRACT_TST.connect(owner).balanceOf(addressPair);
        const totalSupply=await CONTRACT_PAIR.connect(owner).totalSupply()
        
       
        console.log("owner balance in LP tokens=>",balanceLP);
        console.log("third balance in LP tokens=>",balanceLP3);
        console.log('Before ETH Balance:', ethers.utils.formatEther(beforeETH));
        console.log('Before WETH Balance:', ethers.utils.formatEther(beforeWETH));
        console.log('Before TST Balance:', ethers.utils.formatEther(beforeTST));
        console.log('Before TST Balance: PAIR', ethers.utils.formatEther(beforeTST_PAIR));
        console.log('Before WETH Balance: PAIR', ethers.utils.formatEther(beforeWETH_PAIR));
        console.log("totalSupply LP tokens=>",totalSupply);
       

        
        const tr = await CONTRACT_PAIR.connect(owner).approve(CONTRACT_ROUTER.address, ethers.constants.MaxUint256)
        await tr.wait()

        const allowance = await CONTRACT_PAIR.connect(owner).allowance(owner.address, CONTRACT_ROUTER.address);
        console.log('Allowance:', allowance.toString());


        const tx = await CONTRACT_ROUTER.connect(owner).removeLiquidityETH(
            TSTtoken,
            totalSupply,
            ethers.utils.parseEther("2000000"),
            1,
            owner.address,
            1691089536
        );
        await tx.wait();

        const afterETH = await ethers.provider.getBalance(owner.address);
        const afterWETH = await CONTRACT_WETH.connect(owner).balanceOf(owner.address);
        const afterTST = await CONTRACT_TST.connect(owner).balanceOf(owner.address);
        const afterLP = await CONTRACT_PAIR.connect(owner).balanceOf(owner.address)
        console.log("After owner balance in LP tokens=>",afterLP);
        console.log('After ETH Balance:', ethers.utils.formatEther(afterETH));
        console.log('After WETH Balance:', ethers.utils.formatEther(afterWETH));
        console.log('After TST Balance:', ethers.utils.formatEther(afterTST));

    })



    // it("just check balance of LP tokens", async function () {
    //     const addressPair = await CONTRACT_FACTORY.getPair(WETH, TSTtoken)
    //     const PAIR_CONTRACT = await ethers.getContractFactory("UniswapPair");
    //     const CONTRACT_PAIR = PAIR_CONTRACT.attach(addressPair);
    //     const balance = await CONTRACT_PAIR.connect(owner).balanceOf(owner.address)
    //     const totalSupply=await CONTRACT_PAIR.connect(owner).totalSupply()
    //     console.log("owner balance in LP tokens=>",balance);
    //     console.log("totalSupply LP tokens=>",totalSupply);
    // })































    // it("add liquidity from other EOA  (0.5 WETH and 0.5 of TST token)", async function () {
    //     await CONTRACT_ROUTER.connect(second).addLiquidityETH(
    //         TSTtoken,
    //         ethers.utils.parseEther("0.5"),            // amountTokenDesired /amountTokenADesired
    //         ethers.utils.parseEther("0.5"),            // amountTokenMin / amountTokenAMin
    //         ethers.utils.parseEther("0.5"),           // amountETHMin / amountTokenBMin
    //         second.address,                          // to
    //         1691089536,                             // deadline
    //         {value: ethers.utils.parseEther("0.5")})    //  / amountTokenBDesired 
    //     // console.log(factory);
    //     const addressPair = await CONTRACT_FACTORY.getPair(WETH, TSTtoken)

    //     const PAIR_CONTRACT = await ethers.getContractFactory("UniswapPair");
    //     const CONTRACT_PAIR = PAIR_CONTRACT.attach(addressPair);
    //     const balance = await CONTRACT_PAIR.connect(owner).balanceOf(second.address)
    //     const balance1 = await CONTRACT_PAIR.connect(owner).balanceOf(owner.address)
    //     console.log("Balance of second in LP tokens:", balance );
    //     console.log("Balance of owner in LP tokens:", balance1 );
    //     // 'UniswapV2Router: INSUFFICIENT_B_AMOUNT
    // })




    //  it("we try add more liqudity directly without interact with router and sync it", async function () {
    //     //just fetch PAIR address
    //     const addressPair = await CONTRACT_FACTORY.getPair(WETH, TSTtoken)
    //     //build transaction and send 1 WETH to PAIR SC
    //     const before =  await ethers.provider.getBalance(addressPair);
    //     const PAIR_CONTRACT = await ethers.getContractFactory("UniswapPair");
    //     const CONTRACT_PAIR = PAIR_CONTRACT.attach(addressPair);
    //     const balance = await CONTRACT_PAIR.connect(owner).balanceOf(owner.address)
    //     console.log("owner balance before sync in LP tokens=>",balance);
    //     console.log("TOKEN0=>", await CONTRACT_PAIR.token0(),"TOKEN1=>",  await CONTRACT_PAIR.token1(),);
    //     const reservesBefore = await CONTRACT_PAIR.connect(owner).getReserves();

    //     const sendWETH = await CONTRACT_WETH.connect(owner).transfer(addressPair, ethers.utils.parseEther("1"));
    //     await sendWETH.wait();

    //     //Send 1 token to PAIR SC
    //     const tr = await CONTRACT_TST.connect(owner).transfer(addressPair, ethers.utils.parseEther("1"));
    //     await tr.wait();

    //     console.log("Balance PAIR in TST tokens", await CONTRACT_TST.balanceOf(addressPair));
    //     // Invoke sync() function in PAIR SC. This wiil define price for 1 wei of LP token at 1ETH and 1TST token.
    //     const sync = await CONTRACT_PAIR.connect(owner).sync()
    //     await sync.wait();

    //     const after =  await ethers.provider.getBalance(addressPair);
    //     const reservesAfter = await CONTRACT_PAIR.connect(owner).getReserves();
    //     console.log(before, after, "RESERVES before=>", reservesBefore, "RESERVES after=>", reservesAfter);
    //     const balance1 = await CONTRACT_PAIR.connect(owner).balanceOf(owner.address)
    //     console.log("owner balance after sync in LP tokens=>",balance1);
    // })








})
