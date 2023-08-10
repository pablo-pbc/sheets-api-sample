const CLIENT_ID = "YOUR_CLIENT_ID";
const API_KEY = "YOUR_API_KEY";
const DISCOVERY_DOC = "https://sheets.googleapis.com/$discovery/rest?version=v4";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById("delete_email").style.visibility = "hidden";

function gapiLoaded() {
  gapi.load("client", initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: "", // definido posteriormente
  });
  gisInited = true;
  maybeEnableButtons();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById("delete_email").style.visibility = "visible";
  }
}

async function deleteRowsByEmails() {
  const spreadsheetId = "YOUR_SPREADSHEET_ID";
  const range = "RANGE!C:C";

  const emailListTextarea = document.getElementById("emailList");

  const emailsText = emailListTextarea.value;
  const emailsArray = emailsText.split(/\s*[,|\n]\s*/);

  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.result.values;

    if (rows.length === 0) {
      console.log("Nenhum dado encontrado na planilha.");
      return;
    }

    const emailsToDelete = emailsArray;

    const requests = [];

    for (let i = rows.length - 1; i >= 0; i--) {
      const email = rows[i][0];

      if (emailsToDelete.includes(email)) {
        requests.push({
          deleteDimension: {
            range: {
              sheetId: 883949306,
              dimension: "ROWS",
              startIndex: i,
              endIndex: i + 1,
            },
          },
        });

        console.log(email + " deletado com sucesso!  Linha: " + i + "");
      }
    }

    if (requests.length === 0) {
      console.log("Nenhum e-mail encontrado na planilha.");
      return;
    }

    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests,
      },
    });

    console.log(`${requests.length} linhas deletadas com sucesso.`);
  } catch (error) {
    console.error("Erro:", error);
  }
}

async function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw resp;
    }
    await deleteRowsByEmails();
  };

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    tokenClient.requestAccessToken({ prompt: "" });
  }
}
