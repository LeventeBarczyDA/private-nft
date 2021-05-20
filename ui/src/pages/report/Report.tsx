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

export default function Report() {
  const classes = useStyles();
  const party = useParty();
  const ledger : Ledger = useLedger();
  const tokens = useStreamQueries(Token).contracts;

  const defaultOfferProps : InputDialogProps<Offer> = {
    open: false,
    title: "Offer NFT",
    defaultValue: { 
      newOwner : "",
      price: "" 
    },
    fields: {
      newOwner : {
        label: "New Owner",
        type: "text"
      },
      price: {
        label: "Offer Price",
        type: "number"
      }
    },
    onClose: async function() {}
  };

  const [ offerProps, setOfferProps ] = useState(defaultOfferProps);
  // One can pass the original contracts CreateEvent
  function showOffer(token : Token.CreateEvent) {
    async function onClose(state : Offer | null) {
      setOfferProps({ ...defaultOfferProps, open: false});
      // if you want to use the contracts payload
      if (!state || token.payload.owner === state.newOwner) return;
      await ledger.exercise(Token.Offer, token.contractId, state);
    };
    setOfferProps({ ...defaultOfferProps, open: true, onClose})
  };

  return (
    <>
      <InputDialog { ...offerProps } />
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={0} className={classes.tableCell}>Issuer</TableCell>
            <TableCell key={1} className={classes.tableCell}>Owner</TableCell>
            <TableCell key={2} className={classes.tableCell}>Description</TableCell>
            <TableCell key={3} className={classes.tableCell}>Issued</TableCell>
            <TableCell key={4} className={classes.tableCell}>Last Price</TableCell>
            <TableCell key={5} className={classes.tableCell}>Currency</TableCell>
            <TableCell key={6} className={classes.tableCell}>Royalty</TableCell>
            <TableCell key={7} className={classes.tableCell}>Offer</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tokens.map(t => (
            <TableRow key={t.contractId} className={classes.tableRow}>
              <TableCell key={0} className={classes.tableCell}>{t.payload.issuer}</TableCell>
              <TableCell key={1} className={classes.tableCell}>{t.payload.owner}</TableCell>
              <TableCell key={2} className={classes.tableCell}>{t.payload.description}</TableCell>
              <TableCell key={3} className={classes.tableCell}>{t.payload.issued}</TableCell>
              <TableCell key={4} className={classes.tableCell}>{t.payload.lastPrice}</TableCell>
              <TableCell key={5} className={classes.tableCell}>{t.payload.currency}</TableCell>
              <TableCell key={6} className={classes.tableCell}>{t.payload.royaltyRate}</TableCell>
              <TableCell key={7} className={classes.tableCellButton}>
                <Button color="primary" size="small" className={classes.choiceButton} variant="contained" disabled={t.payload.owner !== party} onClick={() => showOffer(t)}>Give</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
