import React, { useState } from "react";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import Button from "@material-ui/core/Button";
import Ledger from "@daml/ledger";
import { useLedger, useParty, useStreamQueries} from "@daml/react";
import { ContractId } from "@daml/types";
import { Offer, Token, TokenOffer } from "@daml.js/nft-0.0.1/lib/Token"
import { InputDialog, InputDialogProps } from "./InputDialog";
import useStyles from "./styles";
import { ClaimPaid, Payable, PaymentClaim, Receipt } from "@daml.js/nft-0.0.1/lib/Payment";
import { Typography } from "@material-ui/core";

function formatter(ccy: string, amountStr: string){
  const ccyFormatter=new Intl.NumberFormat('en-us',{
    style: 'currency',
    currency: ccy
  });
  return ccyFormatter.format(parseFloat(amountStr));
}

export default function Payments() {
  const classes = useStyles();
  const party = useParty();
  const ledger : Ledger = useLedger();
  const byMe = () => [{from: party}];
  const toMe = () => [{to: party}];
  const payableByMe = useStreamQueries(Payable, byMe).contracts;
  const payableToMe = useStreamQueries(Payable, toMe).contracts;
  const paidByMe = useStreamQueries(PaymentClaim, byMe).contracts;
  const paidToMe = useStreamQueries(PaymentClaim, toMe).contracts;
  const receiptsByMe = useStreamQueries(Receipt, byMe).contracts;
  const receiptsToMe = useStreamQueries(Receipt, toMe).contracts;

  const defaultPayProps : InputDialogProps<ClaimPaid> = {
    open: false, 
    title: "Pay",
    defaultValue: {
      transactionId: ""
    },
    fields: {
      transactionId: {
        label: "Txn #",
        type: "text"
      }
    },
    onClose: async function () {}
  }

  const [ payProps, setPayProps ] = useState(defaultPayProps);
  function showPay(payable: Payable.CreateEvent) {
    async function onClose(state: ClaimPaid | null) {
      setPayProps({...defaultPayProps, open: false});
      if (!state) return; 
      await ledger.exercise(Payable.ClaimPaid, payable.contractId, state);
    };
    setPayProps({...defaultPayProps, open: true, onClose});
  }

  async function justIssueReceipt(claim: PaymentClaim.CreateEvent) {
    ledger.exercise(PaymentClaim.Receive, claim.contractId, {});
  }

  async function justDismiss(receipt: Receipt.CreateEvent) {
    ledger.exercise(Receipt.Dismiss, receipt.contractId, {});
  }

  return (
    <>
      <InputDialog {...payProps} />
      <Typography>Payable By Me</Typography>
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={0} className={classes.tableCell}>To</TableCell>
            <TableCell key={1} className={classes.tableCell}>Amount</TableCell>
            <TableCell key={2} className={classes.tableCell}>Currency</TableCell>
            <TableCell key={3} className={classes.tableCell}>Reference</TableCell>
            <TableCell key={4} className={classes.tableCell}>Pay</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payableByMe.map(p => (
            <TableRow key={p.contractId} className={classes.tableRow}>
              <TableCell key={0} className={classes.tableCell}>{p.payload.to}</TableCell>
              <TableCell key={1} className={classes.tableCell}>{formatter(p.payload.currency,p.payload.amount)}</TableCell>
              <TableCell key={2} className={classes.tableCell}>{p.payload.currency}</TableCell>
              <TableCell key={3} className={classes.tableCell}>{p.payload.reference}</TableCell>
              <TableCell key={4} className={classes.tableCellButton}>
                <Button 
                  color="primary" 
                  size="small" 
                  className={classes.choiceButton} 
                  variant="contained" 
                  onClick={() => showPay(p)}>Claim</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <br />
      <Typography>Payable To Me</Typography>
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={0} className={classes.tableCell}>From</TableCell>
            <TableCell key={1} className={classes.tableCell}>Amount</TableCell>
            <TableCell key={2} className={classes.tableCell}>Currency</TableCell>
            <TableCell key={3} className={classes.tableCell}>Reference</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payableToMe.map(p => (
            <TableRow key={p.contractId} className={classes.tableRow}>
              <TableCell key={0} className={classes.tableCell}>{p.payload.from}</TableCell>
              <TableCell key={1} className={classes.tableCell}>{formatter(p.payload.currency, p.payload.amount)}</TableCell>
              <TableCell key={2} className={classes.tableCell}>{p.payload.currency}</TableCell>
              <TableCell key={3} className={classes.tableCell}>{p.payload.reference}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <br />
      <Typography>My Claims of Payment</Typography>
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={0} className={classes.tableCell}>To</TableCell>
            <TableCell key={1} className={classes.tableCell}>Amount</TableCell>
            <TableCell key={2} className={classes.tableCell}>Currency</TableCell>
            <TableCell key={3} className={classes.tableCell}>Reference</TableCell>
            <TableCell key={4} className={classes.tableCell}>Txn #</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paidByMe.map(p => (
            <TableRow key={p.contractId} className={classes.tableRow}>
              <TableCell key={0} className={classes.tableCell}>{p.payload.to}</TableCell>
              <TableCell key={1} className={classes.tableCell}>{formatter(p.payload.currency, p.payload.amount)}</TableCell>
              <TableCell key={2} className={classes.tableCell}>{p.payload.currency}</TableCell>
              <TableCell key={3} className={classes.tableCell}>{p.payload.reference}</TableCell>
              <TableCell key={4} className={classes.tableCell}>{p.payload.transactionId}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <br />
      <Typography>Claims of Payment To Me</Typography>
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={0} className={classes.tableCell}>From</TableCell>
            <TableCell key={1} className={classes.tableCell}>Amount</TableCell>
            <TableCell key={2} className={classes.tableCell}>Currency</TableCell>
            <TableCell key={3} className={classes.tableCell}>Reference</TableCell>
            <TableCell key={4} className={classes.tableCell}>Txn #</TableCell>
            <TableCell key={5} className={classes.tableCell}>Receipt</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paidToMe.map(p => (
            <TableRow key={p.contractId} className={classes.tableRow}>
              <TableCell key={0} className={classes.tableCell}>{p.payload.from}</TableCell>
              <TableCell key={1} className={classes.tableCell}>{formatter(p.payload.currency, p.payload.amount)}</TableCell>
              <TableCell key={2} className={classes.tableCell}>{p.payload.currency}</TableCell>
              <TableCell key={3} className={classes.tableCell}>{p.payload.reference}</TableCell>
              <TableCell key={4} className={classes.tableCell}>{p.payload.transactionId}</TableCell>
              <TableCell key={5} className={classes.tableCellButton}>
                <Button 
                  color="primary" 
                  size="small" 
                  className={classes.choiceButton} 
                  variant="contained" 
                  onClick={() => justIssueReceipt(p)}>Issue</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <br />
      <Typography>My Receipts</Typography>
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={0} className={classes.tableCell}>To</TableCell>
            <TableCell key={1} className={classes.tableCell}>Amount</TableCell>
            <TableCell key={2} className={classes.tableCell}>Currency</TableCell>
            <TableCell key={3} className={classes.tableCell}>Reference</TableCell>
            <TableCell key={4} className={classes.tableCell}>Txn #</TableCell>
            <TableCell key={5} className={classes.tableCell}>Received</TableCell>
            <TableCell key={6} className={classes.tableCell}>Dismiss</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {receiptsByMe.map(p => (
            <TableRow key={p.contractId} className={classes.tableRow}>
              <TableCell key={0} className={classes.tableCell}>{p.payload.to}</TableCell>
              <TableCell key={1} className={classes.tableCell}>{formatter(p.payload.currency, p.payload.amount)}</TableCell>
              <TableCell key={2} className={classes.tableCell}>{p.payload.currency}</TableCell>
              <TableCell key={3} className={classes.tableCell}>{p.payload.reference}</TableCell>
              <TableCell key={4} className={classes.tableCell}>{p.payload.transactionId}</TableCell>
              <TableCell key={5} className={classes.tableCell}>{p.payload.received}</TableCell>
              <TableCell key={6} className={classes.tableCellButton}>
                <Button 
                  color="primary" 
                  size="small" 
                  className={classes.choiceButton} 
                  variant="contained" 
                  onClick={() => justDismiss(p)}>Dismiss</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <br />
      <Typography>Receipts Made by Me</Typography>
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={0} className={classes.tableCell}>From</TableCell>
            <TableCell key={1} className={classes.tableCell}>Amount</TableCell>
            <TableCell key={2} className={classes.tableCell}>Currency</TableCell>
            <TableCell key={3} className={classes.tableCell}>Reference</TableCell>
            <TableCell key={4} className={classes.tableCell}>Txn #</TableCell>
            <TableCell key={5} className={classes.tableCell}>Received</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {receiptsToMe.map(p => (
            <TableRow key={p.contractId} className={classes.tableRow}>
              <TableCell key={0} className={classes.tableCell}>{p.payload.from}</TableCell>
              <TableCell key={1} className={classes.tableCell}>{formatter(p.payload.currency, p.payload.amount)}</TableCell>
              <TableCell key={2} className={classes.tableCell}>{p.payload.currency}</TableCell>
              <TableCell key={3} className={classes.tableCell}>{p.payload.reference}</TableCell>
              <TableCell key={4} className={classes.tableCell}>{p.payload.transactionId}</TableCell>
              <TableCell key={5} className={classes.tableCell}>{p.payload.received}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
