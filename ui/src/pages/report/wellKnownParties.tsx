import React, { useState } from "react";
import {Decoder, object, string } from '@mojotech/json-type-validation'
import { isLocalDev } from "../../config";

/**
 * @param userAdminParty ID of the UserAdmin party on a ledger.
 * @param publicParty ID of the Public party on a ledger.
 */
export type Parties = {
  userAdminParty: string;
  publicParty: string;
}


/**
 * @param parties The party IDs returned by a successful response.
 * @param loading The current status of the response.
 * @param error The error returned by a failed response.
 */
export type WellKnownParties = {
  parties: Parties | null;
  loading: boolean;
  error: string | null;
}

const localWellKnownParties = {
  parties: {
    userAdminParty: "UserAdmin",
    publicParty: "Public"
  },
  loading: false, 
  error: null
}

function wellKnownEndPoint() {
  const url = window.location.host;
  if(!url.endsWith('projectdabl.com')){
    console.warn(`Passed url ${url} does not point to projectdabl.com`);
  }

  return url + '/.well-known/dabl.json';
}

const wellKnownPartiesDecoder: Decoder<Parties> = object({
  userAdminParty: string(),
  publicParty: string(),
})

export async function fetchWellKnownParties() : Promise<WellKnownParties> {
  if (isLocalDev)
    return localWellKnownParties;
  try {
    const response = await fetch('//' + wellKnownEndPoint());
    const dablJson = await response.json();
    const parties = wellKnownPartiesDecoder.runWithException(dablJson);
    return { parties, loading: false, error: null }
  } catch(error) {
    console.error(`Error determining well known parties ${JSON.stringify(error)}`);
    return { parties: null, loading: false, error }
  }
}