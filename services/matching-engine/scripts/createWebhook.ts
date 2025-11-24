/**
 * Helius Webhook Setup Script
 * 
 * Creates a webhook to monitor transactions for our program
 * Run with: HELIUS_API_KEY=your_key ts-node scripts/createWebhook.ts
 */

import 'dotenv/config';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const PROGRAM_ID = process.env.PROGRAM_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3001/webhooks/helius';

if (!HELIUS_API_KEY) {
  console.error('❌ HELIUS_API_KEY environment variable is required');
  process.exit(1);
}

if (!PROGRAM_ID) {
  console.error('❌ PROGRAM_ID environment variable is required');
  process.exit(1);
}

async function createWebhook() {
  console.log('🔧 Creating Helius webhook...');
  console.log('  Program ID:', PROGRAM_ID);
  console.log('  Webhook URL:', WEBHOOK_URL);

  const url = `https://api-devnet.helius-rpc.com/v0/webhooks?api-key=${HELIUS_API_KEY}`;

  const payload = {
    webhookURL: WEBHOOK_URL,
    transactionTypes: [], // Get all transaction types
    accountAddresses: [],
    webhookType: 'TRANSACTION',
    encoding: 'jsonParsed',
    filter: {
      programIds: [PROGRAM_ID],
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    
    console.log('\n✅ Webhook created successfully!');
    console.log('Webhook ID:', result.webhookID);
    console.log('Webhook URL:', result.webhookURL);
    console.log('\nWebhook will trigger on all transactions involving program:', PROGRAM_ID);
    
    return result;
  } catch (error) {
    console.error('\n❌ Error creating webhook:', error);
    throw error;
  }
}

async function listWebhooks() {
  console.log('\n📋 Listing existing webhooks...');
  
  const url = `https://api-devnet.helius-rpc.com/v0/webhooks?api-key=${HELIUS_API_KEY}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const webhooks = await response.json();
    
    if (webhooks.length === 0) {
      console.log('No existing webhooks found.');
    } else {
      console.log(`Found ${webhooks.length} webhook(s):`);
      webhooks.forEach((wh: any, i: number) => {
        console.log(`\n${i + 1}. ${wh.webhookID}`);
        console.log(`   URL: ${wh.webhookURL}`);
        console.log(`   Type: ${wh.webhookType}`);
      });
    }
    
    return webhooks;
  } catch (error) {
    console.error('❌ Error listing webhooks:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Helius Webhook Manager\n');
  
  // Check if we should list or create
  const command = process.argv[2];
  
  if (command === 'list') {
    await listWebhooks();
  } else if (command === 'delete') {
    const webhookId = process.argv[3];
    if (!webhookId) {
      console.error('❌ Please provide webhook ID to delete');
      console.log('Usage: ts-node scripts/createWebhook.ts delete <webhook-id>');
      process.exit(1);
    }
    await deleteWebhook(webhookId);
  } else {
    // Default: create webhook
    await createWebhook();
  }
}

async function deleteWebhook(webhookId: string) {
  console.log(`🗑️  Deleting webhook: ${webhookId}`);
  
  const url = `https://api-devnet.helius-rpc.com/v0/webhooks/${webhookId}?api-key=${HELIUS_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log('✅ Webhook deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting webhook:', error);
    throw error;
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
