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
import { Issuer, IssuerRequest, MintToken } from "@daml.js/nft-0.0.1/lib/UserAdmin";
import { GridList, GridListTile, GridListTileBar, IconButton, Popover } from "@material-ui/core";
import Notes from '@material-ui/icons/Notes';
import { TokenExpiredError } from "jsonwebtoken";
import { fetchWellKnownParties } from "./wellKnownParties";

export default function MyWorks() {
  const classes = useStyles();
  const party = useParty();
  const issuedByMe = () => [{issuer: party}];
  const ledger : Ledger = useLedger();
  const tokens = useStreamQueries(Token, issuedByMe).contracts;
  const offers = useStreamQueries(TokenOffer, issuedByMe).contracts;
  const issuers = useStreamQueries(Issuer, issuedByMe).contracts;
  const myIssuerRights = issuers.length >= 1 ? issuers[0] : null;
  const issuerRequests = useStreamQueries(IssuerRequest, issuedByMe).contracts;
  const myIssuerRequest = issuerRequests.length >= 1 ? issuerRequests[0] : null;

  function formatter(ccy: string, amountStr: string){
    const ccyFormatter=new Intl.NumberFormat('en-us',{
      style: 'currency',
      currency: ccy
    });
    return ccyFormatter.format(parseFloat(amountStr));
  }

  const defaultMintProps : InputDialogProps<MintToken> = {  
    open: false,
    title: "Mint Token",
    defaultValue: {
      description: "",
      initialPrice: "",
      currency: "",
      royaltyRate: "",
      thumbnail: ""
    },
    fields: {
      description: {
        label: "Description",
        type: "text"
      },
      initialPrice: {
        label: "Initial Price",
        type: "number"
      },
      currency: {
        label: "Currency", 
        type: "selection",
        items: ["USD", "EUR", "GBP", "CAD", "CHF", "AUD", "HKD"]
      },
      royaltyRate: {
        label: "Royalty Rate (as decimal)",
        type: "number"
      },
      thumbnail: {
        label: "Thumbnail",
        type: "upload"
      }
    },
    onClose: async function() {}
  }
  
  const [ mintProps, setMintProps ] = useState(defaultMintProps);
  function showMint(issuer: Issuer.CreateEvent | null) {
    if (!issuer) return;
    async function onClose(state : MintToken | null) {
      setMintProps({ ...defaultMintProps, open: false});
      // if you want to use the contracts payload
      if (!state || !issuer) return;
      await ledger.exercise(Issuer.MintToken, issuer.contractId, state);
    };
    setMintProps({...defaultMintProps, open: true, onClose});
  }

  type FieldsForIssuerRequest = Omit<Omit<IssuerRequest, "userAdmin">, "issuer">
  const defaultIssuerRequestProps : InputDialogProps<FieldsForIssuerRequest> = {
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

  const [ issuerRequestProps, setIssuerRequestProps ] = useState(defaultIssuerRequestProps);
  function showIssuerRequest() {
    async function onClose(state: FieldsForIssuerRequest | null) {
      setIssuerRequestProps({...defaultIssuerRequestProps, open: false});
      if (!state) return; 
      const wkp = await fetchWellKnownParties();
      if (!wkp.parties) return;
      await ledger.create(IssuerRequest, {
        ...state, 
        issuer: party, 
        userAdmin: wkp.parties.userAdminParty
      });
    };
    setIssuerRequestProps({...defaultIssuerRequestProps, open: true, onClose});
  }

  interface Tombstone {
    token: Omit<Token, "thumbnail"> 
    contractId: ContractId<Token>
    templateId: string
    anchorEl: HTMLElement 
  };

  const [ tombstone, setTombstone ] = useState<Tombstone | null>(null);

  return (

    <>
      <InputDialog {...mintProps} />
      <InputDialog {...issuerRequestProps} />
      <Button 
        color="primary" 
        size="small" 
        className={classes.choiceButton}
        disabled={!myIssuerRights} 
        variant="contained" 
        onClick={() => showMint(myIssuerRights)}
      >
        Mint New Token
      </Button>
      <p>{myIssuerRights 
        ? "Approved by "+ myIssuerRights.payload.userAdmin
        : "I'm not authorized yet to Mint Tokens."
      }</p>
      <Button 
        color="primary" 
        size="small" 
        className={classes.choiceButton}
        disabled={!!myIssuerRequest || !!myIssuerRights} 
        variant="contained" onClick={() => showIssuerRequest()}
      >
        Bring me on-board as an Issuer!
      </Button>
      <p>{myIssuerRequest 
        ? "Awaiting "+myIssuerRequest.payload.userAdmin+" to Process my Request ('"+myIssuerRequest.payload.reason+"')."
        : ""
      }</p>
      <Popover
        open={!!tombstone}
        anchorEl={tombstone ? tombstone.anchorEl : null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={() => setTombstone(null)}
      >
        {tombstone ? 
          <>
            <Table size="small">
              <TableBody>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>contractId</TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tombstone.contractId}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell key={0} className={classes.tableCell}>templateId</TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tombstone.templateId}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Issued on </TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tombstone.token.issued}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Owned by </TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tombstone.token.owner}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Last Price </TableCell>
                  <TableCell key={1} className={classes.tableCell}>{formatter(tombstone.token.currency, tombstone.token.lastPrice)}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>Royalty Rate per 1 {tombstone.token.currency}</TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tombstone.token.royaltyRate}</TableCell>
                </TableRow>
                <TableRow className={classes.tableRow}>
                  <TableCell key={0} className={classes.tableCell}>User Admin </TableCell>
                  <TableCell key={1} className={classes.tableCell}>{tombstone.token.userAdmin}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </> 
          : "Nothin'"}
      </Popover>
      <GridList cellHeight={320}  cols={3}>
        {[...tokens, ...offers].map(t => (
          <GridListTile key={t.contractId}>
            
            <img src={t.payload.thumbnail} />
            <GridListTileBar 
              title={t.payload.description}
              subtitle={"By "+t.payload.issuer}
              actionIcon={<IconButton 
                disableRipple={true}
                onClick={(e) => setTombstone({
                  token: t.payload, 
                  contractId: t.contractId, 
                  templateId: t.templateId, 
                  anchorEl: e.currentTarget
                })}>
                  <Notes />
              </IconButton>}
              actionPosition="left"
            />
          </GridListTile>
        ))}
      </GridList>
    </>
  );
}
