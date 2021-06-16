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
import { GridList, GridListTile, GridListTileBar, IconButton, Popover, Typography } from "@material-ui/core";
import { fetchWellKnownParties } from "./wellKnownParties";
import { CallMade, CallReceived, Check } from "@material-ui/icons";

function formatter(ccy: string, amountStr: string){
  const ccyFormatter=new Intl.NumberFormat('en-us',{
    style: 'currency',
    currency: ccy
  });
  return ccyFormatter.format(parseFloat(amountStr));
}

interface TokenTombstone {
  token: Omit<Token.CreateEvent, "payload.thumbnail">
  anchorEl: HTMLElement
}

interface TokenOfferTombstone {
  tokenOffer: Omit<TokenOffer.CreateEvent, "payload.thumbnail">
  anchorEl: HTMLElement
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
  function showOffer(ts : TokenTombstone) {
    async function onClose(state : Offer | null) {
      setOfferProps({ ...defaultOfferProps, open: false});
      setTokenTombstone(null);
      // if you want to use the contracts payload
      if (!state || ts.token.payload.owner === state.newOwner) return;
      await ledger.exercise(Token.Offer, ts.token.contractId, state);
    };
    setOfferProps({ ...defaultOfferProps, open: true, onClose});
  };

  async function justAccept(ts: TokenOfferTombstone) {
    if (!myOwnerRight) return;
    setTokenOfferTombstone(null);
    ledger.exercise(Owner.AcceptTokenAsNewOwner, myOwnerRight.contractId, { offerId: ts.tokenOffer.contractId });
  }

  async function justReject(ts: TokenOfferTombstone) {
    setTokenOfferTombstone(null);
    ledger.exercise(TokenOffer.Reject, ts.tokenOffer.contractId, {});
  }

  async function justClawBack(ts: TokenOfferTombstone) {
    setTokenOfferTombstone(null);
    ledger.exercise(TokenOffer.ClawBack, ts.tokenOffer.contractId, {});
  }

  const [tokenTombstone, setTokenTombstone] = useState<TokenTombstone | null>(null);
  const [tokenOfferTombstone, setTokenOfferTombstone] = useState<TokenOfferTombstone | null>(null);

  return (

    <>
      <InputDialog {...ownerRequestProps} />
      <InputDialog {...offerProps} />

      <Popover
        open={!!tokenTombstone}
        anchorEl={tokenTombstone ? tokenTombstone.anchorEl: null}
        anchorOrigin={{
          vertical:'bottom',
          horizontal:'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        onClose={() => setTokenTombstone(null)}
      >
        {tokenTombstone ? 
          <>
            <Table size="small">
              <TableBody>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>contractId</TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tokenTombstone.token.contractId}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell key={0} className={classes.tableCell}>templateId</TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tokenTombstone.token.templateId}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Issued on </TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tokenTombstone.token.payload.issued}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Owned by </TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tokenTombstone.token.payload.owner}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Last Price </TableCell>
                  <TableCell key={1} className={classes.tableCell}>{formatter(tokenTombstone.token.payload.currency, tokenTombstone.token.payload.lastPrice)}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Royalty Rate per 1 {tokenTombstone.token.payload.currency}</TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tokenTombstone.token.payload.royaltyRate}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>User Admin </TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tokenTombstone.token.payload.userAdmin}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Trade</TableCell>
                  <TableCell key={7} className={classes.tableCellButton}>
                    <Button 
                      color="primary" 
                      size="small" 
                      className={classes.choiceButton} 
                      variant="contained" 
                      disabled={tokenTombstone.token.payload.owner !== party || tokenTombstone.token.templateId !== Token.templateId} 
                      onClick={() => showOffer(tokenTombstone)}>
                        Offer
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </> 
          : "Nothin'"}
      </Popover>

      <Popover
        open={!!tokenOfferTombstone}
        anchorEl={tokenOfferTombstone ? tokenOfferTombstone.anchorEl: null}
        anchorOrigin={{
          vertical:'bottom',
          horizontal:'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        onClose={() => setTokenOfferTombstone(null)}
      >
        {tokenOfferTombstone ? 
          <>
            <Table size="small">
              <TableBody>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>contractId</TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tokenOfferTombstone.tokenOffer.contractId}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell key={0} className={classes.tableCell}>templateId</TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tokenOfferTombstone.tokenOffer.templateId}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Issued on </TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tokenOfferTombstone.tokenOffer.payload.issued}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Owned by </TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tokenOfferTombstone.tokenOffer.payload.owner}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Offered To</TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tokenOfferTombstone.tokenOffer.payload.newOwner}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Last Price </TableCell>
                  <TableCell key={1} className={classes.tableCell}>{formatter(tokenOfferTombstone.tokenOffer.payload.currency, tokenOfferTombstone.tokenOffer.payload.lastPrice)}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Royalty Rate per 1 {tokenOfferTombstone.tokenOffer.payload.currency}</TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tokenOfferTombstone.tokenOffer.payload.royaltyRate}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>User Admin </TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tokenOfferTombstone.tokenOffer.payload.userAdmin}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Trade</TableCell>
                  <TableCell key={1} className={classes.tableCellButton}>
                    <Button 
                      color="primary" 
                      size="small" 
                      className={classes.choiceButton} 
                      variant="contained" 
                      disabled={tokenOfferTombstone.tokenOffer.payload.newOwner !== party} 
                      onClick={() => justAccept(tokenOfferTombstone)}>
                        Accept
                    </Button> 

                    <Button 
                      color="primary" 
                      size="small" 
                      className={classes.choiceButton} 
                      variant="contained" 
                      disabled={tokenOfferTombstone.tokenOffer.payload.newOwner !== party} 
                      onClick={() => justReject(tokenOfferTombstone)}>
                        Reject
                    </Button> 

                    <Button 
                      color="primary" 
                      size="small" 
                      className={classes.choiceButton} 
                      variant="contained" 
                      disabled={tokenOfferTombstone.tokenOffer.payload.owner !== party} 
                      onClick={() => justClawBack(tokenOfferTombstone)}>
                        Claw Back
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </> 
          : "Nothin'"}
      </Popover>
      <GridList cellHeight={320} cols={3}>
        {[...tokens, ...offeredByMe, ...offeredToMe].map(t => (
          <GridListTile key={t.contractId}>
            <img src={t.payload.thumbnail} />
            <GridListTileBar
              title={t.payload.description}
              subtitle={"By "+t.payload.issuer}
              actionIcon={<IconButton
                disableRipple={true}
                onClick={(e) => {
                  switch (t.templateId) {
                    case Token.templateId:
                      setTokenTombstone({token: t, anchorEl: e.currentTarget});
                      setTokenOfferTombstone(null);
                      break;
                    case TokenOffer.templateId:
                      setTokenTombstone(null);
                      setTokenOfferTombstone({tokenOffer: t, anchorEl: e.currentTarget});
                      break;
                  }
                }}>{
                  t.templateId === Token.templateId 
                  ? <Check />
                  : (t.payload.newOwner === party 
                    ? <CallReceived />
                    : <CallMade />)
                }
                </IconButton>}
                actionPosition="left"
            />
          </GridListTile>
        ))}
      </GridList>
      <p>{myOwnerRight 
        ? "Right to Own Approved by "+ myOwnerRight.payload.userAdmin
        : "I'm not authorized yet to Own Tokens."
      }</p>
      {!myOwnerRequest && !myOwnerRight 
        ?
          <Button 
            color="primary" 
            size="small" 
            className={classes.choiceButton}
            disabled={!!myOwnerRequest || !!myOwnerRight} 
            variant="contained" onClick={() => showOwnerRequest()}
          >
          I want to Own Tokens!
        </Button>
        : <br />
      }
      <p>{myOwnerRequest 
        ? "Awaiting "+myOwnerRequest.payload.userAdmin+" to Process my Request ('"+myOwnerRequest.payload.reason+"')."
        : ""
      }</p>

    </>
  );
}
