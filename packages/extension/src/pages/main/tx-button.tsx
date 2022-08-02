import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

import styleTxButton from './tx-button.module.scss';

import { Button, Tooltip } from 'reactstrap';

import { observer } from 'mobx-react-lite';

import { useStore } from '../../stores';

import Modal from 'react-modal';

import { FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router';

import classnames from 'classnames';
import { Dec } from '@owallet/unit';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const QrCode = require('qrcode');

const DepositModal: FunctionComponent<{
  bech32Address: string;
}> = ({ bech32Address }) => {
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrCodeRef.current && bech32Address) {
      QrCode.toCanvas(qrCodeRef.current, bech32Address);
    }
  }, [bech32Address]);

  const notification = useNotification();

  const copyAddress = useCallback(
    async (e: MouseEvent) => {
      await navigator.clipboard.writeText(bech32Address);
      // TODO: Show success tooltip.
      notification.push({
        placement: "top-center",
        type: "success",
        duration: 2,
        content: "Address copied!",
        canDelete: true,
        transition: {
          duration: 0.25,
        },
      });

      e.preventDefault();
    },
    [notification, bech32Address]
  );

  return (
    <div className={styleTxButton.depositModal}>
      <h1 className={styleTxButton.title}>Scan to Receive </h1>
      <canvas className={styleTxButton.qrcode} id="qrcode" ref={qrCodeRef} />
    </div>
  );
};

export interface TxButtonViewProps {
  setHasSend?: any;
  hasSend?: boolean;
}

export const TxButtonView: FunctionComponent<TxButtonViewProps> = observer(
  ({ setHasSend, hasSend }) => {
    const { accountStore, chainStore, queriesStore } = useStore();

    const accountInfo = accountStore.getAccount(chainStore.current.chainId);
    const queries = queriesStore.get(chainStore.current.chainId);
    const queryBalances = queries.queryBalances.getQueryBech32Address(
      accountInfo.bech32Address
    );

    const hasAssets =
      queryBalances.balances.find((bal) =>
        bal?.balance?.toDec().gt(new Dec(0))
      ) !== undefined;

    const [isDepositOpen, setIsDepositOpen] = useState(false);

    const [tooltipOpen, setTooltipOpen] = useState(false);

    const history = useHistory();

    const sendBtnRef = useRef<HTMLButtonElement>(null);

    return (
      <div className={styleTxButton.containerTxButton}>
        <Modal
          style={{
            content: {
              width: '330px',
              minWidth: '330px',
              minHeight: 'unset',
              maxHeight: 'unset',
              border: '1px solid #FCFCFD',
              borderRadius: '8px'
            }
          }}
          isOpen={isDepositOpen}
          onRequestClose={() => {
            setIsDepositOpen(false);
          }}
        >
          <DepositModal bech32Address={accountInfo.bech32Address} />
        </Modal>
        <Button
          className={classnames(styleTxButton.button, styleTxButton.btnReceive)}
          outline
          onClick={(e) => {
            e.preventDefault();

            setIsDepositOpen(true);
          }}
        >
          <FormattedMessage id="main.account.button.receive" />
        </Button>
        {/*
        "Disabled" property in button tag will block the mouse enter/leave events.
        So, tooltip will not work as expected.
        To solve this problem, don't add "disabled" property to button tag and just add "disabled" class manually.
       */}
        <Button
          innerRef={sendBtnRef}
          className={classnames(
            styleTxButton.button,
            {
              disabled: !hasAssets
            },
            styleTxButton.btnSend
          )}
          data-loading={accountInfo.isSendingMsg === 'send'}
          onClick={(e) => {
            e.preventDefault();

            if (hasAssets) {
              setHasSend(!hasSend);
              // history.push('/send');
            }
          }}
        >
          <FormattedMessage id="main.account.button.send" />
        </Button>
        {!hasAssets ? (
          <Tooltip
            placement="bottom"
            isOpen={tooltipOpen}
            target={sendBtnRef}
            toggle={() => setTooltipOpen((value) => !value)}
            fade
          >
            <FormattedMessage id="main.account.tooltip.no-asset" />
          </Tooltip>
        ) : null}
      </div>
    );
  }
);

export const TxButtonEvmView: FunctionComponent<TxButtonViewProps> = observer(() => {
  const { accountStore, chainStore, queriesStore } = useStore();

  const accountInfo = accountStore.getAccount(chainStore.current.chainId);
  const queries = queriesStore.get(chainStore.current.chainId);
  // const queryBalances = queries.queryBalances.getQueryBech32Address(
  //   accountInfo.bech32Address
  // );

  const [isDepositOpen, setIsDepositOpen] = useState(false);

  const [tooltipOpen, setTooltipOpen] = useState(false);

  const history = useHistory();

  const sendBtnRef = useRef<HTMLButtonElement>(null);

  if (!accountInfo.evmosHexAddress) return null;

  const evmBalance = queries.evm.queryEvmBalance.getQueryBalance(
    accountInfo.evmosHexAddress
  ).balance;

  const hasAssets =
    parseFloat(evmBalance?.trim(true).shrink(true).maxDecimals(6).toString()) >
    0;

  return (
    <div className={styleTxButton.containerTxButton}>
      <Modal
        style={{
          content: {
            width: '330px',
            minWidth: '330px',
            minHeight: 'unset',
            maxHeight: 'unset'
          }
        }}
        isOpen={isDepositOpen}
        onRequestClose={() => {
          setIsDepositOpen(false);
        }}
      >
        <DepositModal bech32Address={accountInfo.bech32Address} />
      </Modal>
      <Button
        className={classnames(styleTxButton.button, styleTxButton.btnReceive)}
        outline
        onClick={(e) => {
          e.preventDefault();

          setIsDepositOpen(true);
        }}
      >
        <FormattedMessage id="main.account.button.receive" />
      </Button>
      {/*
        "Disabled" property in button tag will block the mouse enter/leave events.
        So, tooltip will not work as expected.
        To solve this problem, don't add "disabled" property to button tag and just add "disabled" class manually.
       */}
      <Button
        innerRef={sendBtnRef}
        className={classnames(
          styleTxButton.button,
          {
            disabled: !hasAssets
          },
          styleTxButton.btnSend
        )}
        data-loading={accountInfo.isSendingMsg === 'send'}
        onClick={(e) => {
          e.preventDefault();

          if (hasAssets) {
            history.push('/send');
          }
        }}
      >
        <FormattedMessage id="main.account.button.send" />
      </Button>
      {!hasAssets ? (
        <Tooltip
          placement="bottom"
          isOpen={tooltipOpen}
          target={sendBtnRef}
          toggle={() => setTooltipOpen((value) => !value)}
          fade
        >
          <FormattedMessage id="main.account.tooltip.no-asset" />
        </Tooltip>
      ) : null}
    </div>
  );
});
