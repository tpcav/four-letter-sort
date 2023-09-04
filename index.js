const express = require("express");
const { google } = require("googleapis");
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Load your Google Sheets credentials and spreadsheetId
const keyFile = process.env.GOOGLE_SHEETS_KEY_FILE;
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
let currentWordIndex = 0; // To track the index of the current word

app.get("/", async (req, res) => {
    try {
        // Create Google Sheets authentication
        const auth = new google.auth.GoogleAuth({
            keyFile,
            scopes: "https://www.googleapis.com/auth/spreadsheets",
        });

        // Create client instance for authentication
        const client = await auth.getClient();

        // Create an instance of Google Sheets API
        const sheets = google.sheets({ version: "v4", auth: client });

        // Fetch values starting from cells A2 and B2
        const response = await sheets.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges: ["Sheet1!A2:B"], // Modify the sheet name and cell references as needed
        });

        // Extract the values from the response
        const values = response.data.valueRanges[0].values;

        // If there are available words, select the current word
        let word = "No more words to show.";
        if (values && currentWordIndex < values.length) {
            word = values[currentWordIndex][0]; // Assuming words are in column A
        }

        res.render("index", { word });
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while fetching the word.");
    }
});

app.post("/", async (req, res) => {
    const { know } = req.body;

    try {
        // Create Google Sheets authentication
        const auth = new google.auth.GoogleAuth({
            keyFile,
            scopes: "https://www.googleapis.com/auth/spreadsheets",
        });

        // Create client instance for authentication
        const client = await auth.getClient();

        // Create an instance of Google Sheets API
        const sheets = google.sheets({ version: "v4", auth: client });

        // Update the answer in the cell next to the current word
        const range = `Sheet1!B${currentWordIndex + 2}`; // Cell B2 for the current word
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: "RAW",
            resource: { values: [[know]] },
        });

        // Increment the current word index to move to the next word
        currentWordIndex++;

        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while updating the response.");
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
