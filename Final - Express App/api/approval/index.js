const router = require('express').Router();
const oracledb = require('oracledb');
const getDbConfig = require('../../service/getDbConfig');
const config = getDbConfig(process.env.APP_ENV);
const verifyToken = require('../../service/verifyToken');

const InvoiceTable = process.env.INVOICE_TRX;

router.use(verifyToken);

router.get('/all', async (req, res) => {
    let connection;
    let results;
    let maxPage;
    try {
        connection = await oracledb.getConnection(config.config);
        // Define pagination maxPage
        const countResults = await connection.execute(`SELECT COUNT(1) as count FROM ${InvoiceTable}`, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(countResults.rows[0].count);
        maxPage = Math.ceil(countResults.rows[0].count / limit);
        // Pagination
        let page = 0;
        if (req.query.hasOwnProperty("page")) {
            page = Number(req.query.page);
        }
        const limit = Number(process.env.PAGE_LIMIT);
        const offset = Number(page) * Number(limit);
        results = await connection.execute(
            `SELECT * FROM ${InvoiceTable} ORDER BY ID OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`
            , [offset, limit]
            , { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )
        console.log(results);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ status: false, message: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                return res.json({ status: true, data: results.rows, maxPage })
            } catch (err) {
                console.error(err);
                return res.status(500).json({ status: false, message: "Error while closing database connection!" });
            }
        }
    }
})

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    let results;
    try {
        connection = await oracledb.getConnection(config.config);
        results = await connection.execute(
            `SELECT * FROM ${InvoiceTable} WHERE ID=:id`
            , { id: id }
            , { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )
        console.log(results);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ status: false, message: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                return res.json({ status: true, data: results.rows });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ status: false, message: "Error while closing database connection!" });
            }
        }
    }
})

router.post('/create', async (req, res) => {
    const { amount = 0, description, invoice_type_id: invTypeId } = req.body;
    const { USERNAME: crtBy } = req.user;
    const todayDt = new Date();
    let connection;
    let results;
    try {
        connection = await oracledb.getConnection(config.config);
        results = await connection.execute(
            `INSERT INTO ${InvoiceTable} (AMOUNT, DESCRIPTION, STATUS, INVOICE_TYPE_ID, CREATED_BY, CREATED_DATE) VALUES (:amt, :desc, :stat, :invTypeId, :crtBy, :crtDt)`
            , { amt: amount, desc: description, stat: 'NEW', invTypeId: invTypeId, crtBy: crtBy, crtDt: todayDt }
            , { autoCommit: true }
        )
        console.log(results);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, message: "Internal error while inserting data into database" });
    } finally {
        if (connection) {
            try {
                await connection.close();
                return res.json({ status: true, data: results });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ status: false, message: "Internal error while closing connection from database" });
            }
        }
    }
})

router.post('/approve', async (req, res) => {
    const { id } = req.params;
    const todayDt = new Date();
    const { USERNAME: apvBy } = req.user;
    let connection;
    let results;
    try {
        connection = await oracledb.getConnection(config.config);
        results = await connection.execute(
            `UPDATE ${InvoiceTable} SET STATUS = :stat,APPROVED_BY = :apvBy, APPROVED_DATE = :apvDt WHERE ID=:id`
            , { id: id, stat: "APPROVED", apvBy: apvBy, apvDt: todayDt }
            , { autoCommit: true }
        )
        console.log(results);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, message: `Internal error while updating data on table ${InvoiceTable}` });
    } finally {
        if (connection) {
            try {
                await connection.close();
                return res.json({ status: true, data: results })
            } catch (err) {
                console.error(err);
                return res.status(500).json({ status: false, message: "Internal error while closing connection from database" });
            }
        }
    }
})

router.post('/reject', async (req, res) => {
    const { id } = req.params;
    const todayDt = new Date();
    const { USERNAME: updBy } = req.user;
    let connection;
    let results;
    try {
        connection = await oracledb.getConnection(config.config);
        results = await connection.execute(
            `UPDATE ${InvoiceTable} SET STATUS = :stat,UPDATED_BY = :updBy, UPDATED_DATE = :updDt WHERE ID=:id`
            , { id: id, stat: "REJECTED", updBy: updBy, updDt: todayDt }
            , { autoCommit: true }
        )
        console.log(results);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, message: `Internal error while updating data on table ${InvoiceTable}` });
    } finally {
        if (connection) {
            try {
                await connection.close();
                return res.json({ status: true, data: results })
            } catch (err) {
                console.error(err);
                return res.status(500).json({ status: false, message: "Internal error while closing connection from database" });
            }
        }
    }
})

router.patch('/update', async (req, res) => {
    const { id, amount = 0, description } = req.body;
    const { USERNAME: updBy } = req.user;
    const todayDt = new Date();

    let connection;
    let results;
    try {
        connection = await oracledb.getConnection(config.config);
        results = await connection.execute(
            `UPDATE ${InvoiceTable} SET AMOUNT  = :amt, DESCRIPTION = :desc, STATUS = :status, UPDATED_BY = :updBy, UPDATED_DATE = :updDt WHERE ID = :id`
            , { id: id, amt: amount, desc: description, status: "UPDATED", updBy: updBy, updDt: todayDt }
            , { autoCommit: true }
        )
        console.log(results);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, message: err.message || "Internal erroro while inserting data to database" });
    } finally {
        if (connection) {
            try {
                await connection.close();
                return res.json({ status: true, data: results });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ status: false, message: "Internal error while closing connection from database" });
            }
        }
    }
})

module.exports = router;