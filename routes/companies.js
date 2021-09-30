/** Routes about companies. */

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();
const db = require("../db");

/** GET / - returns {companies: [{code,name}, ...]} */

router.get("/", async function (req, res, next) {
  const results = await db.query(`
        SELECT code, name 
        FROM companies`);

  const companies = results.rows;

  return res.json({ companies });
});

/** GET /[code] - return data about one company: {company:{code, name, description}}*/

router.get("/:code", async function (req, res, next) {
  const code = req.params.code;
  const results = await db.query(
    `SELECT code, name , description
        FROM companies 
        WHERE code = $1`,
    [code]
  );
  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ company });
});

/** POST / - create company from data; return {company:{code, name, description}} */

router.post("/", async function (req, res, next) {
  const { code, name, description } = req.body;

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
         VALUES ($1, $2, $3)
         RETURNING code, name, description`,
    [code, name, description]
  );
  const company = results.rows[0];

  return res.status(201).json({ company });
});

/** PUT /[code] - update fields in companies; return {company:{code, name, description}} */

router.put("/:code", async function (req, res, next) {
  if ("code" in req.body) throw new BadRequestError("Not allowed");

  const { name, description } = req.body;
  const code = req.params.code;
  const results = await db.query(
    `UPDATE companies
         SET code=$1, name=$2, description=$3
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
    `DELETE FROM companies 
    WHERE code = $1 
    RETURNING code`,
    [code]
  );
  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ message: "Company deleted" });
});

module.exports = router;
