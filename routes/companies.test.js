const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompanyCode;
let testInvoice;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  const results = await db.query(
    `INSERT INTO companies (code, name, description)
     VALUES ('test1', 'testName', 'testDescription')
     RETURNING code, name, description`
  );
  testCompanyCode = results.rows[0].code;
});

afterAll(async function () {
  await db.end();
});

test("/companies", async function () {
  const resp = await request(app).get("/companies");
  expect(resp.body).toEqual({
    companies: [
      {
        code: "test1",
        name: "testName",
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
        code: "test1",
        name: "testName",
        description: "testDescription",
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

describe("/companies/", function () {
  test("POST", async function () {
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
});

// test("PATCH /users/:id", async function () {
//   const resp = await request(app)
//     .patch(`/users/${testUserId}`)
//     .send({ name: "Joel2", type: "dev2" });
//   expect(resp.body).toEqual({
//     user: {
//       id: expect.any(Number),
//       name: "Joel2",
//       type: "dev2",
//     },
//   });
//   const results = await db.query("SELECT COUNT(*) FROM users");
//   expect(results.rows[0].count).toEqual("1");
// });

// test("DELETE /users/:id", async function () {
//   const resp = await request(app).delete(`/users/${testUserId}`);
//   expect(resp.body).toEqual({ message: "Deleted" });
//   const results = await db.query("SELECT COUNT(*) FROM users");
//   expect(results.rows[0].count).toEqual("0");
// });
