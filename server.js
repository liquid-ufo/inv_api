const express = require('express');
const cors = require("cors");
const axios = require('axios');
const connectDB = require("./config/db");
const fs = require('fs');
require('dotenv').config();
// Importing required libraries
const cron = require("node-cron");
const FormData = require('form-data');

const CONSTANTS = require("./constant");

// swagger config
const swaggerUi = require("swagger-ui-express");
const swaggerDoc = require("./swagger.json");

// connectDB();

const app = express();
app.use(cors());

/**Middlewares */
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
    res.send("You got me");
});

app.get("/hello", (req, res) => {
    res.send("You got me");
});

// Define routes
app.use("/api/users", require("./routes/user"));
app.use("/api/auth", require("./routes/auth"));
// app.use("/api/profile", require("./routes/api/profile"));
// app.use("/api/job", require("./routes/api/job"));

app.use("/api/testpdf", require("./routes/testpdf"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

async function getUpdates() {
    const token = CONSTANTS.BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/getUpdates`;

    const response = await axios.post(url);
    return response;
};

const parseBotData = (response) => {
    let data = {};
    if (response
        && response.data
        && response.data.ok
        && Array.isArray(response.data.result)
    ) {
        response.data.result.forEach(item => {
            if (!item.message.from.is_bot) {
                const from = item.message.from;
                const fullName = [];
                from.first_name ? fullName.push(from.first_name) : null;
                from.last_name ? fullName.push(from.last_name) : null;
                data[String(item.message.from.id)] = fullName.join(" ");
            }
        });
    }

    return data;
};

async function sendMessage(path, fileName, user) {
    const token = CONSTANTS.BOT_TOKEN;;
    const url = `https://api.telegram.org/bot${token}/sendDocument`;
    const chatID = user;
    const formData = new FormData();
    formData.append('chat_id', chatID);
    formData.append('document', fs.createReadStream(path), fileName);

    const response = await axios.post(url, formData, {
        headers: formData.getHeaders(),
    })

    return response;
};

// Creating a cron job which runs on every 10 second
cron.schedule("*/10 * * * * *", async () => {
    // console.log("running a task every 10 second");
    clearQueue();

    let userData = fs.readFileSync('./data/data.json', 'utf8');
    try {
        userData = userData ? JSON.parse(userData) : {};
        const botUpdatesResponse = await getUpdates();
        const botData = parseBotData(botUpdatesResponse);

        const dataToDump = Object.assign({}, userData, botData);

        fs.writeFile("./data/data.json", JSON.stringify(dataToDump), (error) => {
            if (error) {
                console.log('An error has occurred ', error);
                return;
            }
            // console.log('Data written successfully to disk');
        });
    } catch (error) {
        console.log(error);
    }
});

function readFiles(dirname, onFileContent, onError) {
    fs.readdir(dirname, async (err, filenames) => {
        if (err) {
            onError(err);
            return;
        }

        for (let index = 0; index < filenames.length; index++) {
            const element = filenames[index];
            const fileName = filenames[index] || "";
            const user = fileName.split("-")[0];
            const path = 'invoices/' + fileName;

            // sendMessage();
            const pdfresponse = await sendMessage(path, fileName + ".pdf", user);
            console.log("pdfresponse:", pdfresponse);
            if (pdfresponse.statusText === "OK") {
                const deleteResponse = fs.unlinkSync(path);
                console.log("deleteResponse:", deleteResponse);

            }
        }

    });
}

const clearQueue = () => {
    let data = {};
    readFiles('invoices/', (filename, content) => {
        data[filename] = content;
    }, (err) => {
        throw err;
    });
};

app.listen(PORT, () => {
    console.log("Server started at:", __dirname, PORT);
});

