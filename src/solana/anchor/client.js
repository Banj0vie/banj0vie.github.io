import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from './idl';
import { SOLANA_VALLEY_PROGRAM_ID } from '../constants/programId';

export class SolanaValleyProgram {
  constructor(connection, wallet) {
    this.connection = connection;
    this.provider = new AnchorProvider(connection, wallet, {});
    this.program = new Program(idl, new PublicKey(SOLANA_VALLEY_PROGRAM_ID), this.provider);
  }

  getProgram() {
    return this.program;
  }

  getConnection() {
    return this.connection;
  }

  getProvider() {
    return this.provider;
  }

  getProgramId() {
    return this.program.programId;
  }

  getWalletPublicKey() {
    return this.provider.wallet.publicKey;
  }
}

export const createSolanaValleyProgram = (connection, wallet) => {
  return new SolanaValleyProgram(connection, wallet);
};
