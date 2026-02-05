import { GAME_TOKEN_MINT } from "../constants/programId"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createSyncNativeInstruction,
} from '@solana/spl-token';
import axios from 'axios'
import {
  API_URLS,
  ApiSwapV1Out,
  USDCMint,
  PoolKeys,
  getATAAddress,
  swapBaseInAutoAccount,
  ALL_PROGRAM_ID,
  printSimulate,
  addComputeBudget,
} from '@raydium-io/raydium-sdk-v2'
import { LAMPORTS_PER_SOL, PublicKey, Transaction, VersionedTransaction, TransactionMessage, SystemProgram } from "@solana/web3.js"
import BN from "bn.js"

export const getRaydiumSwapOutputAmount = async (uiAmount, solInput, connection, user) => {
  let inputMint = NATIVE_MINT.toBase58()
  let outputMint = GAME_TOKEN_MINT.toBase58()
  if(!solInput){
    outputMint = NATIVE_MINT.toBase58()
    inputMint = GAME_TOKEN_MINT.toBase58()
  }
  const amount = uiAmount * (solInput?LAMPORTS_PER_SOL:10**9);
  const slippage = 0.5 // in percent, for this example, 0.5 means 0.5%
  const txVersion = 'LEGACY'  // 'LEGACY' | 'VO'
  console.log("call swap.js")
  const { data: swapResponse } = await axios.get(
    `${
      API_URLS.SWAP_HOST
    }/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${
      slippage * 100
    }&txVersion=${txVersion}`
  )
  if (!swapResponse.success) {
    console.log("swapResponse error", swapResponse);
    return 0;
  }
  const uiOutputAmount = Number(swapResponse?.data?.outputAmount ?? 0) / 10**9;
  return uiOutputAmount 
}

export const swapRaydiumBaseIn = async (uiAmount, solInput, connection, user, sendTransaction, slippage=0.5) => {
  let inputMint = NATIVE_MINT.toBase58()
  let outputMint = GAME_TOKEN_MINT.toBase58()
  if(!solInput){
    outputMint = NATIVE_MINT.toBase58()
    inputMint = GAME_TOKEN_MINT.toBase58()
  }
  const amount = uiAmount * (solInput?LAMPORTS_PER_SOL:10**9);
  const txVersion = 'V0'  // 'LEGACY' | 'VO'
  const { data: swapResponse } = await axios.get(
    `${
      API_URLS.SWAP_HOST
    }/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${
      slippage * 100
    }&txVersion=${txVersion}`
  )

  if (!swapResponse.success) {
    throw new Error(swapResponse.msg)
  }

  const res = await axios.get(
    API_URLS.BASE_HOST + API_URLS.POOL_KEY_BY_ID + `?ids=${swapResponse.data.routePlan.map((r) => r.poolId).join(',')}`
  )

  const allMints = res.data.data.map((r) => [r.mintA, r.mintB]).flat()
  const [mintAProgram, mintBProgram] = [
    allMints.find((m) => m.address === inputMint).programId,
    allMints.find((m) => m.address === outputMint).programId,
  ]

  // get input/output token account ata
  // please ensure your input token account has balance
  const inputAccount = getATAAddress(user, new PublicKey(inputMint), new PublicKey(mintAProgram)).publicKey
  const outputAccount = getATAAddress(user, new PublicKey(outputMint), new PublicKey(mintBProgram)).publicKey

  const ins = swapBaseInAutoAccount({
    programId: ALL_PROGRAM_ID.Router,
    wallet: user,
    amount: new BN(amount),
    inputAccount,
    outputAccount,
    routeInfo: swapResponse,
    poolKeys: res.data.data,
  })

  const { blockhash: recentBlockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  // set up compute units
  const { instructions } = addComputeBudget({
    units: 600000,
    microLamports: 6000000,
  })

  let instructionsATA = []
  if(solInput){
    instructionsATA = [
      createAssociatedTokenAccountIdempotentInstruction(
        user,
        inputAccount,
        user,
        NATIVE_MINT,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID),
        SystemProgram.transfer({
          fromPubkey: user,
          toPubkey: inputAccount,
          lamports: Number(amount),
        }),
      createSyncNativeInstruction(inputAccount),
      createAssociatedTokenAccountIdempotentInstruction(
        user,
        outputAccount,
        user,
        GAME_TOKEN_MINT,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID)
    ]
  }else{
    instructionsATA = [
      createAssociatedTokenAccountIdempotentInstruction(
        user,
        outputAccount,
        user,
        NATIVE_MINT,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID),
    ]
  }
  let closeWSOLIns = undefined;

  if(!solInput){
    closeWSOLIns = createCloseAccountInstruction(
      outputAccount,  // account to close
      user,    // destination for remaining SOL
      user     // owner authority
    );
  }

  const msgV0 = new TransactionMessage({
    payerKey: user,
    recentBlockhash: recentBlockhash,
    instructions: closeWSOLIns? [...instructions, ...instructionsATA, ins, closeWSOLIns]:[...instructions, ...instructionsATA, ins],
  }).compileToV0Message([]);

  const tx = new VersionedTransaction(msgV0);

  const signature = await sendTransaction(tx, connection, { 
    skipPreflight: false,
    maxRetries: 3,
    preflightCommitment: 'processed'
  });  

  // Wait for confirmation
  await connection.confirmTransaction({
    signature,
    blockhash:recentBlockhash,
    lastValidBlockHeight
  });

  return signature;
}