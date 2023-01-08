const express = require("express");
const router = express.Router();
const axios = require('axios');
// Importing modules
const PDFDocument = require('pdfkit');
const PDFDocumentTable = require("pdfkit-table");
const fs = require('fs');
const FormData = require('form-data');


function getFileName(parentCompany, date, clientName) {
    const cleanString = (nameStr) => {
        nameStr = nameStr || "";
        if (nameStr) {
            nameStr = nameStr.trim();
            nameStr = nameStr.replace(/ /g, "_");
        }
        return nameStr;
    };
    const fileNameArr = [];
    parentCompany = parentCompany || "";
    parentCompany && fileNameArr.push(cleanString(parentCompany));
    clientName = clientName || "";
    clientName && fileNameArr.push(cleanString(clientName));

    date && fileNameArr.push(date);
    return fileNameArr.join("_");
}

const getReceiptNumber = () => {
    return Math.floor(1000 + Math.random() * 9000);
};

router.post("/", async (req, res) => {
    try {
        const {
            parentCompany,
            date,
            clientName,
            amount,
            payment,
            clientPhone,
            clientEmail,
            user
        } = req.body;
        const dateInst = new Date(date);
        const dateArr = [dateInst.getDate(), dateInst.getMonth() + 1, dateInst.getFullYear()];
        const dateStr = dateArr.join("-");
        const fileName = getFileName(parentCompany, dateStr, clientName);

        let paymentTxt = payment.mode;
        if (payment.mode === "cheque") {
            paymentTxt += " (" + payment.chequeNumber + ")";
        }

        const table = {
            title: "Receipt ",
            subtitle: parentCompany + "    " + dateStr,
            headers: ["Client Name", "Amount", "Payment"],
            rows: [
                [clientName, amount, (paymentTxt || "")],
            ],
        };

        const doc = new PDFDocumentTable();
        // Saving the pdf file in root directory.
        doc.pipe(fs.createWriteStream('./invoices/' + user + '-' + fileName + ".pdf"));
        const json = [

            {
                title: "Receipt ",
                subtitle: parentCompany + "    " + dateStr + "      No:" + getReceiptNumber(),
                headers: ["Client Name", "Amount", "Payment"],
                rows: [
                    [clientName, amount, (paymentTxt || "")],
                ],
            }
        ];


        // if json file is array
        Array.isArray(json) ?
            // any tables
            json.forEach(table => doc.table(table, table.options || {})) :
            doc.table(json, json.options || {});
        // await doc.table(table, {
        //     columnsSize: [200, 100, 100],
        // });

        // Finalize PDF file
        await doc.end();

        res.json({ status: "ok", message: './invoices/' + fileName + ".pdf created" });
    } catch (error) {
        res.json({ msg: error });
    }
});

router.get("/getUpdates", async (req, res) => {
    try {
        let userData = fs.readFileSync('./data/data.json', 'utf8');
        res.json(JSON.parse(userData));
    } catch (error) {
        res.json({ msg: error });
    }
});



module.exports = router;