const express = require("express");
const { google } = require("googleapis");
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Load your Google Sheets credentials and spreadsheetId
const keyFile = "credentials.json";
const spreadsheetId = "1t0rGpjn8iEZhzbILGEoycWec83jAX0Lj7IjyydUtRlU";
let currentWordIndex = 0; // To track the index of the current word

app.get("/", async (req, res) => {
    try {
        // Fetch word data from the serverless function
        const response = await fetchWordFromServerlessFunction(currentWordIndex);

        // If there are available words, select the current word
        let word = "No more words to show.";
        if (response && response.word) {
            word = response.word;
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

        // Redirect back to the homepage
        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while updating the response.");
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

async function fetchWordFromServerlessFunction(index) {
    try {
        const response = await fetch(`/api/sheets?index=${index}`);
        if (!response.ok) {
            throw new Error("Failed to fetch word from serverless function.");
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}
