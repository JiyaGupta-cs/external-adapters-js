import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  RPC_URL: {
    description: 'The RPC URL to connect to the EVM chain',
    type: 'string',
    required: true,
  },
  CHAIN_ID: {
    description: 'The chain id to connect to',
    type: 'number',
    required: true,
    default: 1,
  },
  MULTICALL_ADDRESS: {
    description: 'The address of the Multicall3 contract',
    type: 'string',
    required: true,
    default: '0xcA11bde05977b3631167028862bE2a173976CA11', // Multicall3 contract on Ethereum Mainnet
  },
  REGISTRY_ADDRESS: {
    description: 'The address of the deployed APY.Finance Registry contract',
    type: 'string',
    required: true,
  },
  TOKEN_ALLOCATION_ADAPTER_URL: {
    description: 'The URL of a Token Allocation external adapter',
    type: 'string',
    required: true,
  },
})
