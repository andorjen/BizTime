const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  const results = await db.query(
    `INSERT INTO companies (code, name, description)
     VALUES ('test1', 'testName', 'testDescription')
     RETURNING code, name, description`
  );
  testCompany = results.rows[0];
});

afterAll(async function () {
  await db.end();
});

test("/companies", async function () {
  const resp = await request(app).get("/companies");
  expect(resp.body).toEqual({
    companies: [
      {
        code: testCompany.code,
        name: testCompany.name,
      },
    ],
  });
});

/** Get One company from code  */
describe("/companies/:code", function () {
  test("valid code", async function () {
    const resp = await request(app).get("/companies/test1");
    expect(resp.body).toEqual({
      company: {
        code: testCompany.code,
        name: testCompany.name,
        description: testCompany.description,
        invoices: [],
      },
    });
  });
  test("invalid code", async function () {
    const resp = await request(app).get("/companies/badCode");
    expect(resp.body).toEqual({
      error: { message: "No matching company: badCode", status: 404 },
    });
  });
});

/** test post request to /companies */
describe("/companies", function () {
  test("post request with valid data", async function () {
    const resp = await request(app).post("/companies").send({
      code: "testCode2",
      name: "test2",
      description: "testDescription2",
    });
    expect(resp.body).toEqual({
      company: {
        code: "testCode2",
        name: "test2",
        description: "testDescription2",
      },
    });
    const results = await db.query("SELECT COUNT(*) FROM companies");
    expect(results.rows[0].count).toEqual("2");
    expect(resp.statusCode).toEqual(201);
  });
  test("post request with duplicate pk", async function () {
    const resp = await request(app).post("/companies").send({
      code: "test1",
      name: "testName",
      description: "testDescription",
    });
    expect(resp.statusCode).toEqual(500);
    expect(resp.body.error.message).toContain("duplicate key value violates unique constraint");
    const results = await db.query("SELECT COUNT(*) FROM companies");
    expect(results.rows[0].count).toEqual("1");

  });
});

/** test put requests to update company info based on code */
describe(" put /companies/:code", function () {
  test("put with valid code and valid input", async function () {
    const resp = await request(app).put("/companies/test1").send({
      name: "newtestname",
      description: "newtestdescription",
    });
    expect(resp.body).toEqual({
      company: {
        code: "test1",
        name: "newtestname",
        description: "newtestdescription",
      }
    });
    expect(resp.statusCode).toEqual(200);
  });
  test("put request with invalid comp code", async function () {
    const resp = await request(app).put("/companies/somethingelse").send({
      name: "newtestname",
      description: "newtestdescription",
    });
    expect(resp.body).toEqual({
      error: { message: "No matching company: somethingelse", status: 404 }
    });

  });
});

/** test delete requests to delete a company */
describe(" delete /companies/:code", function () {
  test("delete with a valid company code", async function () {
    const resp = await request(app).delete('/companies/test1');
    expect(resp.body).toEqual({ message: "Company deleted" });
    expect(resp.statusCode).toEqual(200);

    const results = await db.query("SELECT COUNT(*) FROM companies");
    expect(results.rows[0].count).toEqual("0");
  });

  test("delete with an invalid company code", async function () {
    const resp = await request(app).delete('/companies/somethingelse');
    expect(resp.body).toEqual({
      error: { message: "No matching company: somethingelse", status: 404 }
    });

    const results = await db.query("SELECT COUNT(*) FROM companies");
    expect(results.rows[0].count).toEqual("1");
  });
});
