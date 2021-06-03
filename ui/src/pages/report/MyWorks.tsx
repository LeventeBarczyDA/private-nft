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
import { Token } from "@daml.js/nft-0.0.1/lib/Token"
import { InputDialog, InputDialogProps } from "./InputDialog";
import useStyles from "./styles";
import { Issuer, IssuerRequest, MintToken } from "@daml.js/nft-0.0.1/lib/UserAdmin";
import { GridList, GridListTile, GridListTileBar, IconButton, Popover } from "@material-ui/core";
import InfoIcon from '@material-ui/icons/Info';
import { TokenExpiredError } from "jsonwebtoken";

export default function MyWorks() {
  const classes = useStyles();
  const party = useParty();
  const issuedByMe = () => [{issuer: party}];
  const ledger : Ledger = useLedger();
  const tokens = useStreamQueries(Token, issuedByMe).contracts;
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
      await ledger.create(IssuerRequest, {...state, issuer: party, userAdmin: "UserAdmin"});
    };
    setIssuerRequestProps({...defaultIssuerRequestProps, open: true, onClose});
  }

  interface Tombstone {
    token: Omit<Token, "thumbnail"> 
    contractId: ContractId<Token>
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
            {tombstone.contractId}
            <br />{"Issued on "+tombstone.token.issued}
            <br />{"Owned by "+tombstone.token.owner}
            <br />{"Last price "+formatter(tombstone.token.currency, tombstone.token.lastPrice)}
            <br />{"Royalty rate "+tombstone.token.royaltyRate}
          </> 
          : "Nothin'"}
      </Popover>
      <GridList cellHeight={320}  cols={3}>
        {tokens.map(t => (
          <GridListTile key={t.contractId}>
            
            <img src={t.payload.thumbnail} />
            <GridListTileBar 
              title={t.payload.description}
              subtitle={"By "+t.payload.issuer}
              actionIcon={<IconButton 
                disableRipple={true}
                onClick={(e) => {setTombstone({token: t.payload, contractId: t.contractId, anchorEl: e.currentTarget}); console.log("Enter")}}>
                  <InfoIcon />
              </IconButton>}
              actionPosition="left"
            />
          </GridListTile>
        ))}
      </GridList>
    </>
  );
}
