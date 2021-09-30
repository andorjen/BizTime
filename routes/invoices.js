/** Routes about invoices. */

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();
const db = require("../db");

/** GET / - returns {invoices: [{id,comp_code}, ...]} */

router.get("/", async function (req, res, next) {
    const results = await db.query(`
        SELECT id, comp_code 
        FROM invoices`);
    // Always order by id 


    const invoices = results.rows;

    return res.json({ invoices });
});

/** GET /[id] - return data about one invoice:
 * {invoice:{id, amt, paid, add_date, paid_date, company:{code, name, description}}}
 */

router.get("/:id", async function (req, res, next) {

    const invoiceId = req.params.id;
    const invoiceResults = await db.query(
        `SELECT id, amt, paid, add_date, paid_date, companies.code, companies.name, companies.description
      FROM invoices
      JOIN companies
      ON invoices.comp_code = companies.code
      WHERE id = $1`,
        [invoiceId]
    );
    const data = invoiceResults.rows[0];
    const { id, amt, paid, add_date, paid_date, code, name, description } = data;
    const invoice = {
        id, amt, paid, add_date, paid_date, company: { code, name, description }
    };

    return res.json({ invoice });
});

/** POST / - create invoice from data; return {invoice:{id, comp_code, amt, paid, add_date, paid_date}} */

router.post("/", async function (req, res, next) {
    const { comp_code, amt } = req.body;

    try {
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt)
         VALUES ($1, $2)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        );
        const invoice = results.rows[0];
        return res.status(201).json({ invoice });
    }
    catch {
        throw new BadRequestError("Not allowed");
    }

});

/** PUT /[id] - update amt in invoices; return {invoice:{id, comp_code, amt, paid, add_date, paid_date}} */

router.put("/:id", async function (req, res, next) {
    if ("id" in req.body) throw new BadRequestError("Not allowed");

    const { amt } = req.body;
    const id = req.params.id;

    const results = await db.query(
        `UPDATE invoices
         SET amt=$2
         WHERE id = $1
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [id, amt]
    );
    const invoice = results.rows[0];

    if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);
    return res.json({ invoice });
});

/** DELETE /[id] - delete invoice, return `{message: "Invoice deleted"}` */

router.delete("/:id", async function (req, res, next) {
    const id = req.params.id;
    const results = await db.query(
        `DELETE 
        FROM invoices 
        WHERE id = $1 
        RETURNING id`,
        [id]
    );

    const invoice = results.rows[0];

    if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);
    return res.json({ message: "Invoice deleted" });
});

module.exports = router;
