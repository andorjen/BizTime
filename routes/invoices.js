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

    const invoices = results.rows;

    return res.json({ invoices });
});

/** GET /[id] - return data about one invoice: 
 * {invoice:{id, amt, paid, add_date, paid_date, company:{code, name, description}}}
 */

router.get("/:id", async function (req, res, next) {

    const id = req.params.id;
    const invoiceResults = await db.query(
        `SELECT id, amt, paid, add_date, paid_date
        FROM invoices 
        WHERE id = $1`,
        [id]
    );
    const invoice = invoiceResults.rows[0];
    if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);
    const compCodeResults = await db.query(
        `SELECT comp_code
        FROM invoices 
        WHERE id = $1`,
        [id]
    );
    const compCode = compCodeResults.rows[0].comp_code;
    // console.log(compCode);

    const companyResults = await db.query(
        `SELECT code, name, description
        FROM companies
        WHERE code = $1`,
        [compCode]
    );
    const company = companyResults.rows[0];
    invoice.company = company;
    return res.json({ invoice });

    // const id = req.params.id;
    // const invoiceResults = await db.query(
    //     `SELECT id, amt, paid, add_date, paid_date, companies.code, companies.name, companies.description
    //     FROM invoices 
    //     JOIN companies
    //     ON invoices.comp_code = companies.code
    //     WHERE id = $1`,
    //     [id]
    // );
    // const invoice = invoiceResults.rows[0];
    // // return one object with items, another object with company
    // company = {
    //     code: invoice.code,
    //     name: invoice.name,
    //     description: invoice.description
    // }
    // invoice.company = company;
    // delete invoice.code;
    // delete invoice.name;
    // delete invoice.description;

    // return res.json({ invoice });
});

/** POST / - create invoice from data; return {invoice:{id, comp_code, amt, paid, add_date, paid_date}} */

router.post("/", async function (req, res, next) {
    const { comp_code, amt } = req.body;
    const companyResults = await db.query(
        `SELECT code
        FROM companies
        WHERE code = $1`,
        [comp_code]
    );
    const companyCode = companyResults.rows[0];
    if (!companyCode) {
        throw new BadRequestError("Not allowed");
    }

    const results = await db.query(
        `INSERT INTO invoices (comp_code, amt)
         VALUES ($1, $2)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [comp_code, amt]
    );
    const invoice = results.rows[0];

    return res.status(201).json({ invoice });
});

/** PUT /[code] - update fields in companies; return {company:{code, name, description}} */

router.put("/:code", async function (req, res, next) {
    if ("code" in req.body) throw new BadRequestError("Not allowed");

    const { name, description } = req.body;
    const code = req.params.code;

    const results = await db.query(
        `UPDATE companies
         SET name=$2, description=$3
         WHERE code = $1
         RETURNING code, name, description`,
        [code, name, description]
    );
    const company = results.rows[0];

    if (!company) throw new NotFoundError(`No matching company: ${code}`);
    return res.json({ company });
});

/** DELETE /[code] - delete company, return `{message: "Company deleted"}` */

router.delete("/:code", async function (req, res, next) {
    const code = req.params.code;
    const results = await db.query(
        `DELETE 
        FROM companies 
        WHERE code = $1 
        RETURNING code`,
        [code]
    );
    const company = results.rows[0];

    if (!company) throw new NotFoundError(`No matching company: ${code}`);
    return res.json({ message: "Company deleted" });
});

module.exports = router;
