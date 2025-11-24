import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createMint,
  createAccount,
  mintTo,
} from "@solana/spl-token";
import { ZecDarkPerps } from "../target/types/zec_dark_perps";

describe("margin account", () => {
  // Configure the client to use the local validator by default
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .ZecDarkPerps as Program<ZecDarkPerps>;

  const wallet = provider.wallet as anchor.Wallet;

  let mint: PublicKey;
  let userTokenAccount: PublicKey;
  let marginPda: PublicKey;
  let marginVaultAta: PublicKey;
  let marginBump: number;

  it("sets up a test mint + user token account", async () => {
    // Create a fresh mint on localnet for tests
    mint = await createMint(
      provider.connection,
      wallet.payer,
      wallet.publicKey,
      null,
      8, // decimals
    );

    // Create user token account
    userTokenAccount = await createAccount(
      provider.connection,
      wallet.payer,
      mint,
      wallet.publicKey,
    );

    // Mint some tokens to the user
    await mintTo(
      provider.connection,
      wallet.payer,
      mint,
      userTokenAccount,
      wallet.payer,
      1_000_000_000n, // 10 tokens if decimals=8
    );
  });

  it("initializes margin account", async () => {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("margin"), wallet.publicKey.toBuffer()],
      program.programId,
    );
    marginPda = pda;
    marginBump = bump;

    marginVaultAta = getAssociatedTokenAddressSync(
      mint,
      marginPda,
      true, // allowOwnerOffCurve for PDA
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    await program.methods
      .initializeMarginAccount()
      .accounts({
        owner: wallet.publicKey,
        marginAccount: marginPda,
        marginVault: marginVaultAta,
        mint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const margin = await program.account.marginAccount.fetch(marginPda);
    console.log("margin after init:", margin);
  });

  it("deposits and withdraws collateral", async () => {
    const amount = new anchor.BN(100_000_000); // 1 token (decimals=8)

    // Deposit
    await program.methods
      .depositCollateral(amount)
      .accounts({
        owner: wallet.publicKey,
        marginAccount: marginPda,
        ownerTokenAccount: userTokenAccount,
        marginVault: marginVaultAta,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    let margin = await program.account.marginAccount.fetch(marginPda);
    console.log("margin after deposit:", margin);

    // Withdraw
    await program.methods
      .withdrawCollateral(amount)
      .accounts({
        owner: wallet.publicKey,
        marginAccount: marginPda,
        marginVault: marginVaultAta,
        ownerTokenAccount: userTokenAccount,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    margin = await program.account.marginAccount.fetch(marginPda);
    console.log("margin after withdraw:", margin);
  });
});
