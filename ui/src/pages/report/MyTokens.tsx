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
import { Token, TokenOffer } from "@daml.js/nft-0.0.1/lib/Token"
import { InputDialog, InputDialogProps } from "./InputDialog";
import useStyles from "./styles";
import { Owner, OwnerRequest } from "@daml.js/nft-0.0.1/lib/UserAdmin";
import { Offer } from "@daml.js/nft-0.0.1/lib/Token";
import { Typography } from "@material-ui/core";
import { fetchWellKnownParties } from "./wellKnownParties";

function formatter(ccy: string, amountStr: string){
  const ccyFormatter=new Intl.NumberFormat('en-us',{
    style: 'currency',
    currency: ccy
  });
  return ccyFormatter.format(parseFloat(amountStr));
}

export default function MyTokens() {
  const classes = useStyles();
  const party = useParty();
  const ownedByMe = () => [{owner: party}];
  const ledger : Ledger = useLedger();
  const tokens = useStreamQueries(Token, ownedByMe).contracts;
  const offeredByMe = useStreamQueries(TokenOffer, ownedByMe).contracts;
  const offeredToMe = useStreamQueries(TokenOffer, () => [{newOwner: party}]).contracts;
  const owners = useStreamQueries(Owner, ownedByMe).contracts;
  const myOwnerRight = owners.length >= 1 ? owners[0] : null;
  const ownerRequests = useStreamQueries(OwnerRequest, ownedByMe).contracts;
  const myOwnerRequest = ownerRequests.length >= 1 ? ownerRequests[0] : null;

  type FieldsForOwnerRequest = Omit<Omit<OwnerRequest, "userAdmin">, "owner">
  const defaultOwnerRequestProps : InputDialogProps<FieldsForOwnerRequest> = {
    open: false, 
    title: "Why?",
    defaultValue: {
      reason: ""
    },
    fields: {
      reason: {
        label: "Reason",
        type: "text"
      }
    },
    onClose: async function () {}
  }

  const [ ownerRequestProps, setOwnerRequestProps ] = useState(defaultOwnerRequestProps);
  function showOwnerRequest() {
    async function onClose(state: FieldsForOwnerRequest | null) {
      setOwnerRequestProps({...defaultOwnerRequestProps, open: false});
      if (!state) return; 
      const wkp = await fetchWellKnownParties();
      if (!wkp.parties) return;
      await ledger.create(OwnerRequest, {...state, owner: party, userAdmin: wkp.parties.userAdminParty});
    };
    setOwnerRequestProps({...defaultOwnerRequestProps, open: true, onClose});
  }

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

  async function justAccept(offer: TokenOffer.CreateEvent) {
    if (!myOwnerRight) return;
    ledger.exercise(Owner.AcceptTokenAsNewOwner, myOwnerRight.contractId, {offerId: offer.contractId});
  }

  async function justReject(offer: TokenOffer.CreateEvent) {
    ledger.exercise(TokenOffer.Reject, offer.contractId, {});
  }

  async function justClawBack(offer: TokenOffer.CreateEvent) {
    ledger.exercise(TokenOffer.ClawBack, offer.contractId, {});
  }

  return (

    <>
      <InputDialog {...ownerRequestProps} />
      <InputDialog {...offerProps} />
      <p>{myOwnerRight 
        ? "Right to Own Approved by "+ myOwnerRight.payload.userAdmin
        : "I'm not authorized yet to Own Tokens."
      }</p>
      <Button 
        color="primary" 
        size="small" 
        className={classes.choiceButton}
        disabled={!!myOwnerRequest || !!myOwnerRight} 
        variant="contained" onClick={() => showOwnerRequest()}
      >
        I want to Own Tokens!
      </Button>
      <p>{myOwnerRequest 
        ? "Awaiting "+myOwnerRequest.payload.userAdmin+" to Process my Request ('"+myOwnerRequest.payload.reason+"')."
        : ""
      }</p>
      <Typography>My Tokens</Typography>
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={1} className={classes.tableCell}>Issuer</TableCell>
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
              <TableCell key={1} className={classes.tableCell}>{t.payload.issuer}</TableCell>
              <TableCell key={2} className={classes.tableCell}>{t.payload.description}</TableCell>
              <TableCell key={3} className={classes.tableCell}>{t.payload.issued}</TableCell>
              <TableCell key={4} className={classes.tableCell}>{formatter(t.payload.currency, t.payload.lastPrice)}</TableCell>
              <TableCell key={5} className={classes.tableCell}>{t.payload.currency}</TableCell>
              <TableCell key={6} className={classes.tableCell}>{t.payload.royaltyRate}</TableCell>
              <TableCell key={7} className={classes.tableCellButton}>
                <Button color="primary" size="small" className={classes.choiceButton} variant="contained" disabled={t.payload.owner !== party} onClick={() => showOffer(t)}>Offer</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <br/>
      <Typography>Outgoing Offers</Typography>
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={0} className={classes.tableCell}>Offered To</TableCell>
            <TableCell key={1} className={classes.tableCell}>Issuer</TableCell>
            <TableCell key={2} className={classes.tableCell}>Description</TableCell>
            <TableCell key={3} className={classes.tableCell}>Issued</TableCell>
            <TableCell key={4} className={classes.tableCell}>Last Price</TableCell>
            <TableCell key={5} className={classes.tableCell}>Offer Price</TableCell>
            <TableCell key={6} className={classes.tableCell}>Currency</TableCell>
            <TableCell key={7} className={classes.tableCell}>Royalty</TableCell>
            <TableCell key={8} className={classes.tableCell}>Withdraw</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {offeredByMe.map(t => (
            <TableRow key={t.contractId} className={classes.tableRow}>
              <TableCell key={0} className={classes.tableCell}>{t.payload.newOwner}</TableCell>
              <TableCell key={1} className={classes.tableCell}>{t.payload.issuer}</TableCell>
              <TableCell key={2} className={classes.tableCell}>{t.payload.description}</TableCell>
              <TableCell key={3} className={classes.tableCell}>{t.payload.issued}</TableCell>
              <TableCell key={4} className={classes.tableCell}>{formatter(t.payload.currency, t.payload.lastPrice)}</TableCell>
              <TableCell key={5} className={classes.tableCell}>{formatter(t.payload.currency, t.payload.price)}</TableCell>
              <TableCell key={6} className={classes.tableCell}>{t.payload.currency}</TableCell>
              <TableCell key={7} className={classes.tableCell}>{t.payload.royaltyRate}</TableCell>
              <TableCell key={8} className={classes.tableCellButton}>
                <Button color="primary" size="small" className={classes.choiceButton} variant="contained" onClick={() => justClawBack(t) }>Claw Back</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <br/>
      <Typography>Incoming Offers</Typography>
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={0} className={classes.tableCell}>Offered By</TableCell>
            <TableCell key={1} className={classes.tableCell}>Issuer</TableCell>
            <TableCell key={2} className={classes.tableCell}>Description</TableCell>
            <TableCell key={3} className={classes.tableCell}>Issued</TableCell>
            <TableCell key={4} className={classes.tableCell}>Last Price</TableCell>
            <TableCell key={5} className={classes.tableCell}>Offer Price</TableCell>
            <TableCell key={6} className={classes.tableCell}>Currency</TableCell>
            <TableCell key={7} className={classes.tableCell}>Royalty</TableCell>
            <TableCell key={8} className={classes.tableCell}>Accept</TableCell>
            <TableCell key={9} className={classes.tableCell}>Reject</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {offeredToMe.map(t => (
            <TableRow key={t.contractId} className={classes.tableRow}>
              <TableCell key={0} className={classes.tableCell}>{t.payload.owner}</TableCell>
              <TableCell key={1} className={classes.tableCell}>{t.payload.issuer}</TableCell>
              <TableCell key={2} className={classes.tableCell}>{t.payload.description}</TableCell>
              <TableCell key={3} className={classes.tableCell}>{t.payload.issued}</TableCell>
              <TableCell key={4} className={classes.tableCell}>{formatter(t.payload.currency, t.payload.lastPrice)}</TableCell>
              <TableCell key={5} className={classes.tableCell}>{formatter(t.payload.currency, t.payload.price)}</TableCell>
              <TableCell key={6} className={classes.tableCell}>{t.payload.currency}</TableCell>
              <TableCell key={7} className={classes.tableCell}>{t.payload.royaltyRate}</TableCell>
              <TableCell key={8} className={classes.tableCellButton}>
                <Button color="primary" size="small" className={classes.choiceButton} variant="contained" onClick={() => justAccept(t) }>Sure!</Button>
              </TableCell>
              <TableCell key={9} className={classes.tableCellButton}>
                <Button color="primary" size="small" className={classes.choiceButton} variant="contained" onClick={() => justReject(t) }>Nope!</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
