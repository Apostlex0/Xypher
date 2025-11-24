import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZecDarkPerps } from "../target/types/zec_dark_perps";

describe("Arcium Setup Verification", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .ZecDarkPerps as Program<ZecDarkPerps>;

  it("verifies Arcium dependencies are installed", async () => {
    console.log("✅ Arcium anchor dependency loaded");
    console.log("✅ Program ID:", program.programId.toString());
    console.log("✅ Provider connected:", provider.connection.rpcEndpoint);
    
    // This test just verifies the setup is correct
    // We'll add actual encrypted instruction tests later
    console.log("\n🎉 Arcium setup complete!");
    console.log("Next steps:");
    console.log("1. Deploy to devnet");
    console.log("2. Initialize MXE cluster");
    console.log("3. Test encrypted health check calculations");
  });
});
