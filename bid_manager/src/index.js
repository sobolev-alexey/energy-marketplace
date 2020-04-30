const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { writeData, readData, readAllData, removeData } = require('./database');

const app = express();
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(bodyParser.json());


try {

} catch (error) {
    console.error(error);
}

/*
Get company details
*/
app.get('/company', cors(corsOptions), async (req, res) => {
    try {
        const companyNumber = req.query.company;
        if (companyNumber) {
            const data = await readData('company', companyNumber);
            res.json({
                status: 'success',
                data
            });
        } else {
            const data = await readAllData('company');
            res.json({
                status: 'success',
                data
            });
        }
    } catch (e) {
        console.error(e);
        res.json({
            status: 'failure',
            error: JSON.stringify(e)
        });
    }
});

app.post('/activate', cors(corsOptions), async (req, res) => {
    // res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    // res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    try {
        const companyNumber = req.body.company;
        if (companyNumber) {
            const company = await readData('company', companyNumber);
            await createOrUpdateCompany({ ...company, CompanyStatus: 'Active' });
            res.json({
                status: 'success'
            });
        }
    } catch (e) {
        console.error(e);
        res.json({
            status: 'failure',
            error: JSON.stringify(e)
        });
    }
});

module.exports = app;
