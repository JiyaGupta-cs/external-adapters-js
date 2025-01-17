import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { PoRAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { POR_ADDRESS_LIST_ABI } from '../config/abi'
import { BaseEndpointTypes, inputParameters } from '../endpoint/address'
import { ethers } from 'ethers'
import { fetchAddressList } from './utils'

export type AddressTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

export class AddressTransport extends SubscriptionTransport<AddressTransportTypes> {
  provider!: ethers.providers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<AddressTransportTypes>,
    adapterSettings: AddressTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.provider = new ethers.providers.JsonRpcProvider(
      adapterSettings.RPC_URL,
      adapterSettings.CHAIN_ID,
    )
  }

  async backgroundHandler(
    context: EndpointContext<AddressTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      response = {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<AddressTransportTypes['Response']>> {
    const { confirmations, contractAddress, batchSize, network, chainId, searchLimboValidators } =
      param
    const addressManager = new ethers.Contract(contractAddress, POR_ADDRESS_LIST_ABI, this.provider)
    const latestBlockNum = await this.provider.getBlockNumber()

    const providerDataRequestedUnixMs = Date.now()
    const addressList = await fetchAddressList(
      addressManager,
      latestBlockNum,
      confirmations,
      batchSize,
    )
    const addresses: PoRAddress[] = addressList.map((address) => ({
      address,
      network,
      chainId,
    }))

    return {
      data: {
        searchLimboValidators,
        result: addresses,
      },
      statusCode: 200,
      result: null,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const addressTransport = new AddressTransport()
