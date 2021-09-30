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
//   const id = req.params.id;
//   const invoiceResults = await db.query(
//     `SELECT id, amt, paid, add_date, paid_date
//         FROM invoices 
//         WHERE id = $1`,
//     [id]
//   );
//   const invoice = invoiceResults.rows[0];
//   if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);
//   const compCodeResults = await db.query(
//     `SELECT comp_code
//         FROM invoices 
//         WHERE id = $1`,
//     [id]
//   );
//   const compCode = compCodeResults.rows[0].comp_code;
//   // console.log(compCode);

//   const companyResults = await db.query(
//     `SELECT code, name, description
//         FROM companies
//         WHERE code = $1`,
//     [compCode]
//   );
//   const company = companyResults.rows[0];
//   invoice.company = company;
//   return res.json({ invoice });

  const id = req.params.id;
  const invoiceResults = await db.query(
      `SELECT id, amt, paid, add_date, paid_date, companies.code, companies.name, companies.description
      FROM invoices
      JOIN companies
      ON invoices.comp_code = companies.code
      WHERE id = $1`,
      [id]
  );
  const invoice = invoiceResults.rows[0];
//   Wouldn't call invoice, call data be MORE descriptive
  // return one object with items, another object with company
  company = {
      code: invoice.code,
      name: invoice.name,
      description: invoice.description
  }
  invoice.company = company;
  delete invoice.code;
  delete invoice.name;
  delete invoice.description;
//   SELECT new variable instead of deleting, destructure the DATA from above

  return res.json({ invoice });
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
//   FOREIGN key constraint, not even making to the database.

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
         VALUES ($1, $2)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );
  const invoice = results.rows[0];
//   WRAP starting at 98 in a try catch, THEN throw error

  return res.status(201).json({ invoice });
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
