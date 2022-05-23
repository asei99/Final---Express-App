const router = require('express').Router();
const oracledb = require('oracledb');
const getDbConfig = require('../../service/getDbConfig');
const config = getDbConfig(process.env.APP_ENV);
const verifyToken = require('../../service/verifyToken');

const InvoiceTypeTable = process.env.MS_INV_TYPE;

router.use(verifyToken);

router.get('/all', async (req, res) => {
    let connection;
    let results;
    let maxPage;
    try {
        connection = await oracledb.getConnection(config.config);
        const countResults = await connection.execute(`SELECT COUNT(1) as count FROM ${InvoiceTable}`, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        maxPage = Math.ceil(countResults.rows[0].count / limit);
        // Pagination
        let page = 0;
        if (req.query.hasOwnProperty("page")) {
            page = Number(req.query.page);
        }
        const limit = Number(process.env.PAGE_LIMIT);
        const offset = Number(page) * Number(limit);
        results = await connection.execute(
            `SELECT * FROM ${InvoiceTypeTable} ORDER BY ID OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`
            , { offset: offset, limit: limit }
            , { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, message: "Internal error while inserting data" });
    } finally {
        if (connection) {
            try {
                await connection.close();
                return res.json({ status: true, data: results.rows, maxPage });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ status: false, message: "Internal error while closing database connection" });
            }
        }
    }
});

router.get('/resource', async (req, res) => {
    let connection;
    let results;
    try {
        connection = await oracledb.getConnection(config.config);
        results = await connection.execute(
            `SELECT * FROM ${InvoiceTypeTable} ORDER BY ID`
            , {}
            , { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, message: "Internal error while inserting data" });
    } finally {
        if (connection) {
            try {
                await connection.close();
                return res.json({ status: true, data: results.rows });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ status: false, message: "Internal error while closing database connection" });
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
            `SELECT * FROM ${InvoiceTypeTable} WHERE ID = :id`
            , { id: id }
            , { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, message: "Internal error while inserting data" });
    } finally {
        if (connection) {
            try {
                await connection.close();
                return res.json({ status: true, data: results.rows });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ status: false, message: "Internal error while closing database connection" });
            }
        }
    }
})

router.post('/create', async (req, res) => {
    const { invoice_type_name: invTypeName, user_pic_id: userPicId } = req.body;
    const { USERNAME: crtBy } = req.user;
    const todayDt = new Date();
    let connection;
    let results;
    try {
        connection = await oracledb.getConnection(config.config);
        results = await connection.execute(
            `INSERT INTO ${InvoiceTypeTable} (INV_TYPE_NAME, USER_PIC_ID, CREATED_BY, CREATED_DATE) VALUES(:typeName, :picId, :crtBy, :crtDt)`
            , { typeName: invTypeName, picId: userPicId, crtBy: crtBy, crtDt: todayDt }
            , { autoCommit: true }
        )
        console.log(results);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, message: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
                return res.json({ status: true, data: results.rows });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ status: false, message: "Internal error while closing connection from database" });
            }
        }
    }
})

router.patch('/update', async (req, res) => {
    const { id, invoice_type_name: invTypeName, user_pic_id: userPicId } = req.body;
    const { USERNAME: updBy } = req.user;
    const todayDt = new Date();
    let connection;
    let results;
    try {
        connection = await oracledb.getConnection(config.config);
        results = await connection.execute(
            `UPDATE ${InvoiceTypeTable} SET INV_TYPE_NAME = :typeName, USER_PIC_ID = :picId, UPDATED_BY = :updBy, UPDATED_DATE = :updDt WHERE ID = :id`
            , { id: id, typeName: invTypeName, picId: userPicId, updBy: updBy, updDt: todayDt }
            , { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )
        console.log(results);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, message: err.message });
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

module.exports = router;