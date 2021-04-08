/**
 * startStrapiJest([callback])
 *  
 * Starts a new Strapi instance before every test (with singleton pattern) 
 * and makes the instance globally available with the variable name `strapi`.
 * 
 * The optional callback will be called at the end with the new Strapi instance.
 * 
 * Example:

function populateDatabase(strapiInstance) {
  await strapiInstance.services.restaurant.create({
    name: "Pizza",
  });
}

// creates instance and populates data
startStrapiJest(async (strapiInstance) => {
  await mockApplicationData(strapiInstance);
});

describe("Global setup", () => {
  it("strapi is defined", async (done) => {
    expect(strapi).toBeDefined(); // strapi globally available
    done();
  });
});

 * 
 */

const Strapi = require("strapi");
const http = require("http");
const fs = require("fs-extra");

let instance;

async function startStrapi(callBack) {
  if (!instance) {
    /** the following code in copied from `./node_modules/strapi/lib/Strapi.js` */
    await Strapi().load();
    instance = strapi; // strapi is global now
    await instance.app
      .use(instance.router.routes()) // populate KOA routes
      .use(instance.router.allowedMethods()); // populate KOA methods

    instance.server = http.createServer(instance.app.callback());
  }
  if (callBack) {
    await callBack(instance);
  }
  return instance;
}

async function startStrapiJest(callBack) {
  /** this code is called once before any test is called */
  beforeAll(async (done) => {
    jest.setTimeout(50000);
    await startStrapi(callBack); // singleton so it can be called many times
    done();
  });

  /** this code is called once before all the tested are finished */
  afterAll(async (done) => {
    const dbSettings = strapi.config.get(
      "database.connections.default.settings"
    );

    //delete test database after all tests
    if (dbSettings && dbSettings.filename) {
      // await putOriginalDB();
      const tmpDbFile = `${process.env.PWD}/${dbSettings.filename}`;
      if (fs.existsSync(tmpDbFile)) {
        fs.unlinkSync(tmpDbFile);
      }
    }

    done();
  });
}

module.exports = { startStrapiJest };
