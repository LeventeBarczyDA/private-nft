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
import { Issuer, IssuerRequest, Owner, OwnerRequest } from "@daml.js/nft-0.0.1/lib/UserAdmin";
import { Typography } from "@material-ui/core";

export default function UserAdmin() {
  const classes = useStyles();
  const party = useParty();
  const ledger : Ledger = useLedger();
  const asUserAdmin = () => [{userAdmin: party}]
  const issuerRequests = useStreamQueries(IssuerRequest, asUserAdmin).contracts;
  const ownerRequests = useStreamQueries(OwnerRequest, asUserAdmin).contracts;
  const issuers = useStreamQueries(Issuer, asUserAdmin).contracts;
  const owners = useStreamQueries(Owner, asUserAdmin).contracts;

  async function justRevokeIssuer(issuer: Issuer.CreateEvent) {
    ledger.exercise(Issuer.RevokeIssuer, issuer.contractId, {});
  }

  async function justApproveIssuer(issuerRequest: IssuerRequest.CreateEvent) {
    ledger.exercise(IssuerRequest.GrantIssuerRights, issuerRequest.contractId, {});
  }

  async function justRejectIssuer(issuerRequest: IssuerRequest.CreateEvent) {
    ledger.exercise(IssuerRequest.RejectIssuerRequest, issuerRequest.contractId, {});
  }

  async function justRevokeOwner(owner: Owner.CreateEvent) {
    ledger.exercise(Owner.RevokeOwnerRights, owner.contractId, {});
  }

  async function justApproveOwner(ownerRequest: OwnerRequest.CreateEvent) {
    ledger.exercise(OwnerRequest.GrantOwnerRights, ownerRequest.contractId, {});
  }

  async function justRejectOwner(ownerRequest: OwnerRequest.CreateEvent) {
    ledger.exercise(OwnerRequest.RejectOwnerRequest, ownerRequest.contractId, {});
  }

  return (
    <>
      <Typography>Issuers</Typography>
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={0} className={classes.tableCell}>Issuer</TableCell>
            <TableCell key={1} className={classes.tableCell}>Revoke</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {issuers.map(i => (
            <TableRow key={i.contractId} className={classes.tableRow}>
              <TableCell key={0} className={classes.tableCell}>{i.payload.issuer}</TableCell>
              <TableCell key={1} className={classes.tableCellButton}>
                <Button color="primary" size="small" className={classes.choiceButton} variant="contained" onClick={() => justRevokeIssuer(i)}>Revoke</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <br />
      <Typography>Issuer Onboarding Requests</Typography>
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={0} className={classes.tableCell}>Issuer</TableCell>
            <TableCell key={1} className={classes.tableCell}>Reason</TableCell>
            <TableCell key={2} className={classes.tableCell}>Approve</TableCell>
            <TableCell key={3} className={classes.tableCell}>Reject</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {issuerRequests.map(i => (
            <TableRow key={i.contractId} className={classes.tableRow}>
              <TableCell key={0} className={classes.tableCell}>{i.payload.issuer}</TableCell>
              <TableCell key={1} className={classes.tableCell}>{i.payload.reason}</TableCell>
              <TableCell key={2} className={classes.tableCellButton}>
                <Button color="primary" size="small" className={classes.choiceButton} variant="contained" onClick={() => justApproveIssuer(i)}>Approve</Button>
              </TableCell>
              <TableCell key={3} className={classes.tableCellButton}>
                <Button color="primary" size="small" className={classes.choiceButton} variant="contained" onClick={() => justRejectIssuer(i)}>Reject</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <br /> 
      <Typography>Owners</Typography>
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={0} className={classes.tableCell}>Owner</TableCell>
            <TableCell key={1} className={classes.tableCell}>Revoke</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {owners.map(o => (
            <TableRow key={o.contractId} className={classes.tableRow}>
              <TableCell key={0} className={classes.tableCell}>{o.payload.owner}</TableCell>
              <TableCell key={1} className={classes.tableCellButton}>
                <Button color="primary" size="small" className={classes.choiceButton} variant="contained" onClick={() => justRevokeOwner(o)}>Revoke</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <br />
      <Typography>Owner Onboarding Requests</Typography>
      <Table size="small">
        <TableHead>
          <TableRow className={classes.tableRow}>
            <TableCell key={0} className={classes.tableCell}>Issuer</TableCell>
            <TableCell key={1} className={classes.tableCell}>Reason</TableCell>
            <TableCell key={2} className={classes.tableCell}>Approve</TableCell>
            <TableCell key={3} className={classes.tableCell}>Reject</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ownerRequests.map(o => (
            <TableRow key={o.contractId} className={classes.tableRow}>
              <TableCell key={0} className={classes.tableCell}>{o.payload.owner}</TableCell>
              <TableCell key={1} className={classes.tableCell}>{o.payload.reason}</TableCell>
              <TableCell key={2} className={classes.tableCellButton}>
                <Button color="primary" size="small" className={classes.choiceButton} variant="contained" onClick={() => justApproveOwner(o)}>Approve</Button>
              </TableCell>
              <TableCell key={3} className={classes.tableCellButton}>
                <Button color="primary" size="small" className={classes.choiceButton} variant="contained" onClick={() => justRejectOwner(o)}>Reject</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
