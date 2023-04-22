import { ChainInfoInner } from '@owallet/stores';
import { ChainIdEnum } from './txs-enums';
import { ChainInfo } from '@owallet/types';
import Big from 'big.js';
import moment from 'moment';
export class TxsHelper {
  public readonly INFO_API_EVM = {
    [ChainIdEnum.TRON]: {
      BASE_URL: 'https://apilist.tronscanapi.com',
      API_KEY: ''
    },
    [ChainIdEnum.BNBChain]: {
      BASE_URL: 'https://api.bscscan.com',
      API_KEY: process.env.API_KEY_BSC_SCAN
    },
    [ChainIdEnum.KawaiiEvm]: {
      BASE_URL: 'https://developers.kawaii.global/mintscan',
      API_KEY: ''
    },
    [ChainIdEnum.Ethereum]: {
      BASE_URL: 'https://api.etherscan.io',
      API_KEY: process.env.API_KEY_ETH_SCAN
    }
  };
  totalFromDecimal(decimals = 6) {
    return new Big(10).pow(decimals);
  }
  replaceZero(str) {
    return parseFloat(str.replace(/^0+|\.?0+$/g, ''));
  }
  removeZeroNumberLast(str) {
    if (!str) return str;
    if (isNaN(this.replaceZero(str))) {
      return parseFloat(str);
    } else if (`${this.replaceZero(str)}`.indexOf('.') == -1) {
      return this.replaceZero(str).toFixed(1);
    }
    return this.replaceZero(str);
  }
  formatNumberSeparateThousand(num, hasFixed = false) {
    if (!num) return num;
    if (hasFixed) {
      const numSplit = num && num.split('.');
      if (numSplit?.length > 1) {
        return (
          numSplit[0].toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') +
          '.' +
          numSplit[1]
        );
      }
    }
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') || '0';
  }
  calculateTransactionFee(gasPrice, gasUsed, decimals = 18): string {
    return (
      (gasPrice &&
        gasUsed &&
        new Big(parseInt(gasUsed))
          .mul(parseInt(gasPrice))
          .div(this.totalFromDecimal(decimals))
          .toFixed(decimals)) ||
      '0'
    );
  }
  formatTime(timestamp): timeTxs {
    if (timestamp) {
      // Create a moment object from the timestamp
      var myMoment = moment.unix(timestamp);

      // Format the moment object using tokens
      var formatted = myMoment.format('YYYY-MM-DD HH:mm:ss');

      // Get the relative time from the moment object to now
      var relative = this.capitalizeFirstLetter(myMoment.fromNow());

      // Combine the formatted and relative strings
      return {
        timeLong: relative + ' (' + formatted + ')',
        timeShort: relative
      };
    } else {
      return {
        timeLong: '',
        timeShort: ''
      };
    }
  }
  addSpacesToString(str) {
    return str && str.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
  getFunctionName(input: string): string {
    // Split the input string by "(" and get the first element of the array
    let output = input && input.split('(')[0];
    // Return the output string
    return output;
  }
  capitalizeFirstLetter(input: string): string {
    // Check if the input is empty or null
    if (!input) {
      return input;
    }
    // Get the first character of the input and convert it to uppercase
    let firstChar = input.charAt(0).toUpperCase();
    // Get the rest of the input and convert it to lowercase
    let rest = input.slice(1).toLowerCase();
    // Return the concatenated string
    return firstChar + rest;
  }
  capitalizedWords(str, splitCharacter = '_') {
    const words = str && str.split(splitCharacter);
    const capitalizedWords =
      words &&
      words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
    return capitalizedWords && capitalizedWords.join(' ');
  }
  formatAmount(amount, decimals = 6) {
    if (!amount) {
      return amount;
    }
    return (
      new Big(parseInt(amount))
        .div(this.totalFromDecimal(decimals))
        .toFixed(decimals) || '0'
    );
  }
  handleTransferDetailEthAndBsc(
    data: InfoTxEthAndBsc,
    currentChain: ChainInfoInner<ChainInfo>,
    addressAccount: string
  ): Partial<TransferDetail>[] {
    let transferItem: Partial<TransferDetail> = {};
    transferItem.countTypeEvent = 0;
    transferItem.typeEvent = this.capitalizedWords(
      this.addSpacesToString(this.getFunctionName(data?.functionName)),
      ' '
    );
    transferItem.isMinus =
      data?.from?.toLowerCase() == addressAccount?.toLowerCase();
    transferItem.isPlus =
      data?.to?.toLowerCase() == addressAccount?.toLowerCase();
    transferItem.transferInfo = [
      {
        from: data?.from,
        to: data?.to,
        amount: this.removeZeroNumberLast(
          this.formatNumberSeparateThousand(
            this.formatAmount(
              data?.value,
              currentChain?.stakeCurrency?.coinDecimals
            ),
            true
          )
        ),
        token: currentChain.stakeCurrency.coinDenom
      }
    ];
    return [transferItem];
  }
  handleItemTxsEthAndBsc(
    data: InfoTxEthAndBsc,
    currentChain: ChainInfoInner<ChainInfo>,
    addressAccount: string
  ): Partial<ResTxsInfo> {
    let item: Partial<ResTxsInfo> = {};
    item.fee = this.removeZeroNumberLast(
      this.formatNumberSeparateThousand(
        this.calculateTransactionFee(
          data.gasPrice,
          data.gasUsed,
          currentChain?.stakeCurrency?.coinDecimals
        ),
        true
      )
    );
    item.denom = currentChain?.stakeCurrency?.coinDenom;
    item.time = this.formatTime(data?.timeStamp);
    item.txHash = data?.hash;
    item.height = data?.blockNumber;
    item.status = data?.isError == '0' ? 'success' : 'fail';
    item.memo = null;
    item.gasUsed = this.formatNumberSeparateThousand(data?.gasUsed);
    item.gasWanted = this.formatNumberSeparateThousand(data?.gas);
    item.transfers = this.handleTransferDetailEthAndBsc(
      data,
      currentChain,
      addressAccount
    );
    return item;
  }

  handleItemTron() {}
  cleanDataResToStandFormat(
    data: InfoTxEthAndBsc[],
    currentChain: ChainInfoInner<ChainInfo>,
    addressAccount: string
  ): Partial<ResTxsInfo>[] {
    let dataConverted: Partial<ResTxsInfo>[] = [];
    if (data && data?.length > 0) {
      for (let i = 0; i < data.length; i++) {
        let item: Partial<ResTxsInfo>;
        const itData = data[i];
        console.log('currentChain.chainId: ', itData, currentChain.chainId);

        switch (currentChain.chainId) {
          case ChainIdEnum.Ethereum:
            item = this.handleItemTxsEthAndBsc(
              itData,
              currentChain,
              addressAccount
            );
            dataConverted.push(item);
            break;
          case ChainIdEnum.BNBChain:
            item = this.handleItemTxsEthAndBsc(
              itData,
              currentChain,
              addressAccount
            );
            dataConverted.push(item);
            break;
          case ChainIdEnum.TRON:
            // item = this.handleItemTron();
            break;
        }
      }
    }
    console.log('dataConverted: ', dataConverted);
    return dataConverted;
  }
}
