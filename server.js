const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

var memory = [];

const calcPoints = (receipt) => {
    var points = 0;

    // Each if statement before the rule is checking if that part of the receipt actually exists.
    // I'm not sure if this is needed for the project, but this is avoiding errors if it doesn't exist.

    /* RULES */
    if (receipt.retailer) {
        // One point for every alphanumeric character in the retailer name.
        var alphaNumericCount = 0;
        for (let i = 0; i < receipt.retailer.length; i++) {
            var code = receipt.retailer.charCodeAt(i);

            if (code > 47 && code < 58) {   // Checking if 0-9
                alphaNumericCount += 1;
            } else if (code > 64 && code < 91) {    // Checking if A-Z
                alphaNumericCount += 1;
            } else if (code > 96 && code < 123) {   // Checking if a-z   
                alphaNumericCount += 1;
            }
        }
        points += alphaNumericCount;
    }

    if (receipt.total) {
        // 50 points if the total is a round dollar amount with no cents.
        if (receipt.total.split(".")[1] === '00') {
            points += 50;
        }
        
        // 25 points if the total is a multiple of 0.25.
        if (receipt.total % 0.25 === 0) {
            points += 25;
        }
    }

    if (receipt.items) {
        // 5 points for every two items on the receipt.
        points += Math.floor(receipt.items.length / 2) * 5;
        
        // If the trimmed length of the item description is a multiple of 3, 
        // multiply the price by 0.2 and round up to the nearest integer. 
        // The result is the number of points earned.
        for (let i = 0; i < receipt.items.length; i++) {
            if (receipt.items[i].shortDescription.trim().length % 3 === 0) {
                var pts = Math.ceil(receipt.items[i].price * 0.2);
                points += pts;
            }
        }
    }

    if (receipt.purchaseDate) {
        // 6 points if the day in the purchase date is odd.
        if (receipt.purchaseDate.split("-")[2] % 2 !== 0) {
            points += 6;
        }
    }

    if (receipt.purchaseTime) {
        // 10 points if the time of purchase is after 2:00pm and before 4:00pm.
        // I'm assuming after and before mean that 2:00pm and 4:00pm don't count.
        var time = receipt.purchaseTime.split(":");
        if (time[0] >= 14 && time[1] > 0) {
            if (time[0] < 16) {
                points += 10;
            }
        }
    }

    return points;
}

// Simple endpoint just to check the server.
app.get('/', (req, res) => {
    try {
        res.json({ "Status": "Server is running!" })
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: "Something went wrong." });
    }
});

// POST
app.post('/receipts/process', (req, res) => {
    try {
        // Grabbing request body and generating id.
        const body = req.body;
        const id = uuidv4();

        // Calculating points based on the rules laid out.
        const points = calcPoints(body);

        // Pushing object with keys id & points to memory array to be filtered by id in the GET request.
        memory.push({ id: id, points: points });
        res.json({ "id": id })
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: "Something went wrong." });
    }
});

// GET
app.get('/receipts/:id/points', (req, res) => {
    try {
        const id = req.params.id;

        // Memory is an array of objects, so I'm filtering the array to show only objects whose id matches the parameter.
        const result = memory.filter(param => param.id === id);

        res.json({ points: result[0].points });
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: "Sorry, this id doesn't exist." });
    }
});

const port = 8080;
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
});

module.exports = app;